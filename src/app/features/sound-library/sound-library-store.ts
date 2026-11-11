import { Injectable, computed, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { AudioDuration } from '../../core/media/audio-duration';
import { resolveMediaType } from '../../core/media/media-types';
import { baseName } from '../../shared/util/file-name';
import {
  GLOBAL_SOUND_LIBRARY,
  Id,
  MediaInfo,
  SoundLibraryId,
  SoundNode,
  newId,
} from '../../core/models';
import {
  TreeMoveEvent,
  applyMove,
  descendantIds,
  normalizeSearch,
  pathTo,
} from '../../shared/tree/tree-model';

/** Dossier ouvert : sa bibliothèque et le dossier (`null` = racine de la bibliothèque). */
export interface OpenedFolder {
  libraryId: SoundLibraryId;
  folderId: Id | null;
}

/** Ligne du tableau des sons (SON-03). */
export interface SoundRow {
  node: SoundNode;
  /** Informations du fichier ; `null` si le média est introuvable. */
  media: MediaInfo | null;
  /** Nombre d'actions qui utilisent le son. */
  usages: number;
  /** Bibliothèque du son et dossiers qui le contiennent (résultats de recherche). */
  libraryId: SoundLibraryId;
  folders: readonly string[];
}

/** Résultat d'un import de fichiers. */
export interface ImportResult {
  imported: SoundNode[];
  /** Fichiers refusés : format non pris en charge. */
  rejected: File[];
  /** Erreur qui a interrompu l'import (ex. quota dépassé) ; les sons déjà importés restent. */
  failure?: unknown;
}

/**
 * État de l'écran Sons : bibliothèques affichées (celle du projet puis la globale), leurs nœuds
 * et le dossier ouvert. Fourni par `SoundLibraryPage` (une instance par écran) ; toutes les
 * écritures passent par le dépôt (SON-01, SON-04).
 *
 * Les arborescences montrent les dossiers et les sons ; le tableau détaille les sons du dossier
 * ouvert. Choisir un son dans l'arborescence ouvre son dossier et le met en évidence
 * (`selectedSoundId`).
 */
@Injectable()
export class SoundLibraryStore {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly durations = inject(AudioDuration);

  /** Bibliothèques affichées, dans l'ordre : `[projectId, 'global']` ou `['global']`. */
  readonly libraries = signal<readonly SoundLibraryId[]>([]);
  private readonly nodesByLibrary = signal<Readonly<Record<SoundLibraryId, readonly SoundNode[]>>>(
    {},
  );
  readonly opened = signal<OpenedFolder>({ libraryId: GLOBAL_SOUND_LIBRARY, folderId: null });

  /** Son choisi dans l'arborescence, mis en évidence dans le tableau ; `null` si aucun. */
  readonly selectedSoundId = signal<Id | null>(null);

  /** Arborescences du volet gauche : une par bibliothèque, dossiers et sons. */
  readonly trees = computed(() =>
    this.libraries().map((libraryId) => ({
      libraryId,
      isGlobal: libraryId === GLOBAL_SOUND_LIBRARY,
      nodes: this.nodesOf(libraryId),
    })),
  );

  /** Informations des fichiers son, par id de média. */
  private readonly mediaInfo = signal<Readonly<Record<Id, MediaInfo>>>({});
  /** Nombre d'actions qui utilisent chaque son, par id de son. */
  private readonly usages = signal<Readonly<Record<Id, number>>>({});

  /** Texte recherché ; non vide, le tableau montre les sons de toutes les bibliothèques affichées. */
  readonly query = signal('');
  readonly searching = computed(() => normalizeSearch(this.query()).length > 0);

  /** Sons du tableau : ceux du dossier ouvert, ou les résultats de la recherche. */
  readonly rows = computed<SoundRow[]>(() => {
    const search = normalizeSearch(this.query());
    if (search) {
      return this.libraries().flatMap((libraryId) =>
        this.nodesOf(libraryId)
          .filter((n) => n.kind === 'item' && normalizeSearch(n.name).includes(search))
          .map((node) => this.toRow(node))
          .sort((a, b) => a.node.name.localeCompare(b.node.name, 'fr')),
      );
    }
    const { libraryId, folderId } = this.opened();
    return this.nodesOf(libraryId)
      .filter((n) => n.kind === 'item' && n.parentId === folderId)
      .map((node) => this.toRow(node));
  });

  /** Nœud du dossier ouvert (`null` à la racine). */
  readonly openedFolder = computed(() => {
    const { libraryId, folderId } = this.opened();
    return this.nodesOf(libraryId).find((n) => n.id === folderId) ?? null;
  });

  /** Import en cours (bouton désactivé). */
  readonly importing = signal(false);

  /** Charge les bibliothèques et ouvre la racine de la première. */
  async load(projectId?: Id): Promise<void> {
    const libraries = projectId ? [projectId, GLOBAL_SOUND_LIBRARY] : [GLOBAL_SOUND_LIBRARY];
    const lists = await Promise.all(libraries.map((id) => this.repository.listSoundNodes(id)));
    this.nodesByLibrary.set(Object.fromEntries(libraries.map((id, i) => [id, lists[i]])));
    this.libraries.set(libraries);
    this.opened.set({ libraryId: libraries[0], folderId: null });
    await this.refreshDetails();
  }

  /** Recharge les informations des fichiers et les utilisations (après un import, une suppression…). */
  async refreshDetails(): Promise<void> {
    const mediaIds = this.libraries()
      .flatMap((id) => this.nodesOf(id))
      .flatMap((n) => (n.kind === 'item' && n.mediaId ? [n.mediaId] : []));
    const [infos, usages] = await Promise.all([
      this.repository.getMediaInfo(mediaIds),
      this.repository.countSoundUsages(),
    ]);
    this.mediaInfo.set(Object.fromEntries(infos.map((info) => [info.id, info])));
    this.usages.set(usages);
  }

  private toRow(node: SoundNode): SoundRow {
    const nodes = this.nodesOf(node.libraryId);
    return {
      node,
      libraryId: node.libraryId,
      folders: node.parentId ? pathTo(nodes, node.parentId).map((n) => n.name) : [],
      media: (node.mediaId && this.mediaInfo()[node.mediaId]) || null,
      usages: this.usages()[node.id] ?? 0,
    };
  }

  /** Tous les nœuds d'une bibliothèque. */
  nodesOf(libraryId: SoundLibraryId): readonly SoundNode[] {
    return this.nodesByLibrary()[libraryId] ?? [];
  }

  /**
   * Sons contenus dans un dossier (sous-dossiers compris) et ceux qui sont utilisés par des
   * actions : avertissement avant de supprimer le dossier.
   */
  folderUsage(libraryId: SoundLibraryId, folderId: Id): { sounds: number; used: number } {
    const nodes = this.nodesOf(libraryId);
    const inside = descendantIds(nodes, folderId);
    const sounds = nodes.filter((n) => n.kind === 'item' && inside.has(n.id));
    const usages = this.usages();
    return { sounds: sounds.length, used: sounds.filter((n) => (usages[n.id] ?? 0) > 0).length };
  }

  /** Nombre d'actions qui utilisent un son. */
  soundUsages(id: Id): number {
    return this.usages()[id] ?? 0;
  }

  /** Ouvre un dossier (et quitte la recherche). */
  open(libraryId: SoundLibraryId, folderId: Id | null): void {
    this.opened.set({ libraryId, folderId });
    this.selectedSoundId.set(null);
    this.query.set('');
  }

  /**
   * Choix d'un nœud dans l'arborescence : un dossier s'ouvre ; un son ouvre son dossier et est
   * mis en évidence dans le tableau.
   */
  select(libraryId: SoundLibraryId, id: Id | null): void {
    const node = id ? this.nodesOf(libraryId).find((n) => n.id === id) : undefined;
    if (node?.kind !== 'item') {
      this.open(libraryId, node?.id ?? null);
      return;
    }
    this.open(libraryId, node.parentId);
    this.selectedSoundId.set(node.id);
  }

  /** Nœud sélectionné dans l'arborescence d'une bibliothèque : le son choisi, sinon le dossier ouvert. */
  selectedIn(libraryId: SoundLibraryId): Id | null {
    const opened = this.opened();
    return opened.libraryId === libraryId ? (this.selectedSoundId() ?? opened.folderId) : null;
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
    const siblings = this.nodesOf(libraryId).filter((n) => n.parentId === parentId);
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

  /**
   * Importe des fichiers son dans le dossier ouvert (SON-02, SON-06), dans l'ordre reçu, à la
   * suite des sons du dossier. Nom du son = nom du fichier sans extension. Les formats refusés
   * sont renvoyés ; une erreur de stockage (quota) arrête l'import et est renvoyée dans `failure`,
   * les sons déjà importés restent.
   */
  async importFiles(files: readonly File[]): Promise<ImportResult> {
    const { libraryId, folderId } = this.opened();
    const accepted = files.filter((file) => resolveMediaType(file)?.kind === 'sound');
    const rejected = files.filter((file) => !accepted.includes(file));
    const imported: SoundNode[] = [];
    let failure: unknown;
    this.importing.set(true);
    try {
      for (const file of accepted) {
        // Durée lue avant l'enregistrement (6.7) ; inconnue, le tableau affiche « — ».
        const durationMs = (await this.durations.read(file)) ?? undefined;
        const mediaId = await this.repository.uploadMedia(file, { durationMs });
        const siblings = this.nodesOf(libraryId).filter((n) => n.parentId === folderId);
        const node: SoundNode = {
          id: newId(),
          libraryId,
          parentId: folderId,
          order: siblings.length === 0 ? 0 : Math.max(...siblings.map((n) => n.order)) + 1,
          kind: 'item',
          name: soundName(file.name),
          mediaId,
        };
        await this.repository.saveSoundNodes([node]);
        this.replace(libraryId, [...this.nodesOf(libraryId), node]);
        imported.push(node);
      }
    } catch (error) {
      failure = error;
    } finally {
      this.importing.set(false);
      if (imported.length > 0) {
        await this.refreshDetails();
      }
    }
    return failure === undefined ? { imported, rejected } : { imported, rejected, failure };
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

  /**
   * Supprime un nœud et son contenu ; si le dossier ouvert disparaît, ouvre la racine. Renvoie les
   * identifiants supprimés (ex. pour arrêter la pré-écoute d'un son supprimé).
   */
  async remove(libraryId: SoundLibraryId, id: Id): Promise<ReadonlySet<Id>> {
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
    const selected = this.selectedSoundId();
    if (selected && removed.has(selected)) {
      this.selectedSoundId.set(null);
    }
    return removed;
  }

  /**
   * Déplace un dossier ou un son (glisser-déposer dans l'arborescence). Le rang (`move.order`)
   * est calculé parmi tous les nœuds du dossier cible, dossiers et sons.
   */
  async move(libraryId: SoundLibraryId, move: TreeMoveEvent): Promise<void> {
    const changed = applyMove(this.nodesOf(libraryId), move);
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

/** Nom par défaut d'un son importé : nom du fichier sans son extension. */
export const soundName = baseName;
