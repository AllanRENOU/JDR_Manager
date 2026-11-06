import { Directive, input } from '@angular/core';

/** Variantes de bouton (Brief UI/UX §6.1). */
export type ButtonVariant =
  'primary' | 'secondary' | 'filled' | 'quiet' | 'add' | 'danger' | 'danger-strong' | 'icon';

/** Hauteurs : `sm` dans un volet, `md` standard, `lg` actions de Présentation, `touch` tablette. */
export type ButtonSize = 'sm' | 'md' | 'header' | 'lg' | 'touch';

/**
 * Style de bouton du design system, posé sur un vrai `<button>` ou `<a>` (accessibilité, Brief §8).
 *
 * ```html
 * <button appButton="primary" type="button">Présenter</button>
 * <button appButton="icon" type="button" aria-label="Fermer"><svg lucideX></svg></button>
 * ```
 * Styles : `src/styles/components/_button.scss`.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'app-button',
    '[class]': '"app-button--" + appButton() + " app-button--size-" + size()',
    '[class.app-button--block]': 'block()',
  },
})
export class Button {
  /** Variante ; `primary` par défaut. */
  readonly appButton = input<ButtonVariant, ButtonVariant | ''>('primary', {
    transform: (value) => value || 'primary',
  });
  readonly size = input<ButtonSize>('md');
  /** Occupe toute la largeur disponible. */
  readonly block = input(false);
}
