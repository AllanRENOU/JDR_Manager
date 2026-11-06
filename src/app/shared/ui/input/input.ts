import { Directive, input } from '@angular/core';

/**
 * Style de champ texte du design system (Brief §6.2), posé sur un vrai `<input>` ou `<textarea>`.
 * `surface="card"` quand le champ est posé directement sur la page (fond de carte).
 * Styles : `src/styles/components/_form.scss`.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    class: 'app-input',
    '[class.app-input--on-card]': 'surface() === "card"',
  },
})
export class Input {
  readonly surface = input<'panel' | 'card'>('panel');
}
