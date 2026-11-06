import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucidePlus } from '@lucide/angular';

import { Id } from '../../../core/models';
import { Selections } from '../../../shared/selection-dialog/selections';
import { Button } from '../../../shared/ui/button/button';
import { CollapsibleSection } from '../../../shared/ui/collapsible-section/collapsible-section';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Pill } from '../../../shared/ui/pill/pill';
import { EditorStore } from '../editor-store';

/**
 * Partie « Enchaînement » du volet droit de l'éditeur : case « Première scène du projet »
 * (SCN-03) et scènes suivantes (SCN-04), choisies dans la fenêtre de sélection multiple.
 */
@Component({
  selector: 'app-sequence-panel',
  imports: [Button, CollapsibleSection, Pill, TranslocoPipe, LucidePlus],
  templateUrl: './sequence-panel.html',
  styleUrl: './sequence-panel.scss',
})
export class SequencePanel {
  protected readonly store = inject(EditorStore);
  private readonly selections = inject(Selections);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  /** Scènes suivantes avec leur nom ; une scène supprimée entre-temps est signalée. */
  protected readonly nextScenes = computed(() => {
    const nodes = this.store.sceneNodes();
    return (this.store.scene()?.nextSceneIds ?? []).map((id) => ({
      id,
      name: nodes.find((n) => n.id === id && n.kind === 'item')?.name ?? null,
    }));
  });

  protected toggleFirst(checked: boolean): void {
    const id = this.store.selectedSceneId();
    this.run(this.store.setFirstScene(checked ? id : null));
  }

  protected removeNext(id: Id): void {
    const ids = this.store.scene()?.nextSceneIds.filter((n) => n !== id) ?? [];
    this.run(this.store.setNextScenes(ids));
  }

  /**
   * Fenêtre de sélection (SCN-04) : arborescence des scènes, scènes suivantes pré-cochées
   * (les décocher les retire), scène actuelle non sélectionnable. L'ordre existant est gardé,
   * les nouvelles scènes s'ajoutent à la fin.
   */
  protected async addNext(): Promise<void> {
    const scene = this.store.selectedNode();
    const current = this.store.scene()?.nextSceneIds ?? [];
    if (!scene) {
      return;
    }
    const chosen = await this.selections.select({
      title: this.transloco.translate('scene.nextDialogTitle'),
      subtitle: this.transloco.translate('scene.nextDialogSubtitle', { name: scene.name }),
      nodes: this.store.sceneNodes(),
      mode: 'multiple',
      checkedIds: current,
      disabledIds: [scene.id],
      labels: { disabled: 'scene.current' },
    });
    if (chosen) {
      const kept = current.filter((id) => chosen.includes(id));
      const added = chosen.filter((id) => !current.includes(id));
      this.run(this.store.setNextScenes([...kept, ...added]));
    }
  }

  private run(task: Promise<unknown>): void {
    task.catch((error) => this.notifications.fromError(error));
  }
}
