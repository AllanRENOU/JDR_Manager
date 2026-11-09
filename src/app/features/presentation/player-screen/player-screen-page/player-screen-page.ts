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
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { DATA_REPOSITORY } from '../../../../core/data/data-repository';
import { MediaUrls } from '../../../../core/media/media-urls';
import { Id } from '../../../../core/models';
import { Theme } from '../../../../core/theme/theme';
import { PLAYER_CHANNEL_FACTORY, PlayerChannel, PlayerMessage } from '../player-channel';

/** Ce que l'écran du MJ demande d'afficher. */
type PlayerView =
  { kind: 'waiting' } | { kind: 'clear' } | { kind: 'battlemap'; sceneId: Id; battlemapId: Id };

/**
 * Fenêtre joueurs (`/projects/:projectId/player`, AFF-02, TRD §9) : la battlemap courante en plein
 * écran sur fond noir, sans aucun contrôle. Synchronisée avec l'écran du MJ par `BroadcastChannel` ;
 * elle résout elle-même l'image à partir des identifiants reçus. Double-clic : plein écran.
 */
@Component({
  selector: 'app-player-screen-page',
  imports: [TranslocoPipe],
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
    let channel: PlayerChannel | null = null;
    const window = this.document.defaultView;
    const bye = () => channel?.postMessage({ type: 'bye' });
    effect((onCleanup) => {
      const projectId = this.projectId();
      untracked(() => {
        channel = this.createChannel(projectId);
        channel.onmessage = (event) => this.receive(event.data, channel!);
        // Ouverture ou rechargement : demande l'état courant (TRD §9).
        channel.postMessage({ type: 'ping' });
      });
      onCleanup(() => {
        bye();
        channel?.close();
        channel = null;
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
        this.view.set({ kind: 'clear' });
        break;
      case 'theme':
        this.theme.setTheme(message.theme);
        break;
      case 'hello':
        // L'écran du MJ redémarre : on se signale et on redemande l'état.
        channel.postMessage({ type: 'ping' });
        break;
    }
  }
}
