import { CdkDrag, CdkDragMove, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkContextMenuTrigger, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideChevronDown,
  LucideEllipsis,
  LucideFolder,
  LucideFolderOpen,
  LucideFolderPlus,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';

import { Id, TreeNode, TreeNodeKind } from '../../core/models';
import { Menu } from '../ui/menu/menu';
import { MenuItem } from '../ui/menu/menu-item';
import { Modals } from '../ui/modal/modals';
import { DEFAULT_TREE_LABELS, TreeLabels } from './tree-labels';
import {
  TreeDropTarget,
  TreeMoveEvent,
  TreeRow,
  computeMove,
  descendantIds,
  visibleRows,
} from './tree-model';

/** Contexte du modèle d'affichage d'un élément (`itemTemplate`). */
export interface TreeItemContext<T extends TreeNode> {
  $implicit: T;
  row: TreeRow<T>;
}

/** Demande de création : le parent crée le nœud, puis peut appeler `startRename(id)`. */
export interface TreeCreateEvent {
  parentId: Id | null;
  kind: TreeNodeKind;
}

/** Entrée de menu contextuel fournie par le parent (ex. « Définir comme première scène »). */
export interface TreeMenuItem<T extends TreeNode> {
  /** Clé de traduction Transloco. */
  label: string;
  appliesTo: TreeNodeKind | 'both';
  run: (node: T) => void;
  /** Masque l'entrée pour certains nœuds (ex. scène déjà première). */
  hidden?: (node: T) => boolean;
}

export interface TreeRenameEvent {
  id: Id;
  name: string;
}

/**
 * Arborescence générique (TEC-60, TRD §8) : scènes, bibliothèques de sons, navigation libre et
 * fenêtres de sélection. Ne connaît que « dossier » et « élément » ; ne sauvegarde rien : les
 * modifications sont remontées par des `output`.
 */
@Component({
  selector: 'app-tree',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    CdkMenuTrigger,
    CdkContextMenuTrigger,
    CdkDrag,
    CdkDropList,
    Menu,
    MenuItem,
    LucideChevronDown,
    LucideEllipsis,
    LucideFolder,
    LucideFolderOpen,
    LucideFolderPlus,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './tree.html',
  styleUrl: './tree.scss',
})
export class Tree<T extends TreeNode> {
  private readonly modals = inject(Modals);
  private readonly transloco = inject(TranslocoService);

  /** Liste plate des nœuds (`parentId`, `order`). */
  readonly nodes = input.required<readonly T[]>();
  /** Dossiers repliés ; les nouveaux dossiers sont dépliés. Le parent peut mémoriser cet état. */
  readonly collapsedIds = model<readonly Id[]>([]);
  /** Nœud sélectionné (ligne surlignée). */
  readonly selectedId = model<Id | null>(null);
  /** Libellés (clés de traduction) ; seules les clés fournies remplacent les valeurs génériques. */
  readonly labels = input<Partial<TreeLabels>>({});
  /** `false` : lecture seule (navigation libre, fenêtres de sélection) : ni menu, ni glisser, ni renommage. */
  readonly editable = input(true);
  /** Cases à cocher (`multiple`) ou boutons radio (`single`) devant les éléments. */
  readonly selectionMode = input<'none' | 'single' | 'multiple'>('none');
  /** Éléments cochés en mode sélection. */
  readonly checkedIds = model<readonly Id[]>([]);
  /** Éléments non sélectionnables (grisés, avec mention), ex. la scène actuelle. */
  readonly disabledIds = input<readonly Id[]>([]);
  /** Nom de l'arborescence pour les lecteurs d'écran (déjà traduit), ex. « Scènes du projet ». */
  readonly ariaLabel = input('');
  /** Entrées de menu supplémentaires, placées après « Renommer ». */
  readonly extraMenuItems = input<readonly TreeMenuItem<T>[]>([]);

  /**
   * Affichage d'un élément, fourni par le parent :
   * `<ng-template #item let-node let-row="row">…</ng-template>`. Sans modèle, le nom est affiché.
   */
  readonly itemTemplate = contentChild<TemplateRef<TreeItemContext<T>>>('item');

  readonly create = output<TreeCreateEvent>();
  readonly rename = output<TreeRenameEvent>();
  /** Suppression confirmée par l'utilisateur. */
  readonly remove = output<Id>();
  /** Déplacement par glisser-déposer ; `applyMove()` (tree-model) calcule les nœuds à enregistrer. */
  readonly move = output<TreeMoveEvent>();

  protected readonly rows = computed<TreeRow<T>[]>(() =>
    visibleRows(this.nodes(), new Set(this.collapsedIds())),
  );
  protected readonly text = computed<TreeLabels>(() => ({
    ...DEFAULT_TREE_LABELS,
    ...this.labels(),
  }));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Nœud en cours de glissement et cible de dépôt valide (indicateur visuel). */
  protected readonly draggingId = signal<Id | null>(null);
  protected readonly dropTarget = signal<TreeDropTarget | null>(null);

  /**
   * Ligne active pour le clavier (« roving tabindex ») : seule ligne atteignable par Tab.
   * Par défaut, la ligne sélectionnée, sinon la première.
   */
  private readonly focusedId = signal<Id | null>(null);
  protected readonly activeId = computed<Id | null>(() => {
    const rows = this.rows();
    const ids = new Set(rows.map((r) => r.node.id));
    for (const candidate of [this.focusedId(), this.selectedId(), this.checkedIds()[0]]) {
      if (candidate && ids.has(candidate)) {
        return candidate;
      }
    }
    return rows[0]?.node.id ?? null;
  });

  /** Nœud en cours de renommage. */
  protected readonly editingId = signal<Id | null>(null);
  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  constructor() {
    // Donne le focus au champ de renommage dès qu'il apparaît, texte sélectionné.
    afterRenderEffect(() => {
      const input = this.renameInput()?.nativeElement;
      if (input && document.activeElement !== input) {
        input.focus();
        input.select();
      }
    });
  }

  /** Entrées supplémentaires applicables à un nœud. */
  protected extraItemsFor(node: T): TreeMenuItem<T>[] {
    return this.extraMenuItems().filter(
      (item) => (item.appliesTo === 'both' || item.appliesTo === node.kind) && !item.hidden?.(node),
    );
  }

  /** Sélectionne un nœud. */
  select(id: Id): void {
    this.selectedId.set(id);
  }

  protected isChecked(id: Id): boolean {
    return this.checkedIds().includes(id);
  }

  protected isDisabled(id: Id): boolean {
    return this.disabledIds().includes(id);
  }

  /**
   * Clic ou Entrée sur une ligne : en mode sélection, un élément est coché / décoché et un
   * dossier est plié / déplié ; sinon la ligne est sélectionnée.
   */
  protected activate(row: TreeRow<T>): void {
    const node = row.node;
    this.focusedId.set(node.id);
    if (this.selectionMode() === 'none') {
      this.select(node.id);
    } else if (node.kind === 'folder') {
      this.toggle(node.id);
    } else {
      this.toggleCheck(node.id);
    }
  }

  /**
   * Clavier (motif « tree » WAI-ARIA, Brief §8) : flèches haut / bas, début / fin ; droite
   * déplie ou descend au premier enfant ; gauche replie ou remonte au parent ; Entrée / Espace
   * activent ; F2 renomme ; Suppr supprime ; Maj+F10 ou touche Menu ouvre le menu.
   */
  protected onKeydown(event: KeyboardEvent, row: TreeRow<T>): void {
    const rows = this.rows();
    const index = rows.findIndex((r) => r.node.id === row.node.id);
    const node = row.node;
    const editable = this.editable();
    let handled = true;

    switch (event.key) {
      case 'ArrowDown':
        this.focusRow(rows[Math.min(index + 1, rows.length - 1)]);
        break;
      case 'ArrowUp':
        this.focusRow(rows[Math.max(index - 1, 0)]);
        break;
      case 'Home':
        this.focusRow(rows[0]);
        break;
      case 'End':
        this.focusRow(rows[rows.length - 1]);
        break;
      case 'ArrowRight':
        if (node.kind === 'folder' && !row.expanded) {
          this.toggle(node.id);
        } else if (node.kind === 'folder' && row.hasChildren) {
          this.focusRow(rows[index + 1]);
        }
        break;
      case 'ArrowLeft':
        if (node.kind === 'folder' && row.expanded) {
          this.toggle(node.id);
        } else if (row.ancestors[0]) {
          this.focusRow(rows.find((r) => r.node.id === row.ancestors[0]));
        }
        break;
      case 'Enter':
      case ' ':
        this.activate(row);
        break;
      case 'F2':
        this.startRename(node.id);
        break;
      case 'Delete':
        handled = editable;
        if (editable) {
          void this.requestRemove(node);
        }
        break;
      case 'ContextMenu':
      case 'F10':
        handled = editable && (event.key === 'ContextMenu' || event.shiftKey);
        if (handled) {
          this.rowElement(node.id)?.querySelector<HTMLButtonElement>('.tree__more')?.click();
        }
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
    }
  }

  private focusRow(row: TreeRow<T> | undefined): void {
    if (row) {
      this.focusedId.set(row.node.id);
      this.rowElement(row.node.id)?.focus();
    }
  }

  private rowElement(id: Id): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`);
  }

  /** Coche ou décoche un élément (un seul en mode `single`). Sans effet sur un élément désactivé. */
  toggleCheck(id: Id): void {
    if (this.isDisabled(id)) {
      return;
    }
    if (this.selectionMode() === 'single') {
      this.checkedIds.set([id]);
    } else if (this.selectionMode() === 'multiple') {
      const checked = this.checkedIds();
      this.checkedIds.set(
        checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id],
      );
    }
  }

  /** Plie ou déplie un dossier. */
  toggle(id: Id): void {
    const collapsed = this.collapsedIds();
    this.collapsedIds.set(
      collapsed.includes(id) ? collapsed.filter((c) => c !== id) : [...collapsed, id],
    );
  }

  /** Déplie un dossier et tous ses ancêtres (ex. pour révéler un nœud sélectionné). */
  expand(...ids: Id[]): void {
    this.collapsedIds.update((collapsed) => collapsed.filter((c) => !ids.includes(c)));
  }

  /** Demande la création d'un nœud ; le dossier parent est déplié pour montrer le nouveau nœud. */
  requestCreate(parentId: Id | null, kind: TreeNodeKind): void {
    if (parentId) {
      this.expand(parentId);
    }
    this.create.emit({ parentId, kind });
  }

  /** Passe une ligne en renommage (ex. juste après une création). Sans effet en lecture seule. */
  startRename(id: Id): void {
    if (this.editable()) {
      this.editingId.set(id);
    }
  }

  protected commitRename(node: T, value: string): void {
    if (this.editingId() !== node.id) {
      return;
    }
    this.endRename();
    const name = value.trim();
    if (name && name !== node.name) {
      this.rename.emit({ id: node.id, name });
    }
  }

  protected cancelRename(): void {
    this.endRename();
  }

  /** Quitte le renommage et rend le focus à la ligne (navigation clavier continue). */
  private endRename(): void {
    const id = this.editingId();
    this.editingId.set(null);
    if (id) {
      this.focusedId.set(id);
      queueMicrotask(() => this.rowElement(id)?.focus());
    }
  }

  // ── Glisser-déposer (CDK Drag & Drop, tri automatique désactivé : la cible est calculée ici) ──

  protected onDragStarted(id: Id): void {
    this.draggingId.set(id);
  }

  protected onDragMoved(event: CdkDragMove<Id>): void {
    const id = this.draggingId();
    const target = this.targetAt(event.pointerPosition.x, event.pointerPosition.y);
    this.dropTarget.set(id && target && computeMove(this.nodes(), id, target) ? target : null);
  }

  protected onDragEnded(): void {
    const id = this.draggingId();
    const target = this.dropTarget();
    this.draggingId.set(null);
    this.dropTarget.set(null);
    const move = id && target ? computeMove(this.nodes(), id, target) : null;
    if (move) {
      if (move.parentId) {
        this.expand(move.parentId);
      }
      this.move.emit(move);
    }
  }

  protected isDropTarget(id: Id, position: 'before' | 'after' | 'inside'): boolean {
    const target = this.dropTarget();
    return target !== null && target.position === position && target.id === id;
  }

  /**
   * Cible sous le pointeur : quart haut = avant, quart bas = après, milieu d'un dossier = dedans
   * (moitiés haut / bas pour un élément) ; sous la dernière ligne = fin de la racine.
   */
  private targetAt(x: number, y: number): TreeDropTarget | null {
    const host = this.host.nativeElement;
    const element = document.elementFromPoint(x, y);
    const rowElement = element?.closest<HTMLElement>('[data-tree-id]');
    if (rowElement && host.contains(rowElement)) {
      const id = rowElement.dataset['treeId']!;
      const node = this.nodes().find((n) => n.id === id);
      const rect = rowElement.getBoundingClientRect();
      const ratio = (y - rect.top) / rect.height;
      if (node?.kind === 'folder') {
        return { id, position: ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside' };
      }
      return { id, position: ratio < 0.5 ? 'before' : 'after' };
    }
    const bounds = host.getBoundingClientRect();
    const inside = x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    return inside ? { position: 'root-end' } : null;
  }

  /** Demande confirmation puis émet `remove` ; pour un dossier, le message précise que le contenu sera supprimé. */
  async requestRemove(node: T): Promise<void> {
    const labels = this.text();
    const count = node.kind === 'folder' ? descendantIds(this.nodes(), node.id).size : 0;
    const t = (key: string) => this.transloco.translate(key, { name: node.name, count });
    const confirmed = await this.modals.confirm({
      title: t(labels.deleteTitle),
      message: t(node.kind === 'folder' ? labels.deleteFolderMessage : labels.deleteItemMessage),
      confirmLabel: t(labels.delete),
      destructive: true,
    });
    if (confirmed) {
      this.remove.emit(node.id);
    }
  }
}
