import {
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { DATA_REPOSITORY } from '../../../../core/data/data-repository';
import { MediaUrls } from '../../../../core/media/media-urls';
import { Id } from '../../../../core/models';
import { Theme } from '../../../../core/theme/theme';
import { PLAYER_CHANNEL_FACTORY, PlayerChannel, PlayerMessage } from '../player-channel';
import { VideoLayer, VideoReport } from '../video-layer/video-layer';

/** Ce que l'écran du MJ demande d'afficher. */
type PlayerView =
  { kind: 'waiting' } | { kind: 'clear' } | { kind: 'battlemap'; sceneId: Id; battlemapId: Id };

/**
 * Fenêtre joueurs (`/projects/:projectId/player`, AFF-02, TRD §9) : la battlemap courante en plein
 * écran sur fond noir, sans aucun contrôle, et par-dessus la vidéo lancée par le MJ (`VideoLayer`,
 * VID-06). Synchronisée avec l'écran du MJ par `BroadcastChannel` ;
 * elle résout elle-même l'image à partir des identifiants reçus. Double-clic : plein écran.
 */
@Component({
  selector: 'app-player-screen-page',
  imports: [TranslocoPipe, VideoLayer],
  templateUrl: './player-screen-page.html',
  styleUrl: './player-screen-page.scss',
  host: { '(dblclick)': 'toggleFullscreen()' },
})
export class PlayerScreenPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly theme = inject(Theme);
  private readonly document = inject(DOCUMENT);
  private readonly createChannel = inject(PLAYER_CHANNEL_FACTORY);

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  protected readonly view = signal<PlayerView>({ kind: 'waiting' });
  private readonly videoLayer = viewChild.required(VideoLayer);
  /** Canal ouvert vers l'écran du MJ ; `null` avant l'ouverture et après la fermeture. */
  private channel: PlayerChannel | null = null;

  private readonly sceneBattlemaps = resource({
    params: () => {
      const view = this.view();
      return view.kind === 'battlemap' ? view.sceneId : undefined;
    },
    loader: ({ params }) => this.repository.listBattlemaps(params),
  });
  private readonly mediaId = computed(() => {
    const view = this.view();
    if (view.kind !== 'battlemap' || !this.sceneBattlemaps.hasValue()) {
      return null;
    }
    return this.sceneBattlemaps.value().find((b) => b.id === view.battlemapId)?.mediaId ?? null;
  });
  protected readonly image = inject(MediaUrls).track(() => this.mediaId());

  constructor() {
    const window = this.document.defaultView;
    const bye = () => this.channel?.postMessage({ type: 'bye' });
    effect((onCleanup) => {
      const projectId = this.projectId();
      untracked(() => {
        const channel = this.createChannel(projectId);
        this.channel = channel;
        channel.onmessage = (event) => this.receive(event.data, channel);
        // Ouverture ou rechargement : demande l'état courant (TRD §9).
        channel.postMessage({ type: 'ping' });
      });
      onCleanup(() => {
        bye();
        this.channel?.close();
        this.channel = null;
      });
    });
    window?.addEventListener('pagehide', bye);
    inject(DestroyRef).onDestroy(() => window?.removeEventListener('pagehide', bye));
  }

  protected toggleFullscreen(): void {
    if (this.document.fullscreenElement) {
      void this.document.exitFullscreen?.();
    } else {
      void this.document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }

  private receive(message: PlayerMessage, channel: PlayerChannel): void {
    switch (message.type) {
      case 'show-battlemap':
        this.view.set({
          kind: 'battlemap',
          sceneId: message.sceneId,
          battlemapId: message.battlemapId,
        });
        break;
      case 'clear':
        // L'écran du MJ est quitté : écran noir, vidéo terminée (TRD §9.1).
        this.videoLayer().stop(true);
        this.view.set({ kind: 'clear' });
        break;
      case 'theme':
        this.theme.setTheme(message.theme);
        break;
      case 'hello':
        // L'écran du MJ redémarre : on se signale et on redemande l'état.
        channel.postMessage({ type: 'ping' });
        break;
      case 'play-video':
      case 'pause-video':
      case 'resume-video':
      case 'stop-video':
      case 'video-volume':
        this.videoLayer().handle(message);
        break;
    }
  }

  /** Compte rendu du lecteur vidéo, renvoyé à l'écran du MJ. */
  protected sendReport(report: VideoReport): void {
    this.channel?.postMessage(report);
  }
}
