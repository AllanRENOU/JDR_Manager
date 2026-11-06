import { InjectionToken, Service, inject } from '@angular/core';

import {
  Action,
  Battlemap,
  Id,
  Media,
  PlaySession,
  Project,
  Scene,
  SceneNode,
  SoundLibraryId,
  SoundNode,
  newId,
} from '../models';
import { resolveMediaType } from '../media/media-types';
import { DataError, isQuotaExceededError } from './data-error';
import { DataRepository } from './data-repository';
import { DB_NAME, JdrDb, openJdrDb } from './jdr-db';
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

  async deleteProject(id: Id): Promise<void> {
    const tx = (await this.db()).transaction(ALL_STORES, 'readwrite');

    for (const nodeId of await tx.objectStore('sceneNodes').index('projectId').getAllKeys(id)) {
      await tx.objectStore('sceneNodes').delete(nodeId);
    }
    const sceneIds = await tx.objectStore('scenes').index('projectId').getAllKeys(id);
    const mediaIds = await deleteScenes(tx, sceneIds);

    // Bibliothèque de sons du projet
    for (const sound of await tx.objectStore('soundNodes').index('libraryId').getAll(id)) {
      if (sound.mediaId) {
        mediaIds.add(sound.mediaId);
      }
      await tx.objectStore('soundNodes').delete(sound.id);
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

  // ── Bibliothèques de sons ──────────────────────────────────────────────

  async listSoundNodes(libraryId: SoundLibraryId): Promise<SoundNode[]> {
    const db = await this.db();
    return byOrder(await db.getAllFromIndex('soundNodes', 'libraryId', libraryId));
  }

  async saveSoundNodes(nodes: SoundNode[]): Promise<void> {
    const tx = (await this.db()).transaction('soundNodes', 'readwrite');
    await Promise.all([...nodes.map((node) => tx.store.put(node)), tx.done]);
  }

  async deleteSoundNode(id: Id): Promise<void> {
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

  // ── Médias ─────────────────────────────────────────────────────────────

  async uploadMedia(file: File): Promise<Id> {
    const type = resolveMediaType(file);
    if (!type) {
      throw new DataError('unsupported-media-type', `Format non pris en charge : ${file.name}`);
    }
    // Copie en Blob natif (TEC-30) : le média ne dépend plus du fichier d'origine.
    const blob = new Blob([file], { type: type.mimeType });
    const media: Media = {
      id: newId(),
      blob,
      mimeType: type.mimeType,
      size: blob.size,
      fileName: file.name,
    };
    try {
      await (await this.db()).add('media', media);
    } catch (error) {
      // Échec propre (TRD §5) : rien n'est enregistré, l'écran affiche `error.data.quota-exceeded`.
      if (isQuotaExceededError(error)) {
        throw new DataError('quota-exceeded', `Espace de stockage insuffisant pour ${file.name}`, {
          cause: error,
        });
      }
      throw error;
    }
    return media.id;
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

/** Trie par `order` croissant (arborescences, battlemaps, actions). */
function byOrder<T extends { order: number }>(items: T[]): T[] {
  return items.sort((a, b) => a.order - b.order);
}
