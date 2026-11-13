import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideClapperboard, LucideHourglass, LucideMousePointerClick } from '@lucide/angular';
import { ChangeSceneElement, UserClickElement, WaitElement } from '../../../core/models';

/**
 * Élément « Attendre », « Clic de l'utilisateur » ou « Changer de scène » d'une action, montré en
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
  ],
  selector: 'app-action-pause',
  host: {
    '[class.pause--click]': "element().type === 'user-click'",
    '[class.pause--scene]': "element().type === 'change-scene'",
  },
  styleUrl: './action-pause.scss',
  templateUrl: './action-pause.html',
})
export class ActionPause {
  readonly element = input.required<WaitElement | UserClickElement | ChangeSceneElement>();
  /** « Changer de scène » : nom de la scène cible, `null` si elle a été supprimée (PRS-07). */
  readonly sceneName = input<string | null>(null);
}
