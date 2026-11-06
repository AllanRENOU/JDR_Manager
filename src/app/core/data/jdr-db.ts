import { DBSchema, IDBPDatabase, openDB } from 'idb';

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
export const DB_VERSION = 1;

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
    upgrade(db, oldVersion) {
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
    },
    blocking(_currentVersion, _blockedVersion, event) {
      // Un autre onglet ouvre une version plus récente : on libère la base pour ne pas le bloquer.
      (event.target as IDBDatabase).close();
    },
  });
}
