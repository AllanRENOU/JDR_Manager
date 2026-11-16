import 'fake-indexeddb/auto';

import { deleteDB, openDB } from 'idb';

import { DB_VERSION, openJdrDb } from './jdr-db';

describe('openJdrDb', () => {
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
      'sheetNodes',
      'sheets',
      'soundNodes',
    ]);

    const tx = db.transaction([
      'sceneNodes',
      'scenes',
      'battlemaps',
      'actions',
      'soundNodes',
      'playSessions',
      'sheetNodes',
      'sheets',
    ]);
    expect([...tx.objectStore('sceneNodes').indexNames]).toEqual(['projectId']);
    expect([...tx.objectStore('scenes').indexNames]).toEqual(['projectId']);
    expect([...tx.objectStore('battlemaps').indexNames].sort()).toEqual(['mediaId', 'sceneId']);
    expect([...tx.objectStore('actions').indexNames]).toEqual(['sceneId']);
    expect([...tx.objectStore('soundNodes').indexNames].sort()).toEqual(['libraryId', 'mediaId']);
    expect(tx.objectStore('playSessions').keyPath).toBe('projectId');
    expect([...tx.objectStore('sheetNodes').indexNames]).toEqual(['projectId']);
    expect([...tx.objectStore('sheets').indexNames]).toEqual(['projectId']);
    db.close();
  });

  it('version 2 : « Afficher / Masquer l’action » passent de actionId à actionIds', async () => {
    // Base en version 1, telle qu'enregistrée avant la liste d'actions.
    const v1 = await openDB(name, 1, {
      upgrade(db) {
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
      },
    });
    await v1.put('actions', {
      id: 'a1',
      sceneId: 's1',
      elements: [
        { id: 'e1', type: 'show-action', actionId: 'fuite' },
        { id: 'e2', type: 'hide-action', actionId: '', all: true },
        { id: 'e3', type: 'add-text', text: 'Bonjour' },
      ],
    });
    v1.close();

    const db = await openJdrDb(name);
    expect((await db.get('actions', 'a1'))?.elements).toEqual([
      { id: 'e1', type: 'show-action', actionIds: ['fuite'] },
      { id: 'e2', type: 'hide-action', actionIds: [], all: true },
      { id: 'e3', type: 'add-text', text: 'Bonjour' },
    ]);
    db.close();
  });

  it('version 3 : ajoute les stores des fiches en gardant les données', async () => {
    // Base en version 2 (stores réduits à ceux utiles au test), rouverte en version courante.
    const old = await openDB(name, 2, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'id' });
        db.createObjectStore('actions', { keyPath: 'id' }).createIndex('sceneId', 'sceneId');
      },
    });
    await old.put('projects', { id: 'p1', name: 'La crypte' });
    old.close();

    const db = await openJdrDb(name);
    expect(db.objectStoreNames.contains('sheetNodes')).toBe(true);
    expect(db.objectStoreNames.contains('sheets')).toBe(true);
    expect(await db.get('projects', 'p1')).toEqual({ id: 'p1', name: 'La crypte' });
    db.close();
  });

  it('rouvre une base existante sans erreur', async () => {
    (await openJdrDb(name)).close();
    const db = await openJdrDb(name);
    expect(db.objectStoreNames.length).toBe(10);
    db.close();
  });
});
