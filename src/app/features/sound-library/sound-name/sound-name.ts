import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Capitalize } from '../../../shared/ui/capitalize/capitalize';
import { Input } from '../../../shared/ui/input/input';

/**
 * Nom d'un son dans le tableau de la bibliothèque (6.8) : un clic passe en renommage, comme le
 * crayon de la ligne. Pendant le renommage, le nom reste en place (masqué) et le champ se pose
 * par-dessus : la hauteur de la ligne et la largeur de la colonne ne changent pas.
 *
 * Le composant n'enregistre rien : l'écran reçoit `renameRequested`, `committed` et `cancelled`.
 */
@Component({
  selector: 'app-sound-name',
  imports: [TranslocoPipe, Input, Capitalize],
  templateUrl: './sound-name.html',
  styleUrl: './sound-name.scss',
})
export class SoundName {
  readonly name = input.required<string>();
  /** Champ de renommage affiché (focus et texte sélectionné à l'apparition). */
  readonly editing = input(false);

  /** Clic sur le nom. */
  readonly renameRequested = output<void>();
  /** Entrée ou sortie du champ : valeur saisie, non nettoyée. */
  readonly committed = output<string>();
  /** Échap. */
  readonly cancelled = output<void>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterRenderEffect(() => {
      const field = this.field()?.nativeElement;
      if (field && document.activeElement !== field) {
        field.focus();
        field.select();
      }
    });
  }
}
