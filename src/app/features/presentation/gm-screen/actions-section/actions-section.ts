import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideCheck, LucideEyeOff, LucidePlay, LucideRotateCcw } from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { Id } from '../../../../core/models';
import { CollapsibleSection } from '../../../../shared/ui/collapsible-section/collapsible-section';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { ManualAction, PresentationEngine } from '../../engine/presentation-engine';

/**
 * Panneau de contrôle › Actions (CTL-01 à CTL-03) : actions manuelles disponibles, actions en
 * cours ; les actions effectuées ou masquées au départ (ACT-12) sont masquées de la même façon,
 * « Voir toutes les actions » les montre pour les lancer ou les relancer.
 *
 * Une action qui devient disponible pendant la scène (« Afficher l'action ») arrive avec une
 * animation (`action--arrived`) ; pas à l'ouverture de la scène.
 */
@Component({
  selector: 'app-actions-section',
  imports: [
    CollapsibleSection,
    TranslocoPipe,
    LucideCheck,
    LucideEyeOff,
    LucidePlay,
    LucideRotateCcw,
  ],
  templateUrl: './actions-section.html',
  styleUrl: './actions-section.scss',
})
export class ActionsSection {
  protected readonly engine = inject(PresentationEngine);
  private readonly notifications = inject(Notifications);

  protected readonly showAll = signal(false);

  protected readonly running = computed(() => this.engine.manualActions().filter((a) => a.running));
  protected readonly available = computed(() =>
    this.engine.manualActions().filter((a) => !a.running && (!a.hidden || this.showAll())),
  );
  protected readonly hiddenCount = computed(
    () => this.engine.manualActions().filter((a) => a.hidden && !a.running).length,
  );
  protected readonly availableCount = computed(
    () => this.engine.manualActions().filter((a) => !a.hidden && !a.running).length,
  );
  protected readonly summaryKey = computed(() =>
    pluralKey('presentation.panel.available', this.availableCount()),
  );
  protected readonly showAllKey = computed(() =>
    pluralKey('presentation.panel.showAll', this.hiddenCount()),
  );

  /** Actions arrivées dans la liste pendant la scène, le temps de leur animation. */
  protected readonly arrivedIds = signal<ReadonlySet<Id>>(new Set());
  /** Actions masquées au dernier passage, et leur scène (une autre scène ne compte pas). */
  private previous: { sceneId: Id | undefined; hiddenIds: ReadonlySet<Id> } | null = null;

  constructor() {
    // Masquée → disponible dans la même scène : l'action « arrive » (ACT-12).
    effect(() => {
      const sceneId = this.engine.scene()?.id;
      const actions = this.engine.manualActions();
      const hiddenIds = new Set(actions.filter((a) => a.hidden).map((a) => a.action.id));
      const previous = this.previous;
      this.previous = { sceneId, hiddenIds };
      if (!previous || previous.sceneId !== sceneId) {
        untracked(() => this.arrivedIds.set(new Set()));
        return;
      }
      const arrived = actions
        .filter((a) => !a.hidden && previous.hiddenIds.has(a.action.id))
        .map((a) => a.action.id);
      if (arrived.length > 0) {
        untracked(() => this.arrivedIds.update((ids) => new Set([...ids, ...arrived])));
      }
    });
  }

  /** Fin de l'animation d'arrivée : l'action redevient une ligne ordinaire. */
  protected settle(id: Id): void {
    this.arrivedIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  protected run(item: ManualAction): void {
    this.engine.runAction(item.action.id).catch((error) => this.notifications.fromError(error));
  }
}
