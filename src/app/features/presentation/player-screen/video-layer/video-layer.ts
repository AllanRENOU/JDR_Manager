import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { MediaUrls } from '../../../../core/media/media-urls';
import { Id } from '../../../../core/models';
import { PlayerMessage } from '../player-channel';

/** Intervalle d'envoi de l'état de la vidéo à l'écran du MJ (temps restant de la carte, CTL-13). */
export const VIDEO_STATE_INTERVAL_MS = 1000;

/** Vidéo en cours dans la fenêtre joueurs. */
interface CurrentVideo {
  videoId: Id;
  mediaId: Id;
}

/** Messages de l'écran du MJ qui concernent la vidéo. */
export type VideoCommand = Extract<
  PlayerMessage,
  { type: 'play-video' | 'pause-video' | 'resume-video' | 'stop-video' | 'video-volume' }
>;

/** Messages renvoyés à l'écran du MJ. */
export type VideoReport = Extract<
  PlayerMessage,
  { type: 'video-state' | 'video-ended' | 'video-error' | 'video-muted' }
>;

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

/**
 * Lecteur vidéo de la fenêtre joueurs (VID-06, TEC-44, TEC-47, TRD §9.1) : un `<video>` posé
 * par-dessus la battlemap, en entier sur fond noir, sans contrôle ; masqué quand aucune vidéo ne
 * passe, pour laisser réapparaître la battlemap.
 *
 * La page lui transmet les commandes de l'écran du MJ (`handle`) et renvoie ses comptes rendus
 * (`report`). Le fichier est lu par une URL `blob:` obtenue de `MediaUrls`, libérée à la fin.
 * Lecture avec le son refusée (fenêtre qui n'a reçu aucun clic) : la vidéo passe muette et
 * `video-muted` est envoyé ; un clic dans la fenêtre autorise ensuite le son.
 */
@Component({
  selector: 'app-video-layer',
  templateUrl: './video-layer.html',
  styleUrl: './video-layer.scss',
  host: { '(document:pointerdown)': 'allowSound()' },
})
export class VideoLayer {
  private readonly mediaUrls = inject(MediaUrls);
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');

  /** Comptes rendus à envoyer à l'écran du MJ. */
  readonly report = output<VideoReport>();

  /** Vidéo en cours (affichée) ; `null` : la battlemap est visible. */
  protected readonly current = signal<CurrentVideo | null>(null);

  /** Un clic a eu lieu dans la fenêtre : le son des vidéos est autorisé. */
  private soundAllowed = false;
  /** Numéro de la dernière lecture demandée : une lecture remplacée s'arrête là. */
  private generation = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Média dont l'URL est détenue (à libérer). */
  private acquired: Id | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop(false));
  }

  /** Applique une commande de l'écran du MJ. */
  handle(command: VideoCommand): void {
    switch (command.type) {
      case 'play-video':
        void this.play(command.videoId, command.mediaId, command.volume);
        break;
      case 'pause-video':
        if (this.current()) {
          this.video.pause();
        }
        break;
      case 'resume-video':
        if (this.current()) {
          this.video.play().catch(() => undefined);
        }
        break;
      case 'stop-video':
        this.stop(true);
        break;
      case 'video-volume':
        if (this.current()) {
          this.video.volume = clampVolume(command.volume);
          this.sendState();
        }
        break;
    }
  }

  /** Arrête la vidéo en cours ; `notify` : prévient l'écran du MJ (`video-ended`). */
  stop(notify: boolean): void {
    this.generation++;
    this.clearTimer();
    const current = this.current();
    this.current.set(null);
    // À la destruction, la vue peut déjà être détachée.
    const video = this.videoRef()?.nativeElement;
    if (video?.getAttribute('src')) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    this.releaseUrl();
    if (notify && current) {
      this.report.emit({ type: 'video-ended', videoId: current.videoId });
    }
  }

  /** Premier clic dans la fenêtre joueurs : le son est autorisé, y compris pour la vidéo en cours. */
  protected allowSound(): void {
    this.soundAllowed = true;
    if (this.current() && this.video.muted) {
      this.video.muted = false;
      this.sendState();
    }
  }

  protected onEnded(): void {
    if (this.current()) {
      this.stop(true);
    }
  }

  /** Fichier illisible : la vidéo est abandonnée et l'écran du MJ prévenu. */
  protected onError(): void {
    const current = this.current();
    if (current && this.video.getAttribute('src')) {
      this.fail(current.videoId);
    }
  }

  protected sendState(): void {
    const current = this.current();
    if (!current) {
      return;
    }
    const video = this.video;
    const ms = (seconds: number) => (Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0);
    this.report.emit({
      type: 'video-state',
      videoId: current.videoId,
      positionMs: ms(video.currentTime),
      durationMs: ms(video.duration),
      paused: video.paused,
      muted: video.muted,
      volume: video.volume,
    });
  }

  private get video(): HTMLVideoElement {
    return this.videoRef()!.nativeElement;
  }

  private async play(videoId: Id, mediaId: Id, volume: number): Promise<void> {
    // Une seule vidéo à la fois : la précédente est remplacée sans compte rendu (VID-06).
    this.stop(false);
    const generation = this.generation;
    this.current.set({ videoId, mediaId });

    let url: string;
    try {
      url = await this.mediaUrls.acquire(mediaId);
    } catch {
      if (generation === this.generation) {
        this.fail(videoId);
      }
      return;
    }
    if (generation !== this.generation) {
      this.mediaUrls.release(mediaId);
      return;
    }
    this.acquired = mediaId;

    const video = this.video;
    video.volume = clampVolume(volume);
    video.muted = false;
    video.src = url;
    try {
      await video.play();
    } catch (error) {
      if (generation !== this.generation) {
        return;
      }
      if ((error as DOMException | undefined)?.name !== 'NotAllowedError') {
        this.fail(videoId);
        return;
      }
      // Lecture automatique avec le son refusée : on rejoue muet et on prévient le MJ (TEC-47).
      video.muted = true;
      try {
        await video.play();
      } catch {
        if (generation === this.generation) {
          this.fail(videoId);
        }
        return;
      }
      if (generation !== this.generation) {
        return;
      }
      this.report.emit({ type: 'video-muted', videoId });
      if (this.soundAllowed) {
        video.muted = false;
      }
    }
    if (generation !== this.generation) {
      return;
    }
    this.sendState();
    this.timer = setInterval(() => this.sendState(), VIDEO_STATE_INTERVAL_MS);
  }

  private fail(videoId: Id): void {
    this.stop(false);
    this.report.emit({ type: 'video-error', videoId });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private releaseUrl(): void {
    if (this.acquired) {
      this.mediaUrls.release(this.acquired);
      this.acquired = null;
    }
  }
}
