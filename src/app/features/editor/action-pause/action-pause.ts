import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideClapperboard,
  LucideHourglass,
  LucideMousePointerClick,
  LucideScrollText,
} from '@lucide/angular';

import { ShownElement } from '../editor-store';

/**
 * Élément « Attendre », « Clic de l'utilisateur », « Changer de scène » ou « Afficher une fiche »
 * d'une action, montré en
 * lecture seule dans la zone centrale de l'éditeur, entre les textes de l'action (il se modifie
 * dans l'éditeur d'action).
 */
@Component({
  imports: [
    DecimalPipe,
    TranslocoPipe,
    LucideClapperboard,
    LucideHourglass,
    LucideMousePointerClick,
    LucideScrollText,
  ],
  selector: 'app-action-pause',
  host: {
    '[class.pause--click]': "element().type === 'user-click'",
    '[class.pause--scene]': "element().type === 'change-scene'",
    '[class.pause--sheet]': "element().type === 'show-sheet'",
  },
  styleUrl: './action-pause.scss',
  templateUrl: './action-pause.html',
})
export class ActionPause {
  readonly element = input.required<Exclude<ShownElement, { type: 'add-text' }>>();
  /**
   * « Changer de scène » ou « Afficher une fiche » : nom de la scène ou titre de la fiche visée,
   * `null` si elle a été supprimée (PRS-07).
   */
  readonly targetName = input<string | null>(null);
}
