import { DBSchema, IDBPDatabase, IDBPObjectStore, openDB } from 'idb';

import {
  Action,
  Battlemap,
  Id,
  Media,
  PlaySession,
  Project,
  Scene,
  SceneNode,
  SoundNode,
} from '../models';

/** Nom de la base IndexedDB de l'application. */
export const DB_NAME = 'jdr-manager';

/** Version courante du schéma (TEC-25). Toute modification du schéma l'incrémente. */
export const DB_VERSION = 2;

/** Schéma IndexedDB (TRD §4.2), typé pour `idb`. */
export interface JdrDbSchema extends DBSchema {
  projects: { key: Id; value: Project };
  sceneNodes: { key: Id; value: SceneNode; indexes: { projectId: Id } };
  scenes: { key: Id; value: Scene; indexes: { projectId: Id } };
  battlemaps: { key: Id; value: Battlemap; indexes: { sceneId: Id; mediaId: Id } };
  actions: { key: Id; value: Action; indexes: { sceneId: Id } };
  soundNodes: { key: Id; value: SoundNode; indexes: { libraryId: string; mediaId: Id } };
  media: { key: Id; value: Media };
  playSessions: { key: Id; value: PlaySession };
}

export type JdrDb = IDBPDatabase<JdrDbSchema>;

/** Noms des stores, pour ouvrir des transactions sur plusieurs stores. */
export type JdrStoreName =
  | 'projects'
  | 'sceneNodes'
  | 'scenes'
  | 'battlemaps'
  | 'actions'
  | 'soundNodes'
  | 'media'
  | 'playSessions';

/**
 * Ouvre la base et applique les migrations nécessaires (TEC-25).
 * Chaque version ajoute un bloc `if (oldVersion < N)` : les migrations s'enchaînent depuis
 * n'importe quelle version installée.
 */
export function openJdrDb(name: string = DB_NAME): Promise<JdrDb> {
  return openDB<JdrDbSchema>(name, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore('projects', { keyPath: 'id' });

        db.createObjectStore('sceneNodes', { keyPath: 'id' }).createIndex('projectId', 'projectId');
        db.createObjectStore('scenes', { keyPath: 'id' }).createIndex('projectId', 'projectId');

        const battlemaps = db.createObjectStore('battlemaps', { keyPath: 'id' });
        battlemaps.createIndex('sceneId', 'sceneId');
        battlemaps.createIndex('mediaId', 'mediaId');

        db.createObjectStore('actions', { keyPath: 'id' }).createIndex('sceneId', 'sceneId');

        const soundNodes = db.createObjectStore('soundNodes', { keyPath: 'id' });
        soundNodes.createIndex('libraryId', 'libraryId');
        soundNodes.createIndex('mediaId', 'mediaId');

        db.createObjectStore('media', { keyPath: 'id' });
        db.createObjectStore('playSessions', { keyPath: 'projectId' });
      }
      if (oldVersion < 2) {
        // « Afficher / Masquer l'action » visent une liste d'actions : `actionId` → `actionIds`.
        void migrateActionTargets(transaction.objectStore('actions'));
      }
    },
    blocking(_currentVersion, _blockedVersion, event) {
      // Un autre onglet ouvre une version plus récente : on libère la base pour ne pas le bloquer.
      (event.target as IDBDatabase).close();
    },
  });
}

/** Élément « Afficher / Masquer l'action » enregistré avant la version 2 du schéma. */
interface LegacyActionTarget {
  type: string;
  actionId?: string;
  actionIds?: string[];
}

/**
 * Version 2 : les éléments `show-action` / `hide-action` passent d'une cible (`actionId`) à une
 * liste (`actionIds`). Un `actionId` vide (« Masquer toutes les actions ») donne une liste vide.
 */
async function migrateActionTargets(
  store: IDBPObjectStore<JdrDbSchema, ArrayLike<JdrStoreName>, 'actions', 'versionchange'>,
): Promise<void> {
  let cursor = await store.openCursor();
  while (cursor) {
    const action = cursor.value;
    let changed = false;
    const elements = action.elements.map((element) => {
      const legacy = element as unknown as LegacyActionTarget;
      if ((legacy.type !== 'show-action' && legacy.type !== 'hide-action') || legacy.actionIds) {
        return element;
      }
      changed = true;
      const { actionId, ...rest } = legacy;
      return { ...rest, actionIds: actionId ? [actionId] : [] } as unknown as typeof element;
    });
    if (changed) {
      await cursor.update({ ...action, elements });
    }
    cursor = await cursor.continue();
  }
}
