import { Injectable, computed, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { UiPreferences } from '../../core/preferences/ui-preferences';
import { Id, Project, Sheet, SheetNode, TreeNodeKind, newId } from '../../core/models';
import { TreeMoveEvent, applyMove, descendantIds, pathTo } from '../../shared/tree/tree-model';
import { DebouncedTask } from '../../shared/util/debounced-task';
import { filterSheetNodes } from './sheet-search';

/** État de chargement de l'écran Fiches. */
export type SheetsStatus = 'loading' | 'ready' | 'missing';

/** État de l'enregistrement automatique du texte (affiché dans l'en-tête, comme l'éditeur). */
export type SheetSaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/** Délai de l'enregistrement automatique pendant la saisie (comme l'éditeur de scène). */
export const SHEET_SAVE_DELAY_MS = 500;

/** Texte saisi en attente d'enregistrement. */
interface PendingText {
  sheetId: Id;
  text: string;
}

/** Clé `UiPreferences` de la dernière fiche ouverte d'un projet (rouverte au retour sur l'écran). */
export function lastOpenedSheetKey(projectId: Id): string {
  return `sheets.lastSheet.${projectId}`;
}

/**
 * État de l'écran « Fiches » d'un projet (FCH-02, TRD §2.3) : projet, arborescence des fiches,
 * textes (recherche), nombre d'actions qui utilisent chaque fiche et fiche ouverte.
 *
 * Fourni par `SheetsPage` (une instance par écran), comme `EditorStore` et `LibraryStore`.
 */
@Injectable()
export class SheetsStore {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly preferences = inject(UiPreferences);
  /** Écritures enchaînées : deux créations rapides ne se chevauchent pas. */
  private writes: Promise<unknown> = Promise.resolve();

  readonly status = signal<SheetsStatus>('loading');
  readonly project = signal<Project | null>(null);
  /** Nœuds de l'arborescence des fiches, triés par `order`. */
  readonly nodes = signal<readonly SheetNode[]>([]);
  /** Textes des fiches, par id de nœud. */
  readonly sheets = signal<Readonly<Record<Id, Sheet>>>({});
  /** Nombre d'actions « Afficher une fiche » par fiche (FCH-07). */
  readonly usages = signal<Readonly<Record<Id, number>>>({});
  /** Fiche ouverte au centre. */
  readonly selectedId = signal<Id | null>(null);
  /** Recherche au-dessus de l'arborescence, sur le titre et le texte (FCH-06). */
  readonly query = signal('');
  /**
   * Texte de la fiche ouverte, figé à l'ouverture : le champ s'y lie, jamais à la valeur
   * enregistrée, pour qu'un enregistrement en retard n'écrase pas la saisie.
   */
  readonly initialText = signal('');
  readonly saveState = signal<SheetSaveState>('idle');
  private readonly textSave = new DebouncedTask<PendingText>(
    (pending) => this.saveText(pending),
    SHEET_SAVE_DELAY_MS,
  );

  /** Le projet a au moins une fiche ou un dossier (sinon : état vide de l'écran). */
  readonly hasNodes = computed(() => this.nodes().length > 0);
  /** Arborescence filtrée par la recherche : fiches trouvées et leurs dossiers. */
  readonly visibleNodes = computed(() =>
    filterSheetNodes(this.nodes(), Object.values(this.sheets()), this.query()),
  );
  readonly searching = computed(() => this.query().trim().length > 0);
  /** Nœud de la fiche ouverte. */
  readonly selectedNode = computed(
    () => this.nodes().find((n) => n.id === this.selectedId()) ?? null,
  );
  /** Dossiers de la fiche ouverte, de la racine au plus proche (chemin affiché au-dessus du titre). */
  readonly selectedFolders = computed(() => {
    const node = this.selectedNode();
    return node ? pathTo(this.nodes(), node.id).slice(0, -1) : [];
  });

  /**
   * Charge le projet et ses fiches, puis rouvre la dernière fiche ouverte si elle existe encore ;
   * statut `missing` si le projet n'existe pas.
   */
  async load(projectId: Id): Promise<void> {
    this.status.set('loading');
    const project = await this.repository.getProject(projectId);
    if (!project) {
      this.project.set(null);
      this.nodes.set([]);
      this.sheets.set({});
      this.usages.set({});
      this.selectedId.set(null);
      this.status.set('missing');
      return;
    }
    const [nodes, sheets, usages] = await Promise.all([
      this.repository.listSheetNodes(projectId),
      this.repository.listSheets(projectId),
      this.repository.countSheetUsages(projectId),
    ]);
    this.project.set(project);
    this.nodes.set(nodes);
    this.sheets.set(Object.fromEntries(sheets.map((s) => [s.id, s])));
    this.usages.set(usages);
    const last = this.preferences.get<Id | null>(lastOpenedSheetKey(projectId), null);
    const selected = nodes.some((n) => n.id === last && n.kind === 'item') ? last : null;
    this.selectedId.set(selected);
    this.initialText.set(selected ? (this.sheets()[selected]?.text ?? '') : '');
    this.saveState.set('idle');
    this.status.set('ready');
  }

  /**
   * Ouvre une fiche (un dossier est ignoré) et la mémorise pour le retour sur l'écran. La saisie
   * en attente de la fiche précédente est d'abord enregistrée.
   */
  async open(id: Id | null): Promise<void> {
    const node = this.nodes().find((n) => n.id === id);
    if (!node || node.kind !== 'item' || node.id === this.selectedId()) {
      return;
    }
    await this.flush();
    this.select(node);
  }

  /** Saisie dans le texte de la fiche ouverte : enregistrée après un temps de calme (FCH-05). */
  editText(text: string): void {
    const sheetId = this.selectedId();
    if (sheetId) {
      this.saveState.set('pending');
      this.textSave.schedule({ sheetId, text });
    }
  }

  /** Enregistre tout de suite la saisie en attente (sortie du champ, changement de fiche ou d'écran). */
  flush(): Promise<void> {
    return this.textSave.flush();
  }

  private select(node: SheetNode): void {
    this.selectedId.set(node.id);
    this.initialText.set(this.sheets()[node.id]?.text ?? '');
    this.preferences.set(lastOpenedSheetKey(node.projectId), node.id);
  }

  private saveText({ sheetId, text }: PendingText): Promise<void> {
    return this.enqueue(async () => {
      const project = this.requireProject();
      const sheet: Sheet = { id: sheetId, projectId: project.id, text };
      this.saveState.set('saving');
      try {
        await this.repository.saveSheet(sheet);
        await this.touchProject();
      } catch (error) {
        this.saveState.set('error');
        throw error;
      }
      // Une fiche supprimée pendant l'attente n'est pas recréée dans l'état de l'écran.
      if (this.nodes().some((n) => n.id === sheetId)) {
        this.sheets.update((sheets) => ({ ...sheets, [sheetId]: sheet }));
      }
      this.saveState.set(this.textSave.pending ? 'pending' : 'saved');
    });
  }

  /**
   * Nombre d'actions qui affichent la fiche, ou les fiches d'un dossier (une action qui en vise
   * plusieurs est comptée pour chacune).
   */
  usageCount(id: Id): number {
    const usages = this.usages();
    return [id, ...descendantIds(this.nodes(), id)].reduce((sum, n) => sum + (usages[n] ?? 0), 0);
  }

  /**
   * Parent d'un nouveau nœud créé par les boutons du haut : le dossier sélectionné, le dossier de
   * la fiche sélectionnée, sinon celui de la fiche ouverte.
   */
  creationParent(selectedId: Id | null = null): Id | null {
    const selected = this.nodes().find((n) => n.id === selectedId);
    if (selected) {
      return selected.kind === 'folder' ? selected.id : selected.parentId;
    }
    return this.selectedNode()?.parentId ?? null;
  }

  /**
   * Crée un dossier ou une fiche (texte vide) à la fin de son dossier (FCH-03). Une nouvelle fiche
   * est ouverte. La recherche est effacée pour que le nouveau nœud soit visible.
   */
  createNode(kind: TreeNodeKind, parentId: Id | null, name: string): Promise<SheetNode> {
    return this.enqueueAfterFlush(async () => {
      const project = this.requireProject();
      const siblings = this.nodes().filter((n) => n.parentId === parentId);
      const node: SheetNode = {
        id: newId(),
        projectId: project.id,
        parentId,
        order: siblings.length === 0 ? 0 : Math.max(...siblings.map((n) => n.order)) + 1,
        kind,
        name,
      };
      await this.repository.saveSheetNodes([node]);
      this.nodes.update((nodes) => [...nodes, node]);
      if (kind === 'item') {
        const sheet: Sheet = { id: node.id, projectId: project.id, text: '' };
        await this.repository.saveSheet(sheet);
        this.sheets.update((sheets) => ({ ...sheets, [sheet.id]: sheet }));
      }
      this.query.set('');
      if (kind === 'item') {
        this.select(node);
      }
      await this.touchProject();
      return node;
    });
  }

  /** Renomme un dossier ou une fiche (le titre d'une fiche est son nom). Un nom vide est ignoré. */
  renameNode(id: Id, name: string): Promise<void> {
    return this.enqueue(async () => {
      const node = this.nodes().find((n) => n.id === id);
      const trimmed = name.trim();
      if (!node || !trimmed || node.name === trimmed) {
        return;
      }
      const renamed = { ...node, name: trimmed };
      await this.repository.saveSheetNodes([renamed]);
      this.nodes.update((nodes) => nodes.map((n) => (n.id === id ? renamed : n)));
      await this.touchProject();
    });
  }

  /**
   * Supprime un dossier ou une fiche avec son contenu (confirmation faite par l'arborescence).
   * Les actions qui l'affichaient la signaleront comme supprimée (PRS-07).
   */
  removeNode(id: Id): Promise<void> {
    return this.enqueueAfterFlush(async () => {
      const removed = descendantIds(this.nodes(), id).add(id);
      await this.repository.deleteSheetNode(id);
      this.nodes.update((nodes) => nodes.filter((n) => !removed.has(n.id)));
      this.sheets.update((sheets) =>
        Object.fromEntries(Object.entries(sheets).filter(([sheetId]) => !removed.has(sheetId))),
      );
      const selected = this.selectedId();
      if (selected && removed.has(selected)) {
        this.selectedId.set(null);
        this.initialText.set('');
      }
      await this.touchProject();
    });
  }

  /** Déplace ou réordonne un nœud (glisser-déposer). */
  moveNode(move: TreeMoveEvent): Promise<void> {
    return this.enqueue(async () => {
      const changed = applyMove(this.nodes(), move);
      if (changed.length === 0) {
        return;
      }
      await this.repository.saveSheetNodes(changed);
      const byId = new Map(changed.map((n) => [n.id, n]));
      this.nodes.update((nodes) =>
        nodes.map((n) => byId.get(n.id) ?? n).sort((a, b) => a.order - b.order),
      );
      await this.touchProject();
    });
  }

  /** Enregistre la saisie en attente, puis enchaîne l'écriture. */
  private async enqueueAfterFlush<T>(task: () => Promise<T>): Promise<T> {
    await this.flush();
    return this.enqueue(task);
  }

  /** Enchaîne une écriture après les précédentes ; une erreur ne bloque pas les suivantes. */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.writes.then(task);
    this.writes = run.catch(() => undefined);
    return run;
  }

  private requireProject(): Project {
    const project = this.project();
    if (!project) {
      throw new Error('Projet non chargé');
    }
    return project;
  }

  /**
   * Met à jour la date de modification du projet (cartes de l'accueil). L'image du projet est
   * relue : elle a pu changer dans Paramètres › Projet pendant que l'écran était ouvert.
   */
  private async touchProject(): Promise<void> {
    const project = this.project();
    if (project) {
      const stored = await this.repository.getProject(project.id);
      const saved = {
        ...project,
        imageMediaId: stored?.imageMediaId ?? null,
        updatedAt: new Date().toISOString(),
      };
      await this.repository.saveProject(saved);
      this.project.set(saved);
    }
  }
}
