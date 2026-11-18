import { InjectionToken, Service, inject } from '@angular/core';
import { IDBPTransaction } from 'idb';

import {
  Action,
  Battlemap,
  Id,
  Media,
  MediaInfo,
  PlaySession,
  Project,
  Scene,
  SceneNode,
  Sheet,
  SheetNode,
  LibraryId,
  LibraryNode,
  newId,
} from '../models';
import { resolveMediaType } from '../media/media-types';
import { DataError, isQuotaExceededError } from './data-error';
import {
  DataRepository,
  MediaDetails,
  ProjectData,
  SceneLink,
  StorageUsage,
} from './data-repository';
import { DB_NAME, JdrDb, JdrDbSchema, JdrStoreName, openJdrDb } from './jdr-db';
import { ALL_STORES, collectSubtree, deleteScenes, deleteUnusedMedia } from './jdr-db-cascade';

/** Nom de la base ; remplacé dans les tests pour isoler chaque test. */
export const INDEXED_DB_NAME = new InjectionToken<string>('IndexedDbName', {
  factory: () => DB_NAME,
});

/**
 * Implémentation IndexedDB du dépôt (TEC-20).
 * Seuls les fichiers de `core/data` importent `idb` (TEC-23, règle ESLint).
 */
@Service()
export class IndexedDbRepository implements DataRepository {
  private readonly dbName = inject(INDEXED_DB_NAME);
  private dbPromise: Promise<JdrDb> | null = null;

  /** Connexion ouverte à la première utilisation, puis partagée. */
  protected db(): Promise<JdrDb> {
    this.dbPromise ??= openJdrDb(this.dbName).catch((error: unknown) => {
      this.dbPromise = null;
      throw error;
    });
    return this.dbPromise;
  }

  /** Ferme la connexion (tests, changement de version). */
  async close(): Promise<void> {
    if (this.dbPromise) {
      (await this.dbPromise).close();
      this.dbPromise = null;
    }
  }

  // ── Projets ────────────────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    const projects = await (await this.db()).getAll('projects');
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(id: Id): Promise<Project | undefined> {
    return (await this.db()).get('projects', id);
  }

  async saveProject(project: Project): Promise<void> {
    await (await this.db()).put('projects', project);
  }

