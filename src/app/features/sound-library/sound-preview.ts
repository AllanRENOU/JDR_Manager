import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';

import { MediaUrls } from '../../core/media/media-urls';
import { Id, SoundNode } from '../../core/models';

/**
 * Pré-écoute d'un son de la bibliothèque (SON-05) : lecture simple, un seul son à la fois, avec
 * sa progression. Indépendante du lecteur de la Présentation (Web Audio, fondus : lot 9).
 * Fournie par l'écran Sons ; la lecture s'arrête quand on quitte l'écran.
 */
@Injectable()
export class SoundPreview {
  private readonly document = inject(DOCUMENT);
  private readonly mediaUrls = inject(MediaUrls);

  /** Son en cours de pré-écoute. */
  readonly playingId = signal<Id | null>(null);
  /** Avancement de la lecture, de 0 à 1. */
  readonly progress = signal(0);

  private audio: HTMLAudioElement | null = null;
  private mediaId: Id | null = null;
  /** Incrémenté à chaque lecture / arrêt : une lecture dépassée par un clic plus récent s'annule. */
  private generation = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  /** Lance la pré-écoute du son, ou l'arrête s'il est déjà en cours. */
  async toggle(sound: SoundNode): Promise<void> {
    if (this.playingId() === sound.id) {
      this.stop();
      return;
    }
    await this.play(sound);
  }

  /**
   * Lance la pré-écoute (arrête la précédente).
   * @throws si le fichier est introuvable ou si le navigateur refuse la lecture.
   */
  async play(sound: SoundNode): Promise<void> {
    this.stop();
    if (!sound.mediaId) {
      return;
    }
    const generation = ++this.generation;
    const mediaId = sound.mediaId;
    const url = await this.mediaUrls.acquire(mediaId);
    if (generation !== this.generation) {
      this.mediaUrls.release(mediaId);
      return;
    }
    this.mediaId = mediaId;
    const audio = this.document.createElement('audio');
    this.audio = audio;
    audio.addEventListener('timeupdate', () => {
      if (audio === this.audio && audio.duration > 0) {
        this.progress.set(Math.min(1, audio.currentTime / audio.duration));
      }
    });
    audio.addEventListener('ended', () => {
      if (audio === this.audio) {
        this.stop();
      }
    });
    audio.src = url;
    this.playingId.set(sound.id);
    this.progress.set(0);
    try {
      await audio.play();
    } catch (error) {
      if (audio === this.audio) {
        this.stop();
      }
      throw error;
    }
  }

  /** Arrête la pré-écoute en cours et libère le fichier. */
  stop(): void {
    this.generation++;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio = null;
    }
    if (this.mediaId) {
      this.mediaUrls.release(this.mediaId);
      this.mediaId = null;
    }
    this.playingId.set(null);
    this.progress.set(0);
  }
}
