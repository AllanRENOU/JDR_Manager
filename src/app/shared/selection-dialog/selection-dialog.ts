import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideSearch } from '@lucide/angular';

import { Id, TreeNode } from '../../core/models';
import { Tree } from '../tree/tree';
import { TreeLabels } from '../tree/tree-labels';
import { filterNodes } from '../tree/tree-model';
import { Button } from '../ui/button/button';
import { Input } from '../ui/input/input';
import { Modal } from '../ui/modal/modal';

/** Paramètres de la fenêtre de sélection ; les textes sont déjà traduits. */
export interface SelectionOptions<T extends TreeNode> {
  title: string;
  subtitle?: string;
  nodes: readonly T[];
  /** `multiple` : cases à cocher (ex. scènes suivantes) ; `single` : bouton radio (ex. cible de « Changer de scène », choix d'un son). */
  mode: 'single' | 'multiple';
  /** Éléments déjà choisis (pré-cochés). */
  checkedIds?: readonly Id[];
  /** Éléments non sélectionnables, ex. la scène actuelle. */
  disabledIds?: readonly Id[];
  /** Libellés de l'arborescence (clés de traduction), ex. `{ disabled: 'scene.current' }`. */
  labels?: Partial<TreeLabels>;
  /** Libellé du bouton de validation ; « Valider » par défaut. */
  confirmLabel?: string;
}

/**
 * Fenêtre de sélection réutilisable (SCN-04, ACT-09) : arborescence en lecture seule, champ de
 * recherche et compteur. Ouverte par `Selections.select()` ; renvoie les identifiants choisis.
 */
@Component({
  selector: 'app-selection-dialog',
  imports: [Modal, Tree, Button, Input, TranslocoPipe, LucideSearch],
  templateUrl: './selection-dialog.html',
  styleUrl: './selection-dialog.scss',
})
export class SelectionDialog<T extends TreeNode> {
  protected readonly ref = inject<DialogRef<Id[]>>(DialogRef);
  protected readonly options = inject<SelectionOptions<T>>(DIALOG_DATA);

  protected readonly query = signal('');
  protected readonly checked = signal<readonly Id[]>(this.options.checkedIds ?? []);
  protected readonly collapsed = signal<readonly Id[]>([]);

  protected readonly filtered = computed(() => filterNodes(this.options.nodes, this.query()));
  /** Pendant une recherche, tous les dossiers sont dépliés pour montrer les résultats. */
  protected readonly visibleCollapsed = computed(() =>
    this.query().trim() ? [] : this.collapsed(),
  );
  protected readonly canConfirm = computed(
    () => this.options.mode === 'multiple' || this.checked().length > 0,
  );

  protected onCollapsedChange(ids: readonly Id[]): void {
    if (!this.query().trim()) {
      this.collapsed.set(ids);
    }
  }

  protected confirm(): void {
    if (this.canConfirm()) {
      this.ref.close([...this.checked()]);
    }
  }
}