  async setProjectImage(projectId: Id, mediaId: Id | null): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    const project = await tx.objectStore('projects').get(projectId);
    if (!project) {
      tx.abort();
      await tx.done.catch(() => undefined);
      throw new DataError('project-not-found', `Projet introuvable : ${projectId}`);
    }
    const previous = project.imageMediaId ?? null;
    await tx.objectStore('projects').put({
      ...project,
      imageMediaId: mediaId,
      updatedAt: new Date().toISOString(),
    });
    if (previous && previous !== mediaId) {
      await deleteUnusedMedia(tx, [previous]);
    }
    await tx.done;
  }

  async deleteProject(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    const imageMediaId = (await tx.objectStore('projects').get(id))?.imageMediaId;

    for (const nodeId of await tx.objectStore('sceneNodes').index('projectId').getAllKeys(id)) {
      await tx.objectStore('sceneNodes').delete(nodeId);
    }
    const sceneIds = await tx.objectStore('scenes').index('projectId').getAllKeys(id);
    const mediaIds = await deleteScenes(tx, sceneIds);
    if (imageMediaId) {
      mediaIds.add(imageMediaId);
    }

    // Bibliothèque de sons du projet
    for (const sound of await tx.objectStore('soundNodes').index('libraryId').getAll(id)) {
      if (sound.mediaId) {
        mediaIds.add(sound.mediaId);
      }
      await tx.objectStore('soundNodes').delete(sound.id);
    }

    // Fiches du projet
    for (const nodeId of await tx.objectStore('sheetNodes').index('projectId').getAllKeys(id)) {
      await tx.objectStore('sheetNodes').delete(nodeId);
    }
    for (const sheetId of await tx.objectStore('sheets').index('projectId').getAllKeys(id)) {
      await tx.objectStore('sheets').delete(sheetId);
    }

    await tx.objectStore('playSessions').delete(id);
    await tx.objectStore('projects').delete(id);
    await deleteUnusedMedia(tx, mediaIds);
    await tx.done;
  }

  // ── Arborescence des scènes, scènes, battlemaps, actions ───────────────

  async listSceneNodes(projectId: Id): Promise<SceneNode[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('sceneNodes', 'projectId', projectId));
  }

  async saveSceneNodes(nodes: SceneNode[]): Promise<void> {
    const tx = (await this.db()).transaction('sceneNodes', 'readwrite');
    await Promise.all([...nodes.map((node) => tx.store.put(node)), tx.done]);
  }

  async deleteSceneNode(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    const node = await tx.objectStore('sceneNodes').get(id);
    if (!node) {
      await tx.done;
      return;
    }
    const projectNodes = await tx
      .objectStore('sceneNodes')
      .index('projectId')
      .getAll(node.projectId);
    const removed = collectSubtree(projectNodes, id);
    for (const n of removed) {
      await tx.objectStore('sceneNodes').delete(n.id);
    }
    const removedSceneIds = new Set(removed.filter((n) => n.kind === 'item').map((n) => n.id));
    const mediaIds = await deleteScenes(tx, removedSceneIds);

    // Références vers les scènes supprimées : première scène du projet et scènes suivantes.
    const project = await tx.objectStore('projects').get(node.projectId);
    if (project?.firstSceneId && removedSceneIds.has(project.firstSceneId)) {
      await tx.objectStore('projects').put({ ...project, firstSceneId: null });
    }
    for (const scene of await tx.objectStore('scenes').index('projectId').getAll(node.projectId)) {
      const nextSceneIds = scene.nextSceneIds.filter((sceneId) => !removedSceneIds.has(sceneId));
      if (nextSceneIds.length !== scene.nextSceneIds.length) {
        await tx.objectStore('scenes').put({ ...scene, nextSceneIds });
      }
    }

    await deleteUnusedMedia(tx, mediaIds);
    await tx.done;
  }

  async getScene(id: Id): Promise<Scene | undefined> {
    return (await this.db()).get('scenes', id);
  }

  async listScenes(projectId: Id): Promise<Scene[]> {
    return (await this.db()).getAllFromIndex('scenes', 'projectId', projectId);
  }

  async saveScene(scene: Scene): Promise<void> {
    await (await this.db()).put('scenes', scene);
  }

  async listBattlemaps(sceneId: Id): Promise<Battlemap[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('battlemaps', 'sceneId', sceneId));
  }

  async saveBattlemap(battlemap: Battlemap): Promise<void> {
    await (await this.db()).put('battlemaps', battlemap);
  }

  async deleteBattlemap(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    const battlemap = await tx.objectStore('battlemaps').get(id);
    if (battlemap) {
      await tx.objectStore('battlemaps').delete(id);
      const scene = await tx.objectStore('scenes').get(battlemap.sceneId);
      if (scene?.defaultBattlemapId === id) {
        await tx.objectStore('scenes').put({ ...scene, defaultBattlemapId: null });
      }
      await deleteUnusedMedia(tx, [battlemap.mediaId]);
    }
    await tx.done;
  }

  async listActions(sceneId: Id): Promise<Action[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('actions', 'sceneId', sceneId));
  }

  async saveAction(action: Action): Promise<void> {
    await (await this.db()).put('actions', action);
  }

  async deleteAction(id: Id): Promise<void> {
    await (await this.db()).delete('actions', id);
  }

  // ── Fiches du MJ (lot 15) ──────────────────────────────────────────────

  async listSheetNodes(projectId: Id): Promise<SheetNode[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('sheetNodes', 'projectId', projectId));
  }

  async saveSheetNodes(nodes: SheetNode[]): Promise<void> {
    const tx = (await this.db()).transaction('sheetNodes', 'readwrite');
    await Promise.all([...nodes.map((node) => tx.store.put(node)), tx.done]);
  }

  async deleteSheetNode(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(['sheetNodes', 'sheets'], 'readwrite');
    const node = await tx.objectStore('sheetNodes').get(id);
    if (node) {
      const projectNodes = await tx
        .objectStore('sheetNodes')
        .index('projectId')
        .getAll(node.projectId);
      for (const n of collectSubtree(projectNodes, id)) {
        await tx.objectStore('sheetNodes').delete(n.id);
        await tx.objectStore('sheets').delete(n.id);
      }
    }
    await tx.done;
  }

  async listSheets(projectId: Id): Promise<Sheet[]> {
    return (await this.db()).getAllFromIndex('sheets', 'projectId', projectId);
  }

  async getSheet(id: Id): Promise<Sheet | undefined> {
    return (await this.db()).get('sheets', id);
  }

  async saveSheet(sheet: Sheet): Promise<void> {
    await (await this.db()).put('sheets', sheet);
  }

  async countSheetUsages(projectId: Id): Promise<Record<Id, number>> {
    const db = await this.db();
    const tx = db.transaction(['sceneNodes', 'actions']);
    const sceneIds = (await tx.objectStore('sceneNodes').index('projectId').getAll(projectId))
      .filter((n) => n.kind === 'item')
      .map((n) => n.id);
    const counts: Record<Id, number> = {};
    for (const sceneId of sceneIds) {
      for (const action of await tx.objectStore('actions').index('sceneId').getAll(sceneId)) {
        // Une action compte une fois par fiche, même si plusieurs éléments la visent.
        const sheetIds = new Set(
          action.elements.flatMap((e) => (e.type === 'show-sheet' && e.sheetId ? [e.sheetId] : [])),
        );
        for (const sheetId of sheetIds) {
          counts[sheetId] = (counts[sheetId] ?? 0) + 1;
        }
      }
    }
    await tx.done;
    return counts;
  }

  // ── Bibliothèques (sons et vidéos ; store `soundNodes`) ────────────────

  async listLibraryNodes(libraryId: LibraryId): Promise<LibraryNode[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('soundNodes', 'libraryId', libraryId));
  }

  async saveLibraryNodes(nodes: LibraryNode[]): Promise<void> {
    const tx = (await this.db()).transaction('soundNodes', 'readwrite');
    await Promise.all([...nodes.map((node) => tx.store.put(node)), tx.done]);
  }

  async deleteLibraryNode(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    const node = await tx.objectStore('soundNodes').get(id);
    if (node) {
      const library = await tx.objectStore('soundNodes').index('libraryId').getAll(node.libraryId);
      const mediaIds = new Set<Id>();
      for (const n of collectSubtree(library, id)) {
        if (n.mediaId) {
          mediaIds.add(n.mediaId);
        }
        await tx.objectStore('soundNodes').delete(n.id);
      }
      await deleteUnusedMedia(tx, mediaIds);
    }
    await tx.done;
  }

  async listSceneLinks(projectId: Id): Promise<SceneLink[]> {
    const db = await this.db();
    const sceneIds = new Set(
      (await db.getAllFromIndex('sceneNodes', 'projectId', projectId))
        .filter((n) => n.kind === 'item')
        .map((n) => n.id),
    );
    const links: SceneLink[] = [];
    for (const action of await db.getAll('actions')) {
      if (!sceneIds.has(action.sceneId)) {
        continue;
      }
      const targetIds = [
        ...new Set(
          action.elements.flatMap((e) =>
            e.type === 'change-scene' && e.sceneId ? [e.sceneId] : [],
          ),
        ),
      ];
      if (targetIds.length) {
        links.push({ actionId: action.id, sceneId: action.sceneId, targetIds });
      }
    }
    return links;
  }

  async getStorageUsage(): Promise<StorageUsage> {
    const usage: StorageUsage = {
      images: { count: 0, bytes: 0 },
      sounds: { count: 0, bytes: 0 },
      videos: { count: 0, bytes: 0 },
    };
    // Parcours par curseur : seuls le type et la taille sont lus, pas le contenu des fichiers.
    let cursor = await (await this.db()).transaction('media').store.openCursor();
    while (cursor) {
      const { mimeType } = cursor.value;
      const kind = mimeType.startsWith('audio/')
        ? usage.sounds
        : mimeType.startsWith('video/')
          ? usage.videos
          : usage.images;
      kind.count += 1;
      kind.bytes += cursor.value.size;
      cursor = await cursor.continue();
    }
    return usage;
  }

  async countLibraryUsages(): Promise<Record<Id, number>> {
    const counts: Record<Id, number> = {};
    for (const action of await (await this.db()).getAll('actions')) {
      // Une action compte une fois par son ou vidéo, même si plusieurs éléments le visent.
      const nodeIds = new Set<Id>();
      for (const element of action.elements) {
        if (element.type === 'play-sound' || element.type === 'stop-sound') {
          nodeIds.add(element.soundId);
        } else if (element.type === 'play-video') {
          nodeIds.add(element.videoId);
        }
      }
      for (const id of nodeIds) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }

  // ── Médias ─────────────────────────────────────────────────────────────

  async uploadMedia(file: File, details: MediaDetails = {}): Promise<Id> {
    const media = toMedia(newId(), file, details);
    await withQuotaError(file.name, async () => {
      await (await this.db()).add('media', media);
    });
    return media.id;
  }

  async importMedia(id: Id, file: File, details: MediaDetails = {}): Promise<boolean> {
    const media = toMedia(id, file, details);
    return withQuotaError(file.name, async () => {
      // Lecture et écriture dans la même transaction : deux imports simultanés du même média
      // ne peuvent pas l'écrire deux fois.
      const tx = (await this.db()).transaction('media', 'readwrite');
      if ((await tx.store.getKey(id)) !== undefined) {
        await tx.done;
        return false;
      }
      await Promise.all([tx.store.add(media), tx.done]);
      return true;
    });
  }

  async getMediaBlob(id: Id): Promise<Blob> {
    const media = await (await this.db()).get('media', id);
    if (!media) {
      throw new DataError('media-not-found', `Média introuvable : ${id}`);
    }
    return media.blob;
  }

  async listMissingMedia(): Promise<Id[]> {
    const tx = (await this.db()).transaction(['battlemaps', 'soundNodes', 'media']);
    // Curseurs sur les index `mediaId` : seules les clés sont lues (un dossier n'y figure pas).
    const referenced = new Set<Id>();
    let battlemaps = await tx.objectStore('battlemaps').index('mediaId').openKeyCursor();
    while (battlemaps) {
      referenced.add(battlemaps.key);
      battlemaps = await battlemaps.continue();
    }
    let nodes = await tx.objectStore('soundNodes').index('mediaId').openKeyCursor();
    while (nodes) {
      referenced.add(nodes.key);
      nodes = await nodes.continue();
    }
    const missing: Id[] = [];
    for (const id of referenced) {
      if ((await tx.objectStore('media').getKey(id)) === undefined) {
        missing.push(id);
      }
    }
    await tx.done;
    return missing;
  }

  // ── Import d'un projet (lot 16) ────────────────────────────────────────

  async importProjectData(data: ProjectData): Promise<void> {
    const tx = (await this.db()).transaction([...IMPORT_STORES], 'readwrite');
    let replacedImage: Id | null = null;
    try {
      // Image du projet : un export qui n'en parle pas (antérieur à l'image) garde l'image locale.
      const local = await tx.objectStore('projects').get(data.project.id);
      const localImage = local?.imageMediaId ?? null;
      if (data.project.imageMediaId === undefined && localImage) {
        data = { ...data, project: { ...data.project, imageMediaId: localImage } };
      } else if (localImage && localImage !== data.project.imageMediaId) {
        replacedImage = localImage;
      }
      await writeProjectData(tx, data);
    } catch (error) {
      // Sans annulation explicite, IndexedDB validerait les écritures déjà faites.
      try {
        tx.abort();
      } catch {
        // Transaction déjà annulée par l'erreur.
      }
      await tx.done.catch(() => undefined);
      throw error;
    }
    await tx.done;
    if (replacedImage) {
      await this.deleteMedia(replacedImage);
    }
  }

  async getMediaInfo(ids: readonly Id[]): Promise<MediaInfo[]> {
    const tx = (await this.db()).transaction('media');
    const found = await Promise.all(ids.map((id) => tx.store.get(id)));
    await tx.done;
    return found
      .filter((media): media is Media => media !== undefined)
      .map(({ blob: _blob, ...info }) => info);
  }

  async getMediaUrl(mediaId: Id): Promise<string> {
    const media = await (await this.db()).get('media', mediaId);
    if (!media) {
      throw new DataError('media-not-found', `Média introuvable : ${mediaId}`);
    }
    // Nouvelle URL à chaque appel : c'est MediaUrls qui la partage et la révoque (TEC-33).
    return URL.createObjectURL(media.blob);
  }

  async deleteMedia(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');
    await deleteUnusedMedia(tx, [id]);
    await tx.done;
  }

  // ── Partie sauvegardée ─────────────────────────────────────────────────

  async getPlaySession(projectId: Id): Promise<PlaySession | undefined> {
    return (await this.db()).get('playSessions', projectId);
  }

  async savePlaySession(session: PlaySession): Promise<void> {
    await (await this.db()).put('playSessions', session);
  }

  async deletePlaySession(projectId: Id): Promise<void> {
    await (await this.db()).delete('playSessions', projectId);
  }
}

