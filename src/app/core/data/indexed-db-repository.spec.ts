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
  aSheet,
  aSheetNode,
  aSoundNode,
  anAction,
} from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { stubObjectUrls } from '../../../testing/object-url';
import { GLOBAL_LIBRARY, mediaKindOf } from '../models';
import { isDataError } from './data-error';
import { ProjectData } from './data-repository';
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
      const sheetNode = aSheetNode(project.id);
      const sheet = aSheet(project.id, sheetNode.id, { text: 'Garde' });
      const otherSheetNode = aSheetNode(other.id);
      const otherSheet = aSheet(other.id, otherSheetNode.id);

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
      for (const n of [sheetNode, otherSheetNode]) await raw.put('sheetNodes', n);
      for (const s of [sheet, otherSheet]) await raw.put('sheets', s);

      await repository.deleteProject(project.id);

      expect(await raw.get('projects', project.id)).toBeUndefined();
      expect(await raw.get('sceneNodes', node.id)).toBeUndefined();
      expect(await raw.get('scenes', scene.id)).toBeUndefined();
      expect(await raw.get('battlemaps', battlemap.id)).toBeUndefined();
      expect(await raw.get('actions', action.id)).toBeUndefined();
      expect(await raw.get('soundNodes', sound.id)).toBeUndefined();
      expect(await raw.get('playSessions', project.id)).toBeUndefined();
      expect(await raw.get('sheetNodes', sheetNode.id)).toBeUndefined();
      expect(await raw.get('sheets', sheet.id)).toBeUndefined();
      expect(await raw.get('media', ownMedia.id)).toBeUndefined();
      expect(await raw.get('media', soundMedia.id)).toBeUndefined();

      // Données des autres projets et de la bibliothèque globale conservées
      expect(await raw.get('projects', other.id)).toBeDefined();
      expect(await raw.get('scenes', otherScene.id)).toBeDefined();
      expect(await raw.get('battlemaps', otherBattlemap.id)).toBeDefined();
      expect(await raw.get('soundNodes', globalSound.id)).toBeDefined();
      expect(await raw.get('sheetNodes', otherSheetNode.id)).toBeDefined();
      expect(await raw.get('sheets', otherSheet.id)).toBeDefined();
      // Média encore utilisé par l'autre projet
      expect(await raw.get('media', sharedMedia.id)).toBeDefined();
    });

    describe("image d'illustration (5.3)", () => {
      it("enregistre l'image et met à jour la date de modification", async () => {
        const project = aProject({ updatedAt: '2026-01-01T00:00:00.000Z' });
        const image = aMedia();
        await raw.put('projects', project);
        await raw.put('media', image);

        await repository.setProjectImage(project.id, image.id);

        const saved = await repository.getProject(project.id);
        expect(saved?.imageMediaId).toBe(image.id);
        expect(saved!.updatedAt > project.updatedAt).toBe(true);
      });

      it("supprime l'ancienne image quand elle est remplacée ou retirée", async () => {
        const first = aMedia();
        const second = aMedia();
        const project = aProject({ imageMediaId: first.id });
        await raw.put('projects', project);
        await raw.put('media', first);
        await raw.put('media', second);

        await repository.setProjectImage(project.id, second.id);
        expect(await raw.get('media', first.id)).toBeUndefined();
        expect(await raw.get('media', second.id)).toBeDefined();

        await repository.setProjectImage(project.id, null);
        expect((await repository.getProject(project.id))?.imageMediaId).toBeNull();
        expect(await raw.get('media', second.id)).toBeUndefined();
      });

      it('garde une ancienne image encore utilisée par une battlemap', async () => {
        const shared = aMedia();
        const project = aProject({ imageMediaId: shared.id });
        await raw.put('projects', project);
        await raw.put('media', shared);
        await raw.put('battlemaps', aBattlemap('scene', shared.id));

        await repository.setProjectImage(project.id, null);

        expect(await raw.get('media', shared.id)).toBeDefined();
      });

      it('refuse un projet inconnu sans rien modifier', async () => {
        const image = aMedia();
        await raw.put('media', image);
        await expect(repository.setProjectImage('inconnu', image.id)).rejects.toSatisfy(
          (e: unknown) => isDataError(e) && e.code === 'project-not-found',
        );
        expect(await raw.get('projects', 'inconnu')).toBeUndefined();
      });

      it("ne supprime pas un média utilisé comme image d'un projet", async () => {
        const image = aMedia();
        await raw.put('projects', aProject({ imageMediaId: image.id }));
        await raw.put('media', image);

        await repository.deleteMedia(image.id);

        expect(await raw.get('media', image.id)).toBeDefined();
      });

      it("supprime l'image avec le projet", async () => {
        const image = aMedia();
        const project = aProject({ imageMediaId: image.id });
        await raw.put('projects', project);
        await raw.put('media', image);

        await repository.deleteProject(project.id);

        expect(await raw.get('media', image.id)).toBeUndefined();
      });
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

    it('liste les scènes d’un projet', async () => {
      await repository.saveScene(aScene('p1', 's1'));
      await repository.saveScene(aScene('p1', 's2'));
      await repository.saveScene(aScene('p2', 's3'));
      expect((await repository.listScenes('p1')).map((s) => s.id).sort()).toEqual(['s1', 's2']);
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
  describe('fiches (lot 15)', () => {
    it('liste les nœuds de fiches d’un projet triés par ordre et les enregistre en lot', async () => {
      const project = aProject();
      const b = aSheetNode(project.id, { name: 'Taverne', order: 1 });
      const a = aSheetNode(project.id, { name: 'Aubergiste', order: 0 });
      await repository.saveSheetNodes([b, a, aSheetNode('autre-projet')]);
      expect((await repository.listSheetNodes(project.id)).map((n) => n.name)).toEqual([
        'Aubergiste',
        'Taverne',
      ]);
    });

    it('enregistre, relit et liste les textes des fiches d’un projet', async () => {
      const sheet = aSheet('p1', 'f1', { text: '**Garde** du pont' });
      await repository.saveSheet(sheet);
      await repository.saveSheet(aSheet('p2', 'f2'));
      await repository.saveSheet({ ...sheet, text: 'Modifié' });

      expect(await repository.getSheet('f1')).toEqual({ ...sheet, text: 'Modifié' });
      expect(await repository.getSheet('inconnue')).toBeUndefined();
      expect((await repository.listSheets('p1')).map((s) => s.id)).toEqual(['f1']);
    });

    it('supprime un dossier de fiches avec ses descendants et leurs textes', async () => {
      const folder = aSheetNode('p1', { kind: 'folder', name: 'PNJ' });
      const sub = aSheetNode('p1', { kind: 'folder', parentId: folder.id });
      const inner = aSheetNode('p1', { parentId: sub.id });
      const kept = aSheetNode('p1');
      await repository.saveSheetNodes([folder, sub, inner, kept]);
      await repository.saveSheet(aSheet('p1', inner.id));
      await repository.saveSheet(aSheet('p1', kept.id));

      await repository.deleteSheetNode(folder.id);

      expect((await repository.listSheetNodes('p1')).map((n) => n.id)).toEqual([kept.id]);
      expect((await repository.listSheets('p1')).map((s) => s.id)).toEqual([kept.id]);
    });

    it('ne modifie pas les éléments « Afficher une fiche » qui visent une fiche supprimée', async () => {
      const node = aSheetNode('p1');
      await repository.saveSheetNodes([node]);
      const action = anAction('scene-a', {
        elements: [{ id: 'e1', type: 'show-sheet', sheetId: node.id }],
      });
      await repository.saveAction(action);

      await repository.deleteSheetNode(node.id);

      expect(await raw.get('actions', action.id)).toEqual(action);
    });

    it('ignore la suppression d’une fiche inconnue', async () => {
      await expect(repository.deleteSheetNode('inconnue')).resolves.toBeUndefined();
    });

    it('compte les actions du projet qui affichent chaque fiche', async () => {
      await repository.saveSceneNodes([
        aSceneNode('p1', { id: 'scene-a' }),
        aSceneNode('p1', { id: 'scene-b' }),
        aSceneNode('p2', { id: 'autre' }),
      ]);
      const show = (sheetId: string) => ({
        id: crypto.randomUUID(),
        type: 'show-sheet' as const,
        sheetId,
      });
      await repository.saveAction(
        anAction('scene-a', { elements: [show('garde'), show('garde'), show('pont')] }),
      );
      await repository.saveAction(anAction('scene-b', { elements: [show('garde')] }));
      await repository.saveAction(anAction('autre', { elements: [show('garde')] }));

      expect(await repository.countSheetUsages('p1')).toEqual({ garde: 2, pont: 1 });
    });
  });

  describe('bibliothèques (sons et vidéos)', () => {
    it('sépare la bibliothèque globale de celles des projets et trie par ordre', async () => {
      const project = aProject();
      await repository.saveLibraryNodes([
        aSoundNode(GLOBAL_LIBRARY, { name: 'Pluie', order: 1 }),
        aSoundNode(GLOBAL_LIBRARY, { name: 'Orage', order: 0 }),
        aSoundNode(project.id, { name: 'Thème du méchant' }),
      ]);
      expect((await repository.listLibraryNodes(GLOBAL_LIBRARY)).map((n) => n.name)).toEqual([
        'Orage',
        'Pluie',
      ]);
      expect((await repository.listLibraryNodes(project.id)).map((n) => n.name)).toEqual([
        'Thème du méchant',
      ]);
    });

    it('supprime un dossier de sons avec ses descendants et les fichiers devenus inutilisés', async () => {
      const used = aMedia({ mimeType: 'audio/mpeg' });
      const shared = aMedia({ mimeType: 'audio/mpeg' });
      const folder = aSoundNode(GLOBAL_LIBRARY, { kind: 'folder', name: 'Ambiances' });
      const rain = aSoundNode(GLOBAL_LIBRARY, { parentId: folder.id, mediaId: used.id });
      const wind = aSoundNode(GLOBAL_LIBRARY, { parentId: folder.id, mediaId: shared.id });
      const kept = aSoundNode(GLOBAL_LIBRARY, { mediaId: shared.id });
      await raw.put('media', used);
      await raw.put('media', shared);
      await repository.saveLibraryNodes([folder, rain, wind, kept]);

      await repository.deleteLibraryNode(folder.id);

      expect((await repository.listLibraryNodes(GLOBAL_LIBRARY)).map((n) => n.id)).toEqual([
        kept.id,
      ]);
      expect(await raw.get('media', used.id)).toBeUndefined();
      expect(await raw.get('media', shared.id)).toBeDefined();
    });

    it('compte les actions qui lancent ou arrêtent chaque son, tous projets confondus', async () => {
      const rain = aSoundNode(GLOBAL_LIBRARY);
      const wind = aSoundNode(GLOBAL_LIBRARY);
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

      expect(await repository.countLibraryUsages()).toEqual({ [rain.id]: 2, [wind.id]: 1 });
    });

    it('compte aussi les actions qui lancent chaque vidéo (VID-05)', async () => {
      const intro = aSoundNode(GLOBAL_LIBRARY, { mediaKind: 'video' });
      const playVideo = (videoId: string) => ({
        id: crypto.randomUUID(),
        type: 'play-video' as const,
        videoId,
        volume: 1,
      });
      await repository.saveAction(
        anAction('scene-a', {
          elements: [playVideo(intro.id), { id: 'y', type: 'stop-video' }, playVideo(intro.id)],
        }),
      );
      await repository.saveAction(anAction('scene-b', { elements: [playVideo(intro.id)] }));

      expect(await repository.countLibraryUsages()).toEqual({ [intro.id]: 2 });
    });

    it('enregistre la nature du fichier (son ou vidéo) avec le nœud', async () => {
      const video = aSoundNode(GLOBAL_LIBRARY, { name: 'Intro', mediaKind: 'video' });
      const legacy = aSoundNode(GLOBAL_LIBRARY, { name: 'Pluie', order: 1 });
      await repository.saveLibraryNodes([video, legacy]);
      const [savedVideo, savedLegacy] = await repository.listLibraryNodes(GLOBAL_LIBRARY);
      expect(mediaKindOf(savedVideo)).toBe('video');
      expect(savedLegacy.mediaKind).toBeUndefined();
      expect(mediaKindOf(savedLegacy)).toBe('sound');
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
      await expect(repository.deleteLibraryNode('inconnu')).resolves.toBeUndefined();
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

    it('importe une vidéo MP4 ou WebM avec sa durée (VID-01)', async () => {
      const mp4 = await repository.uploadMedia(
        new File(['vidéo'], 'intro.mp4', { type: 'video/mp4' }),
        { durationMs: 90_000 },
      );
      const webm = await repository.uploadMedia(new File(['vidéo'], 'boucle.webm', { type: '' }));
      expect(await raw.get('media', mp4)).toMatchObject({
        mimeType: 'video/mp4',
        durationMs: 90_000,
      });
      expect((await raw.get('media', webm))?.mimeType).toBe('video/webm');
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
      await repository.saveLibraryNodes([aSoundNode(GLOBAL_LIBRARY, { mediaId: sound })]);

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

    it('renvoie le contenu d’un média, ou une erreur media-not-found (export, lot 16)', async () => {
      const id = await repository.uploadMedia(
        new File(['image'], 'carte.png', { type: 'image/png' }),
      );
      const blob = await repository.getMediaBlob(id);
      expect(blob.type).toBe('image/png');
      expect(await blob.text()).toBe('image');
      await expect(repository.getMediaBlob('inconnu')).rejects.toSatisfy((e: unknown) =>
        isDataError(e, 'media-not-found'),
      );
    });

    it('importe un média sous l’identifiant donné, avec sa durée', async () => {
      const imported = await repository.importMedia(
        'video-1',
        new File(['vidéo'], 'intro.mp4', { type: '' }),
        { durationMs: 90_000 },
      );
      expect(imported).toBe(true);
      expect(await raw.get('media', 'video-1')).toMatchObject({
        id: 'video-1',
        mimeType: 'video/mp4',
        fileName: 'intro.mp4',
        durationMs: 90_000,
      });
    });

    it('ne réimporte pas un média déjà présent (un média ne change jamais)', async () => {
      await repository.importMedia('m1', new File(['avant'], 'a.png', { type: 'image/png' }));
      const imported = await repository.importMedia(
        'm1',
        new File(['après'], 'b.png', { type: 'image/png' }),
      );
      expect(imported).toBe(false);
      expect(await (await repository.getMediaBlob('m1')).text()).toBe('avant');
      expect((await raw.get('media', 'm1'))?.fileName).toBe('a.png');
    });

    it('n’écrit qu’une fois un média importé deux fois en même temps', async () => {
      const file = new File(['image'], 'a.png', { type: 'image/png' });
      const results = await Promise.all([
        repository.importMedia('m1', file),
        repository.importMedia('m1', file),
      ]);
      expect(results.sort()).toEqual([false, true]);
      expect(await raw.count('media')).toBe(1);
    });

    it('refuse à l’import un format non pris en charge, sans rien enregistrer', async () => {
      const upload = repository.importMedia(
        'm1',
        new File(['x'], 'notes.txt', { type: 'text/plain' }),
      );
      await expect(upload).rejects.toSatisfy((e: unknown) =>
        isDataError(e, 'unsupported-media-type'),
      );
      expect(await raw.count('media')).toBe(0);
    });

    it('signale un quota dépassé à l’import d’un média', async () => {
      const quota = new DOMException('Quota dépassé', 'QuotaExceededError');
      const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(() => {
        throw quota;
      });
      const upload = repository.importMedia(
        'm1',
        new File(['image'], 'carte.png', { type: 'image/png' }),
      );
      await expect(upload).rejects.toSatisfy((e: unknown) => isDataError(e, 'quota-exceeded'));
      spy.mockRestore();
      expect(await raw.count('media')).toBe(0);
    });

    it('liste les médias référencés mais absents (battlemaps, sons et vidéos)', async () => {
      const present = aMedia();
      await raw.put('media', present);
      await repository.saveBattlemap(aBattlemap('s1', present.id));
      await repository.saveBattlemap(aBattlemap('s1', 'image-absente'));
      await repository.saveLibraryNodes([
        aSoundNode('p1', { mediaId: 'video-absente', mediaKind: 'video' }),
        aSoundNode(GLOBAL_LIBRARY, { mediaId: present.id }),
        aSoundNode('p1', { kind: 'folder', name: 'Dossier' }),
      ]);
      expect((await repository.listMissingMedia()).sort()).toEqual([
        'image-absente',
        'video-absente',
      ]);
    });
  });

  describe('import d’un projet (lot 16)', () => {
    /** Projet complet, tous les objets avec des identifiants fixes. */
    function projectData(): ProjectData {
      const project = aProject({ id: 'p1', name: 'La crypte', firstSceneId: 's1' });
      return {
        project,
        sceneNodes: [aSceneNode('p1', { id: 's1' })],
        scenes: [aScene('p1', 's1')],
        battlemaps: [aBattlemap('s1', 'm-image', { id: 'b1' })],
        actions: [anAction('s1', { id: 'a1' })],
        sheetNodes: [aSheetNode('p1', { id: 'f1' })],
        sheets: [aSheet('p1', 'f1', { text: 'Le gardien' })],
        libraryNodes: [
          aSoundNode('p1', { id: 'dossier', kind: 'folder', name: 'Ambiances' }),
          aSoundNode('p1', { id: 'son', parentId: 'dossier', mediaId: 'm-son' }),
        ],
      };
    }

    it("garde l'image locale du projet si l'export n'en parle pas (5.3)", async () => {
      await raw.put('projects', aProject({ id: 'p1', imageMediaId: 'm-locale' }));
      await repository.importProjectData(projectData());
      expect((await repository.getProject('p1'))?.imageMediaId).toBe('m-locale');
    });

    it("remplace l'image locale du projet et la supprime si plus rien ne l'utilise (5.3)", async () => {
      const local = aMedia({ id: 'm-locale' });
      await raw.put('media', local);
      await raw.put('projects', aProject({ id: 'p1', imageMediaId: local.id }));
      const data = projectData();

      await repository.importProjectData({
        ...data,
        project: { ...data.project, imageMediaId: 'm-export' },
      });

      expect((await repository.getProject('p1'))?.imageMediaId).toBe('m-export');
      expect(await raw.get('media', local.id)).toBeUndefined();
    });

    it('écrit tous les objets avec leurs identifiants', async () => {
      const data = projectData();
      await repository.importProjectData(data);

      expect(await repository.getProject('p1')).toEqual(data.project);
      expect(await repository.listSceneNodes('p1')).toEqual(data.sceneNodes);
      expect(await repository.listScenes('p1')).toEqual(data.scenes);
      expect(await repository.listBattlemaps('s1')).toEqual(data.battlemaps);
      expect(await repository.listActions('s1')).toEqual(data.actions);
      expect(await repository.listSheetNodes('p1')).toEqual(data.sheetNodes);
      expect(await repository.listSheets('p1')).toEqual(data.sheets);
      expect(await repository.listLibraryNodes('p1')).toEqual(data.libraryNodes);
    });

    it('remplace les objets de même identifiant et conserve les objets locaux absents', async () => {
      await repository.importProjectData(projectData());
      const local = aSceneNode('p1', { id: 's-local', name: 'Ajoutée sur ce PC' });
      await repository.saveSceneNodes([local]);
      await repository.savePlaySession(aPlaySession('p1', 's1'));

      const data = projectData();
      data.project.name = 'La crypte (v2)';
      data.sheets[0].text = 'Le gardien dort';
      await repository.importProjectData(data);

      expect((await repository.getProject('p1'))?.name).toBe('La crypte (v2)');
      expect((await repository.getSheet('f1'))?.text).toBe('Le gardien dort');
      expect((await repository.listSceneNodes('p1')).map((n) => n.id).sort()).toEqual([
        's-local',
        's1',
      ]);
      expect(await repository.getPlaySession('p1')).toBeDefined();
    });

    it('laisse dans sa bibliothèque un nœud qui existe déjà ailleurs (bibliothèque globale)', async () => {
      const global = aSoundNode(GLOBAL_LIBRARY, { id: 'pluie', name: 'Pluie', mediaId: 'm-pluie' });
      await repository.saveLibraryNodes([global]);

      const data = projectData();
      data.libraryNodes.push({ ...global, libraryId: 'p1', name: 'Pluie (copie)' });
      await repository.importProjectData(data);

      expect(await repository.listLibraryNodes(GLOBAL_LIBRARY)).toEqual([global]);
      expect((await repository.listLibraryNodes('p1')).map((n) => n.id)).not.toContain('pluie');
    });

    it('rattache à la racine un nœud dont le dossier est resté dans une autre bibliothèque', async () => {
      const folder = aSoundNode(GLOBAL_LIBRARY, { id: 'g-dossier', kind: 'folder' });
      await repository.saveLibraryNodes([folder]);

      const data = projectData();
      data.libraryNodes.push(
        { ...folder, libraryId: 'p1' },
        aSoundNode('p1', { id: 'orage', parentId: 'g-dossier', mediaId: 'm-orage' }),
        aSoundNode('p1', { id: 'perdu', parentId: 'inconnu', mediaId: 'm-perdu' }),
      );
      await repository.importProjectData(data);

      const nodes = await repository.listLibraryNodes('p1');
      expect(nodes.find((n) => n.id === 'orage')?.parentId).toBeNull();
      expect(nodes.find((n) => n.id === 'perdu')?.parentId).toBeNull();
      expect(nodes.find((n) => n.id === 'son')?.parentId).toBe('dossier');
    });

    it('n’écrit rien si une écriture échoue (une seule transaction)', async () => {
      const failure = new DOMException('Échec', 'UnknownError');
      const original = IDBObjectStore.prototype.put;
      const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
        this: IDBObjectStore,
        ...args
      ) {
        if (this.name === 'sheets') {
          throw failure;
        }
        return original.apply(this, args);
      });

      await expect(repository.importProjectData(projectData())).rejects.toBe(failure);
      spy.mockRestore();
      expect(await repository.getProject('p1')).toBeUndefined();
      expect(await repository.listSceneNodes('p1')).toEqual([]);
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
