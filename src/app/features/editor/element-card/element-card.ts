import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideChevronDown,
  LucideDynamicIcon,
  LucideGripVertical,
  LucideTrash2,
} from '@lucide/angular';

import { ActionElement } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { SummaryContext, describeElement } from '../action-summary';
import { elementTypeInfo } from '../element-types';

let nextId = 0;

/**
 * Carte d'un élément dans l'éditeur d'action (Brief §6.3 bis, ACT-03) : poignée de déplacement,
 * numéro, icône et couleur du type, résumé ; dépliée, elle affiche le formulaire projeté.
 * À placer dans un `cdkDrag` : la poignée est un `cdkDragHandle`.
 */
@Component({
  selector: 'app-element-card',
  imports: [
    Button,
    CdkDragHandle,
    TranslocoPipe,
    LucideChevronDown,
    LucideDynamicIcon,
    LucideGripVertical,
    LucideTrash2,
  ],
  templateUrl: './element-card.html',
  styleUrl: './element-card.scss',
  host: { '[class.expanded]': 'expanded()', '[class.invalid]': 'invalid()' },
})
export class ElementCard {
  readonly element = input.required<ActionElement>();
  /** Position dans l'action (à partir de 1). */
  readonly index = input.required<number>();
  readonly context = input.required<SummaryContext>();
  readonly expanded = model(false);
  /** Élément à corriger avant d'enregistrer (8.4.1) : bordure d'erreur. */
  readonly invalid = input(false);

  readonly removed = output<void>();

  protected readonly info = computed(() => elementTypeInfo(this.element().type));
  protected readonly detail = computed(() => describeElement(this.element(), this.context()));
  protected readonly bodyId = `app-element-${++nextId}`;
}
