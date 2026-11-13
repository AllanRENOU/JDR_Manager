import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { ActionElementType } from '../../../core/models';

/** Couleur d'une pastille : un type d'élément (Brief §2.6), « en cours » (`active`, §2.5) ou un style neutre. */
export type PillTone =
  | 'neutral'
  | 'accent'
  | 'active'
  | 'battlemap'
  | 'sound'
  | 'stop-all'
  | 'text'
  | 'wait'
  | 'click'
  | 'scene'
  | 'action';

/** Couleur associée à chaque type d'élément d'action (Brief §2.6). */
export const ELEMENT_TONES: Record<ActionElementType, PillTone> = {
  'show-battlemap': 'battlemap',
  'play-sound': 'sound',
  'stop-sound': 'stop-all',
  'stop-all-sounds': 'stop-all',
  'add-text': 'text',
  wait: 'wait',
  'user-click': 'click',
  'change-scene': 'scene',
  'show-action': 'action',
  'hide-action': 'action',
};

/**
 * Pastille (Brief §6.5) : type d'action, scène suivante (avec « × » si `removable`),
 * ou badge « Par défaut » (`variant="badge"`).
 */
@Component({
  selector: 'app-pill',
  imports: [TranslocoPipe, LucideX],
  templateUrl: './pill.html',
  styleUrl: './pill.scss',
  host: {
    '[class]': '"tone-" + tone() + " variant-" + variant()',
  },
})
export class Pill {
  readonly tone = input<PillTone>('neutral');
  readonly variant = input<'pill' | 'badge'>('pill');
  /** Affiche un bouton « × » qui émet `remove`. */
  readonly removable = input(false);
  /** Libellé d'accessibilité du bouton « × » (nom de l'élément retiré). */
  readonly removeLabel = input('');

  readonly remove = output<void>();
}
