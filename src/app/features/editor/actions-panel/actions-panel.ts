import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideGripVertical,
  LucideHand,
  LucideLock,
  LucidePlay,
  LucidePlus,
  LucideTriangleExclamationPoint,
} from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { Action, Trigger } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { CollapsibleSection } from '../../../shared/ui/collapsible-section/collapsible-section';
import { ElementSummary, SummaryContext, summarizeElement } from '../action-summary';
import { EditorStore } from '../editor-store';

/** Ligne de la liste des actions : action, résumé de ses éléments, cible supprimée éventuelle. */
interface ActionRow {
  action: Action;
  parts: ElementSummary[];
  missing: boolean;
}

const TRIGGERS: readonly Trigger[] = ['scene-open', 'manual'];

/**
 * Partie « Actions » du volet droit de l'éditeur (SCN-06, SCN-13) : actions rangées par
 * déclencheur, résumé de leurs éléments, action « Texte de scène » verrouillée.
 */
@Component({
  selector: 'app-actions-panel',
  imports: [
    Button,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    LucideGripVertical,
    CollapsibleSection,
    TranslocoPipe,
    LucideHand,
    LucideLock,
    LucidePlay,
    LucidePlus,
    LucideTriangleExclamationPoint,
  ],
  templateUrl: './actions-panel.html',
  styleUrl: './actions-panel.scss',
})
export class ActionsPanel {
  protected readonly store = inject(EditorStore);
  protected readonly pluralKey = pluralKey;
  private readonly notifications = inject(Notifications);

  /** Glisser-déposer d'une action dans son groupe (7.3.2). */
  protected drop(trigger: Trigger, event: CdkDragDrop<Trigger>): void {
    this.store
      .reorderAction(trigger, event.previousIndex, event.currentIndex)
      .catch((error) => this.notifications.fromError(error));
  }

  /** Actions groupées par déclencheur (groupes vides omis). */
  protected readonly groups = computed(() => {
    const context: SummaryContext = {
      soundNames: this.store.soundNames(),
      battlemaps: this.store.battlemaps(),
      sceneNodes: this.store.sceneNodes(),
    };
    return TRIGGERS.map((trigger) => ({
      trigger,
      rows: this.store
        .actions()
        .filter((a) => a.trigger === trigger)
        .map<ActionRow>((action) => {
          const parts = action.elements.map((e) => summarizeElement(e, context));
          return { action, parts, missing: parts.some((p) => p.missing) };
        }),
    })).filter((group) => group.rows.length > 0);
  });
}
