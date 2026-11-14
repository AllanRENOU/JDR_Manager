import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideClapperboard,
  LucidePause,
  LucidePlay,
  LucideSquare,
  LucideVolume1,
} from '@lucide/angular';

import { Button } from '../../../../shared/ui/button/button';
import { formatDuration } from '../../../../shared/util/duration';
import { PlayerVideo, PlayingVideo } from '../player-video';

let nextId = 0;

/**
 * Carte « Vidéo en cours », en tête de la partie Sons (Brief §6.12, CTL-13) : nom, temps restant
 * et barre de progression, « Sons coupés », « Muette » si le son a été refusé (VID-12), boutons
 * Pause / Reprendre et Arrêter ; un clic sur la carte la déplie et montre le curseur de volume
 * (non enregistré). L'état vient de la fenêtre joueurs (`PlayerVideo`).
 */
@Component({
  selector: 'app-video-card',
  imports: [
    Button,
    TranslocoPipe,
    LucideClapperboard,
    LucidePause,
    LucidePlay,
    LucideSquare,
    LucideVolume1,
  ],
  templateUrl: './video-card.html',
  styleUrl: './video-card.scss',
  host: { '[class.expanded]': 'expanded()' },
})
export class VideoCard {
  private readonly player = inject(PlayerVideo);

  readonly video = input.required<PlayingVideo>();

  protected readonly expanded = signal(false);
  protected readonly volumeId = `app-video-volume-${++nextId}`;
  protected readonly percent = computed(() => Math.round(this.video().volume * 100));
  /** Temps restant « -1:24 » ; `null` tant que la durée n'est pas connue. */
  protected readonly remaining = computed(() => {
    const { durationMs, positionMs } = this.video();
    return durationMs > 0 ? `-${formatDuration(Math.max(0, durationMs - positionMs))}` : null;
  });
  /** Avancement de 0 à 100. */
  protected readonly progress = computed(() => {
    const { durationMs, positionMs } = this.video();
    return durationMs > 0 ? Math.min(100, Math.round((positionMs / durationMs) * 100)) : 0;
  });

  protected toggle(): void {
    if (this.video().paused) {
      this.player.resume();
    } else {
      this.player.pause();
    }
  }

  protected stop(): void {
    this.player.stop();
  }

  protected setVolume(value: string): void {
    this.player.setVolume(Number(value) / 100);
  }
}
