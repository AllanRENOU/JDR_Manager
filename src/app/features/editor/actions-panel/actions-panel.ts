import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideEyeOff,
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
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { CollapsibleSection } from '../../../shared/ui/collapsible-section/collapsible-section';
import { ActionEditor, ActionEditorData, ActionEditorResult } from '../action-editor/action-editor';
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
    LucideEyeOff,
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
  private readonly modals = inject(Modals);
  private readonly transloco = inject(TranslocoService);

  private readonly context = computed<SummaryContext>(() => ({
    soundNames: this.store.soundNames(),
    soundNodes: this.store.soundNodes(),
    battlemaps: this.store.battlemaps(),
    sceneNodes: this.store.sceneNodes(),
    actions: this.store.actions(),
  }));

  /** Ouvre l'éditeur d'action (8.1.1) ; `null` crée une nouvelle action. */
  async edit(action: Action | null): Promise<void> {
    const ref = this.modals.open<ActionEditorResult, ActionEditorData>(ActionEditor, {
      size: 'lg',
      closable: false,
      data: {
        action,
        sceneId: this.store.selectedSceneId() ?? '',
        projectId: this.store.project()?.id ?? '',
        sceneName: this.store.selectedNode()?.name ?? '',
        context: this.context(),
      },
    });
    const result = await firstValueFrom(ref.closed);
    try {
      if (result?.kind === 'save') {
        const saved = await this.store.saveAction(action, result.draft);
        this.notifications.info(
          this.transloco.translate('action.editor.saved', { name: saved.name }),
        );
      } else if (result?.kind === 'delete' && action) {
        await this.store.deleteAction(action.id);
        this.notifications.info(
          this.transloco.translate('action.editor.deleted', { name: action.name }),
        );
      }
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  /** Glisser-déposer d'une action dans son groupe (7.3.2). */
  protected drop(trigger: Trigger, event: CdkDragDrop<Trigger>): void {
    this.store
      .reorderAction(trigger, event.previousIndex, event.currentIndex)
      .catch((error) => this.notifications.fromError(error));
  }

  /** Actions groupées par déclencheur (groupes vides omis). */
  protected readonly groups = computed(() => {
    const context = this.context();
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
