import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideCheck, LucidePlay, LucideRotateCcw } from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { CollapsibleSection } from '../../../../shared/ui/collapsible-section/collapsible-section';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { ManualAction, PresentationEngine } from '../../engine/presentation-engine';

/**
 * Panneau de contrôle › Actions (CTL-01 à CTL-03) : actions manuelles disponibles, actions en
 * cours ; les actions effectuées sont masquées, « Voir toutes les actions » les montre pour les
 * relancer.
 */
@Component({
  selector: 'app-actions-section',
  imports: [CollapsibleSection, TranslocoPipe, LucideCheck, LucidePlay, LucideRotateCcw],
  templateUrl: './actions-section.html',
  styleUrl: './actions-section.scss',
})
export class ActionsSection {
  protected readonly engine = inject(PresentationEngine);
  private readonly notifications = inject(Notifications);

  protected readonly showAll = signal(false);

  protected readonly running = computed(() => this.engine.manualActions().filter((a) => a.running));
  protected readonly available = computed(() =>
    this.engine.manualActions().filter((a) => !a.running && (!a.done || this.showAll())),
  );
  protected readonly doneCount = computed(
    () => this.engine.manualActions().filter((a) => a.done && !a.running).length,
  );
  protected readonly availableCount = computed(
    () => this.engine.manualActions().filter((a) => !a.done && !a.running).length,
  );
  protected readonly summaryKey = computed(() =>
    pluralKey('presentation.panel.available', this.availableCount()),
  );
  protected readonly showAllKey = computed(() =>
    pluralKey('presentation.panel.showAll', this.doneCount()),
  );

  protected run(item: ManualAction): void {
    this.engine.runAction(item.action.id).catch((error) => this.notifications.fromError(error));
  }
}
