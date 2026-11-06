import { CdkMenu } from '@angular/cdk/menu';
import { Directive } from '@angular/core';

/**
 * Panneau de menu ou de liste déroulante (Brief §6.8), sur CDK Menu (clavier, focus, ARIA).
 *
 * ```html
 * <button appButton="icon" [cdkMenuTriggerFor]="menu" aria-label="Plus d'actions">…</button>
 * <ng-template #menu>
 *   <div appMenu>
 *     <button appMenuItem (triggered)="rename()">Renommer</button>
 *     <button appMenuItem tone="danger" (triggered)="remove()">Supprimer</button>
 *   </div>
 * </ng-template>
 * ```
 * Styles : `src/styles/components/_menu.scss`.
 */
@Directive({
  selector: '[appMenu]',
  hostDirectives: [CdkMenu],
  host: { class: 'app-menu' },
})
export class Menu {}
