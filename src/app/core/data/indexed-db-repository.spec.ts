import 'fake-indexeddb/auto';

import { TestBed } from '@angular/core/testing';
import { deleteDB } from 'idb';

import {
  aBattlemap,
  aMedia,
  aPlaySession,
  aProject,
  aScene,
  aSceneNode,
  aSoundNode,
  anAction,
} from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { stubObjectUrls } from '../../../testing/object-url';
import { GLOBAL_SOUND_LIBRARY } from '../models';
import { isDataError } from './data-error';
import { JdrDb, openJdrDb } from './jdr-db';
import { INDEXED_DB_NAME, IndexedDbRepository } from './indexed-db-repository';

describe('IndexedDbRepository', () => {
  let dbName: string;
  let repository: IndexedDbRepository;
  /** Accès direct à la base, pour préparer ou vérifier des données hors contrat. */
  let raw: JdrDb;

  beforeEach(async () => {
    dbName = `jdr-test-${crypto.randomUUID()}`;
    TestBed.configureTestingModule({ providers: [{ provide: INDEXED_DB_NAME, useValue: dbName }] });
    repository = TestBed.inject(IndexedDbRepository);
    raw = await openJdrDb(dbName);
  });

  afterEach(async () => {
    raw.close();
    await repository.close();
    await deleteDB(dbName);
  });

  describe('projets', () => {
    it('enregistre, relit et liste les projets du plus récent au plus ancien', async () => {
      const old = aProject({ name: 'Ancien', updatedAt: '2026-01-01T00:00:00.000Z' });
      const recent = aProject({ name: 'Récent', updatedAt: '2026-06-01T00:00:00.000Z' });
      await repository.saveProject(old);
      await repository.saveProject(recent);

      expect(await repository.getProject(old.id)).toEqual(old);
      expect((await repository.listProjects()).map((p) => p.name)).toEqual(['Récent', 'Ancien']);
    });

    it('remplace un projet existant', async () => {
      const project = aProject();
      await repository.saveProject(project);
      await repository.saveProject({ ...project, name: 'Renommé' });
      expect((await repository.getProject(project.id))?.name).toBe('Renommé');
      expect(await repository.listProjects()).toHaveLength(1);
    });

    it('renvoie undefined pour un projet inconnu', async () => {
      expect(await repository.getProject('inconnu')).toBeUndefined();
    });

    it('supprime le projet et tout son contenu, en gardant ce qui appartient aux autres', async () => {
      const project = aProject();
      const other = aProject();
      const node = aSceneNode(project.id);
      const scene = aScene(project.id, node.id);
      const sharedMedia = aMedia();
      const ownMedia = aMedia();
      const soundMedia = aMedia({ mimeType: 'audio/mpeg' });
      const battlemap = aBattlemap(scene.id, ownMedia.id);
      const sharedBattlemap = aBattlemap(scene.id, sharedMedia.id);
      const action = anAction(scene.id);
      const sound = aSoundNode(project.id, { mediaId: soundMedia.id });

      const otherNode = aSceneNode(other.id);
      const otherScene = aScene(other.id, otherNode.id);
      const otherBattlemap = aBattlemap(otherScene.id, sharedMedia.id);
      const globalSound = aSoundNode('global');

      await raw.put('projects', project);
      await raw.put('projects', other);
      for (const m of [sharedMedia, ownMedia, soundMedia]) await raw.put('media', m);
      for (const n of [node, otherNode]) await raw.put('sceneNodes', n);
      for (const s of [scene, otherScene]) await raw.put('scenes', s);
      for (const b of [battlemap, sharedBattlemap, otherBattlemap]) await raw.put('battlemaps', b);
      await raw.put('actions', action);
      for (const s of [sound, globalSound]) await raw.put('soundNodes', s);
      await raw.put('playSessions', aPlaySession(project.id, scene.id));

      await repository.deleteProject(project.id);

      expect(await raw.get('projects', project.id)).toBeUndefined();
      expect(await raw.get('sceneNodes', node.id)).toBeUndefined();
      expect(await raw.get('scenes', scene.id)).toBeUndefined();
      expect(await raw.get('battlemaps', battlemap.id)).toBeUndefined();
      expect(await raw.get('actions', action.id)).toBeUndefined();
      expect(await raw.get('soundNodes', sound.id)).toBeUndefined();
      expect(await raw.get('playSessions', project.id)).toBeUndefined();
      expect(await raw.get('media', ownMedia.id)).toBeUndefined();
      expect(await raw.get('media', soundMedia.id)).toBeUndefined();

      // Données des autres projets et de la bibliothèque globale conservées
      expect(await raw.get('projects', other.id)).toBeDefined();
      expect(await raw.get('scenes', otherScene.id)).toBeDefined();
      expect(await raw.get('battlemaps', otherBattlemap.id)).toBeDefined();
      expect(await raw.get('soundNodes', globalSound.id)).toBeDefined();
      // Média encore utilisé par l'autre projet
      expect(await raw.get('media', sharedMedia.id)).toBeDefined();
    });
  });
  describe('scènes, battlemaps, actions', () => {
    it('liste les nœuds d’un projet triés par ordre et les enregistre en lot', async () => {
      const project = aProject();
      const b = aSceneNode(project.id, { name: 'B', order: 1 });
      const a = aSceneNode(project.id, { name: 'A', order: 0 });
      await repository.saveSceneNodes([b, a, aSceneNode('autre-projet')]);
      expect((await repository.listSceneNodes(project.id)).map((n) => n.name)).toEqual(['A', 'B']);
    });

    it('enregistre et relit une scène', async () => {
      const scene = aScene('p1', 's1', { nextSceneIds: ['s2'] });
      await repository.saveScene(scene);
      expect(await repository.getScene('s1')).toEqual(scene);
      expect(await repository.getScene('inconnue')).toBeUndefined();
    });

    it('supprime un dossier avec ses descendants, leurs scènes, battlemaps, actions et médias', async () => {
      const project = aProject();
      const folder = aSceneNode(project.id, { kind: 'folder', name: 'Acte 1' });
      const sub = aSceneNode(project.id, { kind: 'folder', parentId: folder.id });
      const inFolder = aSceneNode(project.id, { parentId: folder.id });
      const deep = aSceneNode(project.id, { parentId: sub.id });
      const kept = aSceneNode(project.id);
      const media = aMedia();
      const battlemap = aBattlemap(deep.id, media.id);
      const action = anAction(inFolder.id);
      await repository.saveProject({ ...project, firstSceneId: inFolder.id });
      await repository.saveSceneNodes([folder, sub, inFolder, deep, kept]);
      for (const n of [inFolder, deep]) await repository.saveScene(aScene(project.id, n.id));
      await repository.saveScene(aScene(project.id, kept.id, { nextSceneIds: [deep.id, 'x'] }));
      await raw.put('media', media);
      await repository.saveBattlemap(battlemap);
      await repository.saveAction(action);

      await repository.deleteSceneNode(folder.id);

      expect((await repository.listSceneNodes(project.id)).map((n) => n.id)).toEqual([kept.id]);
      expect(await repository.getScene(inFolder.id)).toBeUndefined();
      expect(await repository.getScene(deep.id)).toBeUndefined();
      expect(await repository.listBattlemaps(deep.id)).toEqual([]);
      expect(await repository.listActions(inFolder.id)).toEqual([]);
      expect(await raw.get('media', media.id)).toBeUndefined();
      // Références nettoyées
      expect((await repository.getProject(project.id))?.firstSceneId).toBeNull();
      expect((await repository.getScene(kept.id))?.nextSceneIds).toEqual(['x']);
    });

    it('ignore la suppression d’un nœud inconnu', async () => {
      await expect(repository.deleteSceneNode('inconnu')).resolves.toBeUndefined();
    });

    it('gère les battlemaps : tri, suppression, image et battlemap par défaut', async () => {
      const scene = aScene('p1', 's1');
      const media = aMedia();
      const second = aBattlemap(scene.id, media.id, { name: 'Deux', order: 1 });
      const first = aBattlemap(scene.id, media.id, { name: 'Un', order: 0 });
      await raw.put('media', media);
      await repository.saveScene({ ...scene, defaultBattlemapId: first.id });
      await repository.saveBattlemap(second);
      await repository.saveBattlemap(first);
      expect((await repository.listBattlemaps(scene.id)).map((b) => b.name)).toEqual([
        'Un',
        'Deux',
      ]);

      // L'image est partagée par les deux battlemaps : conservée tant que l'une l'utilise.
      await repository.deleteBattlemap(first.id);
      expect((await repository.getScene(scene.id))?.defaultBattlemapId).toBeNull();
      expect(await raw.get('media', media.id)).toBeDefined();

      await repository.deleteBattlemap(second.id);
      expect(await repository.listBattlemaps(scene.id)).toEqual([]);
      expect(await raw.get('media', media.id)).toBeUndefined();
    });

    it('gère les actions : tri, remplacement, suppression', async () => {
      const second = anAction('s1', { name: 'Deux', order: 1 });
      const first = anAction('s1', {
        name: 'Un',
        order: 0,
        trigger: 'scene-open',
        isSceneText: true,
      });
      await repository.saveAction(second);
      await repository.saveAction(first);
      await repository.saveAction({ ...second, name: 'Deux bis' });
      expect((await repository.listActions('s1')).map((a) => a.name)).toEqual(['Un', 'Deux bis']);
      expect((await repository.listActions('s1'))[0]).toEqual(first);

      await repository.deleteAction(first.id);
      expect((await repository.listActions('s1')).map((a) => a.id)).toEqual([second.id]);
    });
  });
  describe('bibliothèques de sons', () => {
    it('sépare la bibliothèque globale de celles des projets et trie par ordre', async () => {
      const project = aProject();
      await repository.saveSoundNodes([
        aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie', order: 1 }),
        aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Orage', order: 0 }),
        aSoundNode(project.id, { name: 'Thème du méchant' }),
      ]);
      expect((await repository.listSoundNodes(GLOBAL_SOUND_LIBRARY)).map((n) => n.name)).toEqual([
        'Orage',
        'Pluie',
      ]);
      expect((await repository.listSoundNodes(project.id)).map((n) => n.name)).toEqual([
        'Thème du méchant',
      ]);
    });

    it('supprime un dossier de sons avec ses descendants et les fichiers devenus inutilisés', async () => {
      const used = aMedia({ mimeType: 'audio/mpeg' });
      const shared = aMedia({ mimeType: 'audio/mpeg' });
      const folder = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Ambiances' });
      const rain = aSoundNode(GLOBAL_SOUND_LIBRARY, { parentId: folder.id, mediaId: used.id });
      const wind = aSoundNode(GLOBAL_SOUND_LIBRARY, { parentId: folder.id, mediaId: shared.id });
      const kept = aSoundNode(GLOBAL_SOUND_LIBRARY, { mediaId: shared.id });
      await raw.put('media', used);
      await raw.put('media', shared);
      await repository.saveSoundNodes([folder, rain, wind, kept]);

      await repository.deleteSoundNode(folder.id);

      expect((await repository.listSoundNodes(GLOBAL_SOUND_LIBRARY)).map((n) => n.id)).toEqual([
        kept.id,
      ]);
      expect(await raw.get('media', used.id)).toBeUndefined();
      expect(await raw.get('media', shared.id)).toBeDefined();
    });

    it('compte les actions qui lancent ou arrêtent chaque son, tous projets confondus', async () => {
      const rain = aSoundNode(GLOBAL_SOUND_LIBRARY);
      const wind = aSoundNode(GLOBAL_SOUND_LIBRARY);
      const play = (soundId: string) => ({
        id: crypto.randomUUID(),
        type: 'play-sound' as const,
        soundId,
        volume: 1,
        loop: false,
        fadeInMs: 0,
        fadeOutMs: 0,
      });
      await repository.saveAction(
        anAction('scene-a', {
          elements: [play(rain.id), { id: 'x', type: 'stop-sound', soundId: rain.id }],
        }),
      );
      await repository.saveAction(
        anAction('scene-b', { elements: [play(rain.id), play(wind.id)] }),
      );
      await repository.saveAction(anAction('scene-c'));

      expect(await repository.countSoundUsages()).toEqual({ [rain.id]: 2, [wind.id]: 1 });
    });

    it('liste les liens « Changer de scène » des actions du projet (12.3)', async () => {
      const a = aSceneNode('p1', { id: 'scene-a' });
      const b = aSceneNode('p1', { id: 'scene-b' });
      await repository.saveSceneNodes([a, b, aSceneNode('p2', { id: 'autre' })]);
      await repository.saveAction(
        anAction('scene-a', {
          id: 'fuite',
          elements: [
            { id: 'e1', type: 'change-scene', sceneId: 'scene-b' },
            { id: 'e2', type: 'change-scene', sceneId: 'scene-b' },
          ],
        }),
      );
      await repository.saveAction(anAction('scene-b', { id: 'texte' }));
      await repository.saveAction(
        anAction('autre', { elements: [{ id: 'e3', type: 'change-scene', sceneId: 'scene-a' }] }),
      );
      expect(await repository.listSceneLinks('p1')).toEqual([
        { actionId: 'fuite', sceneId: 'scene-a', targetIds: ['scene-b'] },
      ]);
    });

    it('ignore la suppression d’un son inconnu', async () => {
      await expect(repository.deleteSoundNode('inconnu')).resolves.toBeUndefined();
    });
  });
  describe('partie sauvegardée', () => {
    it('enregistre, remplace, relit et supprime la partie d’un projet', async () => {
      const session = aPlaySession('p1', 's1');
      session.scenes['s1'].playingSounds = [
        { soundId: 'son', elementId: null, paused: true, volume: 0.4 },
      ];
      session.scenes['s1'].feed = [
        { id: 'f1', type: 'user-click', actionId: 'a1', elementId: 'e1', validated: false },
      ];

      expect(await repository.getPlaySession('p1')).toBeUndefined();
      await repository.savePlaySession(session);
      expect(await repository.getPlaySession('p1')).toEqual(session);

      await repository.savePlaySession({ ...session, currentSceneId: 's2' });
      expect((await repository.getPlaySession('p1'))?.currentSceneId).toBe('s2');

      await repository.deletePlaySession('p1');
      expect(await repository.getPlaySession('p1')).toBeUndefined();
    });

    it('garde une partie distincte par projet', async () => {
      await repository.savePlaySession(aPlaySession('p1', 's1'));
      await repository.savePlaySession(aPlaySession('p2', 's9'));
      await repository.deletePlaySession('p1');
      expect((await repository.getPlaySession('p2'))?.currentSceneId).toBe('s9');
    });
  });
  describe('médias', () => {
    useNodeBlob();
    const objectUrls = stubObjectUrls();

    it('copie un fichier accepté en Blob dans le store media', async () => {
      const file = new File(['image'], 'carte.PNG', { type: 'image/png' });
      const id = await repository.uploadMedia(file);

      const media = await raw.get('media', id);
      expect(media).toMatchObject({
        id,
        mimeType: 'image/png',
        size: file.size,
        fileName: 'carte.PNG',
      });
      expect(media?.blob).toBeInstanceOf(Blob);
      expect(media?.blob.type).toBe('image/png');
    });

    it('enregistre les informations lues avant l’import (durée d’un son)', async () => {
      const id = await repository.uploadMedia(new File(['son'], 'pluie.ogg'), { durationMs: 1500 });
      expect((await raw.get('media', id))?.durationMs).toBe(1500);
    });

    it('renvoie les informations des médias sans leur contenu, en ignorant les absents', async () => {
      const sound = aMedia({ mimeType: 'audio/ogg', fileName: 'pluie.ogg', durationMs: 1500 });
      await raw.put('media', sound);
      const infos = await repository.getMediaInfo([sound.id, 'absent']);
      expect(infos).toEqual([
        {
          id: sound.id,
          mimeType: 'audio/ogg',
          size: sound.size,
          fileName: 'pluie.ogg',
          durationMs: 1500,
        },
      ]);
      expect(infos[0]).not.toHaveProperty('blob');
    });

    it('normalise le type à partir de l’extension', async () => {
      const id = await repository.uploadMedia(new File(['son'], 'orage.m4a', { type: '' }));
      expect((await raw.get('media', id))?.mimeType).toBe('audio/mp4');
    });

    it('refuse un format non pris en charge sans rien enregistrer', async () => {
      const upload = repository.uploadMedia(new File(['x'], 'notes.txt', { type: 'text/plain' }));
      await expect(upload).rejects.toSatisfy((e: unknown) =>
        isDataError(e, 'unsupported-media-type'),
      );
      expect(await raw.count('media')).toBe(0);
    });

    it('transforme un dépassement de quota en DataError quota-exceeded', async () => {
      const quota = new DOMException('Quota dépassé', 'QuotaExceededError');
      const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(() => {
        throw quota;
      });

      const upload = repository.uploadMedia(
        new File(['image'], 'carte.png', { type: 'image/png' }),
      );
      await expect(upload).rejects.toSatisfy(
        (e: unknown) =>
          isDataError(e, 'quota-exceeded') &&
          e.cause === quota &&
          e.messageKey === 'error.data.quota-exceeded',
      );
      spy.mockRestore();
      expect(await raw.count('media')).toBe(0);
    });

    it('laisse passer les autres erreurs telles quelles', async () => {
      const failure = new DOMException('Autre', 'UnknownError');
      const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(() => {
        throw failure;
      });
      await expect(
        repository.uploadMedia(new File(['x'], 'a.png', { type: 'image/png' })),
      ).rejects.toBe(failure);
      spy.mockRestore();
    });

    it('ne supprime un média que s’il n’est plus utilisé par une battlemap ou un son', async () => {
      const image = await repository.uploadMedia(
        new File(['image'], 'carte.png', { type: 'image/png' }),
      );
      const sound = await repository.uploadMedia(
        new File(['son'], 'pluie.mp3', { type: 'audio/mpeg' }),
      );
      const orphan = await repository.uploadMedia(
        new File(['image'], 'vieux.png', { type: 'image/png' }),
      );
      const battlemap = aBattlemap('s1', image);
      await repository.saveBattlemap(battlemap);
      await repository.saveSoundNodes([aSoundNode(GLOBAL_SOUND_LIBRARY, { mediaId: sound })]);

      await repository.deleteMedia(image);
      await repository.deleteMedia(sound);
      await repository.deleteMedia(orphan);
      expect(await raw.get('media', image)).toBeDefined();
      expect(await raw.get('media', sound)).toBeDefined();
      expect(await raw.get('media', orphan)).toBeUndefined();

      // Une fois la battlemap retirée, l'image peut être supprimée.
      await raw.delete('battlemaps', battlemap.id);
      await repository.deleteMedia(image);
      expect(await raw.get('media', image)).toBeUndefined();
    });

    it('fournit une URL blob: pour un média et une erreur media-not-found sinon', async () => {
      const id = await repository.uploadMedia(
        new File(['image'], 'carte.png', { type: 'image/png' }),
      );

      expect(await repository.getMediaUrl(id)).toBe('blob:test/1');
      expect(objectUrls.createObjectURL.mock.calls[0][0].type).toBe('image/png');
      await expect(repository.getMediaUrl('inconnu')).rejects.toSatisfy((e: unknown) =>
        isDataError(e, 'media-not-found'),
      );
    });

    it('ignore la suppression d’un média inconnu', async () => {
      await expect(repository.deleteMedia('inconnu')).resolves.toBeUndefined();
    });
  });

  it('retrouve les données après fermeture puis réouverture de la base (NF-10, 4.9)', async () => {
    const project = aProject({ name: 'Persistance' });
    const node = aSceneNode(project.id);
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    await repository.saveAction(anAction(node.id, { isSceneText: true, trigger: 'scene-open' }));
    await repository.close();

    // Nouvelle instance, comme après un rechargement du navigateur.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: INDEXED_DB_NAME, useValue: dbName }] });
    repository = TestBed.inject(IndexedDbRepository);

    expect((await repository.getProject(project.id))?.firstSceneId).toBe(node.id);
    expect(await repository.listSceneNodes(project.id)).toHaveLength(1);
    expect((await repository.listActions(node.id))[0]?.isSceneText).toBe(true);
  });
});
