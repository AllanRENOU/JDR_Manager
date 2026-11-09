import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideHourglass, LucideMousePointerClick } from '@lucide/angular';
import { UserClickElement, WaitElement } from '../../../core/models';

/**
 * Élément « Attendre » ou « Clic de l'utilisateur » d'une action, montré en lecture seule dans la
 * zone centrale de l'éditeur, entre les textes de l'action (il se modifie dans l'éditeur d'action).
 */
@Component({
  imports: [DecimalPipe, TranslocoPipe, LucideHourglass, LucideMousePointerClick],
  selector: 'app-action-pause',
  host: { '[class.pause--click]': "element().type === 'user-click'" },
  styleUrl: './action-pause.scss',
  templateUrl: './action-pause.html',
})
export class ActionPause {
  readonly element = input.required<WaitElement | UserClickElement>();
}
