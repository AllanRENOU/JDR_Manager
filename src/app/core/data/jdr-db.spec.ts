import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';

import { DB_VERSION, openJdrDb } from './jdr-db';

describe('openJdrDb (schéma v1)', () => {
  const name = 'jdr-db-schema-test';

  afterEach(() => deleteDB(name));

  it('crée tous les stores et index du TRD §4.2', async () => {
    const db = await openJdrDb(name);
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual([
      'actions',
      'battlemaps',
      'media',
      'playSessions',
      'projects',
      'sceneNodes',
      'scenes',
      'soundNodes',
    ]);

    const tx = db.transaction([
      'sceneNodes',
      'scenes',
      'battlemaps',
      'actions',
      'soundNodes',
      'playSessions',
    ]);
    expect([...tx.objectStore('sceneNodes').indexNames]).toEqual(['projectId']);
    expect([...tx.objectStore('scenes').indexNames]).toEqual(['projectId']);
    expect([...tx.objectStore('battlemaps').indexNames].sort()).toEqual(['mediaId', 'sceneId']);
    expect([...tx.objectStore('actions').indexNames]).toEqual(['sceneId']);
    expect([...tx.objectStore('soundNodes').indexNames].sort()).toEqual(['libraryId', 'mediaId']);
    expect(tx.objectStore('playSessions').keyPath).toBe('projectId');
    db.close();
  });

  it('rouvre une base existante sans erreur', async () => {
    (await openJdrDb(name)).close();
    const db = await openJdrDb(name);
    expect(db.objectStoreNames.length).toBe(8);
    db.close();
  });
});
