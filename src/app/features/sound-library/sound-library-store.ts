import { Injectable, computed, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { GLOBAL_SOUND_LIBRARY, Id, SoundLibraryId, SoundNode, newId } from '../../core/models';
import { TreeMoveEvent, applyMove, descendantIds } from '../../shared/tree/tree-model';

/** Dossier ouvert : sa bibliothèque et le dossier (`null` = racine de la bibliothèque). */
export interface OpenedFolder {
  libraryId: SoundLibraryId;
  folderId: Id | null;
}

/**
 * État de l'écran Sons : bibliothèques affichées (celle du projet puis la globale), leurs nœuds
 * et le dossier ouvert. Fourni par `SoundLibraryPage` (une instance par écran) ; toutes les
 * écritures passent par le dépôt (SON-01, SON-04).
 *
 * Les arborescences n'affichent que les dossiers ; les sons du dossier ouvert sont dans le tableau.
 */
@Injectable()
export class SoundLibraryStore {
  private readonly repository = inject(DATA_REPOSITORY);

  /** Bibliothèques affichées, dans l'ordre : `[projectId, 'global']` ou `['global']`. */
  readonly libraries = signal<readonly SoundLibraryId[]>([]);
  private readonly nodesByLibrary = signal<Readonly<Record<SoundLibraryId, readonly SoundNode[]>>>(
    {},
  );
  readonly opened = signal<OpenedFolder>({ libraryId: GLOBAL_SOUND_LIBRARY, folderId: null });

  /** Arborescences du volet gauche : une par bibliothèque, dossiers seuls. */
  readonly trees = computed(() =>
    this.libraries().map((libraryId) => ({
      libraryId,
      isGlobal: libraryId === GLOBAL_SOUND_LIBRARY,
      folders: this.foldersOf(libraryId),
    })),
  );

  /** Nœud du dossier ouvert (`null` à la racine). */
  readonly openedFolder = computed(() => {
    const { libraryId, folderId } = this.opened();
    return this.nodesOf(libraryId).find((n) => n.id === folderId) ?? null;
  });

  /** Charge les bibliothèques et ouvre la racine de la première. */
  async load(projectId?: Id): Promise<void> {
    const libraries = projectId ? [projectId, GLOBAL_SOUND_LIBRARY] : [GLOBAL_SOUND_LIBRARY];
    const lists = await Promise.all(libraries.map((id) => this.repository.listSoundNodes(id)));
    this.nodesByLibrary.set(Object.fromEntries(libraries.map((id, i) => [id, lists[i]])));
    this.libraries.set(libraries);
    this.opened.set({ libraryId: libraries[0], folderId: null });
  }

  /** Tous les nœuds d'une bibliothèque. */
  nodesOf(libraryId: SoundLibraryId): readonly SoundNode[] {
    return this.nodesByLibrary()[libraryId] ?? [];
  }

  /** Dossiers d'une bibliothèque (contenu de son arborescence). */
  foldersOf(libraryId: SoundLibraryId): SoundNode[] {
    return this.nodesOf(libraryId).filter((n) => n.kind === 'folder');
  }

  open(libraryId: SoundLibraryId, folderId: Id | null): void {
    this.opened.set({ libraryId, folderId });
  }

  isOpened(libraryId: SoundLibraryId, folderId: Id | null): boolean {
    const opened = this.opened();
    return opened.libraryId === libraryId && opened.folderId === folderId;
  }

  /** Crée un dossier à la fin de son parent et l'ouvre. */
  async createFolder(
    libraryId: SoundLibraryId,
    parentId: Id | null,
    name: string,
  ): Promise<SoundNode> {
    const siblings = this.foldersOf(libraryId).filter((n) => n.parentId === parentId);
    const folder: SoundNode = {
      id: newId(),
      libraryId,
      parentId,
      order: siblings.length === 0 ? 0 : Math.max(...siblings.map((n) => n.order)) + 1,
      kind: 'folder',
      name,
    };
    await this.repository.saveSoundNodes([folder]);
    this.replace(libraryId, [...this.nodesOf(libraryId), folder]);
    this.open(libraryId, folder.id);
    return folder;
  }

  async rename(libraryId: SoundLibraryId, id: Id, name: string): Promise<void> {
    const node = this.nodesOf(libraryId).find((n) => n.id === id);
    if (!node || node.name === name) {
      return;
    }
    const renamed = { ...node, name };
    await this.repository.saveSoundNodes([renamed]);
    this.replace(
      libraryId,
      this.nodesOf(libraryId).map((n) => (n.id === id ? renamed : n)),
    );
  }

  /** Supprime un nœud et son contenu ; si le dossier ouvert disparaît, ouvre la racine. */
  async remove(libraryId: SoundLibraryId, id: Id): Promise<void> {
    const nodes = this.nodesOf(libraryId);
    const removed = descendantIds(nodes, id).add(id);
    await this.repository.deleteSoundNode(id);
    this.replace(
      libraryId,
      nodes.filter((n) => !removed.has(n.id)),
    );
    const opened = this.opened();
    if (opened.libraryId === libraryId && opened.folderId && removed.has(opened.folderId)) {
      this.open(libraryId, null);
    }
  }

  /**
   * Déplace un dossier. Le rang (`move.order`) est calculé par l'arborescence parmi les dossiers
   * seuls : seuls les dossiers sont renumérotés, les sons gardent leur ordre.
   */
  async move(libraryId: SoundLibraryId, move: TreeMoveEvent): Promise<void> {
    const changed = applyMove(this.foldersOf(libraryId), move);
    if (changed.length === 0) {
      return;
    }
    await this.repository.saveSoundNodes(changed);
    const byId = new Map(changed.map((n) => [n.id, n]));
    this.replace(
      libraryId,
      this.nodesOf(libraryId).map((n) => byId.get(n.id) ?? n),
    );
  }

  private replace(libraryId: SoundLibraryId, nodes: readonly SoundNode[]): void {
    const sorted = [...nodes].sort((a, b) => a.order - b.order);
    this.nodesByLibrary.update((all) => ({ ...all, [libraryId]: sorted }));
  }
}
