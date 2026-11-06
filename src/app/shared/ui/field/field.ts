import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

let nextId = 0;

/**
 * Champ de formulaire (Brief §6.2) : libellé au-dessus, contrôle projeté, aide ou erreur dessous.
 *
 * ```html
 * <app-field label="Nom" [required]="true" #f>
 *   <input appInput [id]="f.controlId" />
 * </app-field>
 * ```
 * `controlId` relie le libellé au contrôle. `hiddenLabel` garde le libellé pour les lecteurs
 * d'écran seulement (ex. texte de scène).
 */
@Component({
  selector: 'app-field',
  imports: [TranslocoPipe],
  templateUrl: './field.html',
  styleUrl: './field.scss',
})
export class Field {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly hint = input('');
  readonly error = input('');
  readonly hiddenLabel = input(false);

  /** Identifiant à poser sur le contrôle projeté. */
  readonly controlId = `app-field-${++nextId}`;
  readonly messageId = `${this.controlId}-message`;
}
