import { CdkMenuItem } from '@angular/cdk/menu';
import { Directive, input } from '@angular/core';

/** Entrée d'un menu `appMenu` ; `triggered` est émis au clic ou à la touche Entrée / Espace. */
@Directive({
  selector: 'button[appMenuItem]',
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    class: 'app-menu-item',
    type: 'button',
    '[class.app-menu-item--danger]': 'tone() === "danger"',
    '[class.app-menu-item--selected]': 'selected()',
  },
})
export class MenuItem {
  readonly tone = input<'default' | 'danger'>('default');
  /** Option sélectionnée d'une liste déroulante. */
  readonly selected = input(false);
}
