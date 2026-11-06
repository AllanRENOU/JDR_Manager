import { Component, input } from '@angular/core';

/**
 * Visuel de remplacement quadrillé (Brief §6.15), affiché tant qu'aucune image n'est importée
 * (battlemap, vignette de projet). `variant="alt"` utilise la seconde palette (variété visuelle).
 * Un contenu projeté (icône, texte court) est centré.
 */
@Component({
  selector: 'app-placeholder',
  template: '<ng-content />',
  styleUrl: './placeholder.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[class.alt]': 'variant() === "alt"',
    '[class.fine]': 'grid() === "fine"',
  },
})
export class Placeholder {
  readonly variant = input<'default' | 'alt'>('default');
  /** Pas de la grille : `fine` (12 px, miniatures) ou `wide` (20 px). */
  readonly grid = input<'fine' | 'wide'>('wide');
  /** Texte alternatif ; sans texte, le visuel est décoratif. */
  readonly label = input('');
}