/** Stores écrits par l'import d'un projet (tous sauf `media` et `playSessions`). */
const IMPORT_STORES = [
  'projects',
  'sceneNodes',
  'scenes',
  'battlemaps',
  'actions',
  'soundNodes',
  'sheetNodes',
  'sheets',
] as const satisfies readonly JdrStoreName[];

type ImportTransaction = IDBPTransaction<
  JdrDbSchema,
  (typeof IMPORT_STORES)[number][],
  'readwrite'
>;

/** Écrit les objets d'un projet dans la transaction d'import (voir `importProjectData`). */
async function writeProjectData(tx: ImportTransaction, data: ProjectData): Promise<void> {
  await tx.objectStore('projects').put(data.project);
  for (const node of data.sceneNodes) {
    await tx.objectStore('sceneNodes').put(node);
  }
  for (const scene of data.scenes) {
    await tx.objectStore('scenes').put(scene);
  }
  for (const battlemap of data.battlemaps) {
    await tx.objectStore('battlemaps').put(battlemap);
  }
  for (const action of data.actions) {
    await tx.objectStore('actions').put(action);
  }
  for (const node of data.sheetNodes) {
    await tx.objectStore('sheetNodes').put(node);
  }
  for (const sheet of data.sheets) {
    await tx.objectStore('sheets').put(sheet);
  }

  // Bibliothèque : un nœud qui existe déjà dans une autre bibliothèque n'est pas déplacé.
  const library = tx.objectStore('soundNodes');
  const written: LibraryNode[] = [];
  for (const node of data.libraryNodes) {
    const existing = await library.get(node.id);
    if (!existing || existing.libraryId === node.libraryId) {
      written.push(node);
    }
  }
  const writtenIds = new Map(written.map((n) => [n.id, n.libraryId]));
  for (const node of written) {
    let parentId = node.parentId;
    if (parentId !== null) {
      const parentLibrary = writtenIds.get(parentId) ?? (await library.get(parentId))?.libraryId;
      if (parentLibrary !== node.libraryId) {
        parentId = null;
      }
    }
    await library.put(parentId === node.parentId ? node : { ...node, parentId });
  }
}

/**
 * Prépare le média d'un fichier accepté : copie en Blob natif (TEC-30), le média ne dépend plus
 * du fichier d'origine.
 * @throws DataError `unsupported-media-type`.
 */
function toMedia(id: Id, file: File, details: MediaDetails): Media {
  const type = resolveMediaType(file);
  if (!type) {
    throw new DataError('unsupported-media-type', `Format non pris en charge : ${file.name}`);
  }
  const blob = new Blob([file], { type: type.mimeType });
  return {
    id,
    blob,
    mimeType: type.mimeType,
    size: blob.size,
    fileName: file.name,
    ...(details.durationMs !== undefined && { durationMs: details.durationMs }),
  };
}

/**
 * Exécute une écriture de média ; un dépassement de quota devient une `DataError`
 * `quota-exceeded` (échec propre, TRD §5 : rien n'est enregistré).
 */
async function withQuotaError<T>(fileName: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new DataError('quota-exceeded', `Espace de stockage insuffisant pour ${fileName}`, {
        cause: error,
      });
    }
    throw error;
  }
}

/** Trie par `order` croissant (arborescences, battlemaps, actions). */
function byOrder<T extends { order: number }>(items: T[]): T[] {
  return items.sort((a, b) => a.order - b.order);
}
