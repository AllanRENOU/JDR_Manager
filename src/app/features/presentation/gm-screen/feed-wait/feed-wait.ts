import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideHourglass } from '@lucide/angular';

import { formatDuration } from '../../../../shared/util/duration';
import { PendingWait } from '../../engine/presentation-engine';

/** Rafraîchissement du compte à rebours (ms) : assez fin pour ne pas sauter de seconde. */
const TICK_MS = 250;

/**
 * Ligne du fil pendant un élément « Attendre » (ACT-10) : compte à rebours du temps restant et
 * fond qui se remplit de gauche à droite (`--wait-progress`). Le moteur la retire à la fin de
 * l'attente.
 */
@Component({
  selector: 'app-feed-wait',
  imports: [TranslocoPipe, LucideHourglass],
  templateUrl: './feed-wait.html',
  styleUrl: './feed-wait.scss',
  host: { '[style.--wait-progress]': 'progress()' },
})
export class FeedWait {
  readonly wait = input.required<PendingWait>();

  private readonly now = signal(Date.now());

  /** Temps restant arrondi à la seconde supérieure (« 0:01 » jusqu'à la fin). */
  private readonly remainingMs = computed(() => Math.max(0, this.wait().endsAt - this.now()));
  protected readonly remaining = computed(() =>
    formatDuration(Math.ceil(this.remainingMs() / 1000) * 1000),
  );
  /** Part écoulée, de 0 à 1 : largeur du fond rempli. */
  protected readonly progress = computed(() => {
    const duration = this.wait().durationMs;
    return duration > 0 ? 1 - this.remainingMs() / duration : 1;
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
