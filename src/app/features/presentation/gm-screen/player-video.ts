import { Injectable, Signal, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { Id } from '../../../core/models';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { AudioPlayer } from '../audio/audio-player';
import { PlayerMessage } from '../player-screen/player-channel';

/** Vidéo en cours dans la fenêtre joueurs, vue de l'écran du MJ (carte « Vidéo en cours », CTL-13). */
export interface PlayingVideo {
  /** Nœud de bibliothèque de la vidéo. */
  videoId: Id;
  name: string;
  positionMs: number;
  /** 0 tant que la durée n'est pas connue. */
  durationMs: number;
  paused: boolean;
  /** Lecture avec le son refusée par le navigateur (VID-12). */
  muted: boolean;
  /** Volume de 0 à 1. */
  volume: number;
}

/** Vidéo à lancer : nœud de bibliothèque déjà résolu par le moteur. */
export interface VideoRequest {
  videoId: Id;
  mediaId: Id;
  name: string;
  volume: number;
}

/** Sortie vers la fenêtre joueurs, branchée par `PlayerWindow`. */
export interface VideoOutput {
  post(message: PlayerMessage): void;
  /** Une fenêtre joueurs est ouverte. */
  open: Signal<boolean>;
}

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

/**
 * Côté MJ, la vidéo de la fenêtre joueurs (TEC-45, TRD §9.1) : l'écran du MJ ne lit jamais le
 * fichier, il envoie des commandes et suit l'état renvoyé par la fenêtre joueurs (signal `video`).
 * Pendant une vidéo, les sons sont coupés (`AudioPlayer.duck`, VID-08), y compris en pause. Rien
 * n'est enregistré dans la partie (TEC-48).
 *
 * Fourni par l'écran de Présentation ; `PlayerWindow` y branche le canal (`attach`) et lui
 * transmet les messages reçus (`receive`) et la fermeture de la fenêtre (`end`).
 */
@Injectable()
export class PlayerVideo {
  private readonly audio = inject(AudioPlayer);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  private output: VideoOutput | null = null;
  private readonly state = signal<PlayingVideo | null>(null);

  /** Vidéo en cours ; `null` : aucune. */
  readonly video = this.state.asReadonly();

  /** Branche la sortie vers la fenêtre joueurs (appelé par `PlayerWindow`). */
  attach(output: VideoOutput): void {
    this.output = output;
  }

  /**
   * Lance la vidéo dans la fenêtre joueurs, en remplaçant celle en cours (VID-06) ; renvoie `false`
   * si aucune fenêtre joueurs n'est ouverte (VID-07) : rien n'est lancé.
   */
  play(request: VideoRequest): boolean {
    if (!this.output?.open()) {
      return false;
    }
    const volume = clampVolume(request.volume);
    this.output.post({
      type: 'play-video',
      videoId: request.videoId,
      mediaId: request.mediaId,
      volume,
    });
    this.state.set({
      videoId: request.videoId,
      name: request.name,
      positionMs: 0,
      durationMs: 0,
      paused: false,
      muted: false,
      volume,
    });
    this.audio.duck(true);
    return true;
  }

  pause(): void {
    const video = this.state();
    if (video && !video.paused) {
      this.output?.post({ type: 'pause-video' });
      this.state.set({ ...video, paused: true });
    }
  }

  resume(): void {
    const video = this.state();
    if (video?.paused) {
      this.output?.post({ type: 'resume-video' });
      this.state.set({ ...video, paused: false });
    }
  }

  /** Arrête la vidéo : la battlemap réapparaît et les sons reviennent (VID-09). */
  stop(): void {
    if (this.state()) {
      this.output?.post({ type: 'stop-video' });
      this.end();
    }
  }

  /** Volume de la vidéo en cours, réglé à la main (0 à 1, non enregistré, CTL-13). */
  setVolume(volume: number): void {
    const video = this.state();
    if (video) {
      const value = clampVolume(volume);
      this.output?.post({ type: 'video-volume', volume: value });
      this.state.set({ ...video, volume: value });
    }
  }

  /**
   * La vidéo est terminée côté MJ, sans commande à envoyer : fin, fenêtre joueurs fermée ou
   * rechargée. Les sons reviennent.
   */
  end(): void {
    if (this.state()) {
      this.state.set(null);
      this.audio.duck(false);
    }
  }

  /** Message de la fenêtre joueurs ; ceux d'une vidéo remplacée sont ignorés. */
  receive(message: PlayerMessage): void {
    if (!('videoId' in message) || message.videoId !== this.state()?.videoId) {
      return;
    }
    switch (message.type) {
      case 'video-state':
        this.state.update(
          (video) =>
            video && {
              ...video,
              positionMs: message.positionMs,
              durationMs: message.durationMs,
              paused: message.paused,
              muted: message.muted,
              volume: message.volume,
            },
        );
        break;
      case 'video-ended':
        this.end();
        break;
      case 'video-error':
        this.end();
        this.notifications.error(this.transloco.translate('presentation.errors.videoUnreadable'));
        break;
      case 'video-muted':
        this.state.update((video) => video && { ...video, muted: true });
        this.notifications.info(this.transloco.translate('presentation.videoMuted'));
        break;
    }
  }
}
