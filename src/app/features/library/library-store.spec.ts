import { TestBed } from '@angular/core/testing';

import { aSoundNode, anAction } from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { LibraryNode } from '../../core/models';
import { MediaDuration } from '../../core/media/media-duration';
import { LibraryStore, soundName } from './library-store';

const fakeDuration = (file: File) => (file.name.startsWith('vent') ? null : 90_000);

describe('LibraryStore', () => {
  useNodeBlob();
  let store: LibraryStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LibraryStore,
        ...useTestRepository(),
        // jsdom ne lit pas l'audio : durée simulée d'après le nom du fichier.
        {
          provide: MediaDuration,
          useValue: { read: (file: File) => Promise.resolve(fakeDuration(file)) },
        },
      ],
    });
    store = TestBed.inject(LibraryStore);
  });

  const repository = () => TestBed.inject(DATA_REPOSITORY);
  const names = (nodes: readonly LibraryNode[]) => nodes.map((n) => n.name);

  it('charge la bibliothèque du projet puis la globale ; dossiers et sons dans les arborescences', async () => {
    await repository().saveLibraryNodes([
      aSoundNode('p1', { kind: 'folder', name: 'Ambiances' }),
      aSoundNode('p1', { name: 'Taverne', order: 1 }),
      aSoundNode('global', { kind: 'folder', name: 'Météo' }),
    ]);
    await store.load('p1');
    expect(store.trees().map((t) => [t.libraryId, t.isGlobal, names(t.nodes)])).toEqual([
      ['p1', false, ['Ambiances', 'Taverne']],
      ['global', true, ['Météo']],
    ]);
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: null });

    await store.load();
    expect(store.libraries()).toEqual(['global']);
    expect(store.opened()).toEqual({ libraryId: 'global', folderId: null });
  });

  it('crée un dossier en dernière position, l’ouvre et l’enregistre', async () => {
    await repository().saveLibraryNodes([
      aSoundNode('p1', { kind: 'folder', name: 'A', order: 4 }),
    ]);
    await store.load('p1');
    const folder = await store.createFolder('p1', null, 'Nouveau dossier');
    expect(folder).toMatchObject({ libraryId: 'p1', parentId: null, order: 5, kind: 'folder' });
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: folder.id });
    expect(names(await repository().listLibraryNodes('p1'))).toEqual(['A', 'Nouveau dossier']);
  });

  it('renomme un dossier', async () => {
    const folder = aSoundNode('global', { kind: 'folder', name: 'Météo' });
    await repository().saveLibraryNodes([folder]);
    await store.load();
    await store.rename('global', folder.id, 'Climat');
    expect(names(store.nodesOf('global'))).toEqual(['Climat']);
    expect(names(await repository().listLibraryNodes('global'))).toEqual(['Climat']);
  });

  it('supprime un dossier et son contenu ; le dossier ouvert supprimé ramène à la racine', async () => {
    const parent = aSoundNode('p1', { kind: 'folder', name: 'Effets' });
    const child = aSoundNode('p1', { kind: 'folder', name: 'Portes', parentId: parent.id });
    const sound = aSoundNode('p1', { name: 'Grincement', parentId: child.id });
    await repository().saveLibraryNodes([parent, child, sound]);
    await store.load('p1');
    store.open('p1', child.id);

    await store.remove('p1', parent.id);
    expect(store.nodesOf('p1')).toEqual([]);
    expect(await repository().listLibraryNodes('p1')).toEqual([]);
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: null });
  });

  it('déplace un dossier ou un son parmi tous les nœuds du dossier cible', async () => {
    const a = aSoundNode('p1', { kind: 'folder', name: 'A', order: 0 });
    const sound = aSoundNode('p1', { name: 'Son', order: 1 });
    const b = aSoundNode('p1', { kind: 'folder', name: 'B', order: 2 });
    await repository().saveLibraryNodes([a, sound, b]);
    await store.load('p1');

    await store.move('p1', { id: b.id, parentId: null, order: 0 });
    expect(names(store.nodesOf('p1'))).toEqual(['B', 'A', 'Son']);
    const saved = await repository().listLibraryNodes('p1');
    expect(saved.find((n) => n.id === sound.id)?.order).toBe(2);

    await store.move('p1', { id: sound.id, parentId: a.id, order: 0 });
    expect(store.nodesOf('p1').find((n) => n.id === sound.id)?.parentId).toBe(a.id);
    store.open('p1', a.id);
    expect(store.rows().map((r) => r.node.name)).toEqual(['Son']);
  });

  it('choisir un son dans l’arborescence ouvre son dossier et le met en évidence', async () => {
    const folder = aSoundNode('p1', { kind: 'folder', name: 'Ambiances' });
    const sound = aSoundNode('p1', { name: 'Taverne', parentId: folder.id });
    await repository().saveLibraryNodes([folder, sound]);
    await store.load('p1');

    store.select('p1', sound.id);
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: folder.id });
    expect(store.selectedSoundId()).toBe(sound.id);
    expect(store.selectedIn('p1')).toBe(sound.id);
    expect(store.selectedIn('global')).toBeNull();

    store.select('p1', folder.id);
    expect(store.selectedSoundId()).toBeNull();
    expect(store.selectedIn('p1')).toBe(folder.id);

    store.select('p1', sound.id);
    await store.remove('p1', sound.id);
    expect(store.selectedSoundId()).toBeNull();
  });

  it('liste les sons du dossier ouvert avec leur fichier et leurs utilisations (6.3)', async () => {
    const folder = aSoundNode('p1', { kind: 'folder', name: 'Ambiances' });
    const rainFile = new File(['pluie'], 'pluie.ogg');
    const mediaId = await repository().uploadMedia(rainFile, { durationMs: 760_000 });
    const rain = aSoundNode('p1', { name: 'Pluie', parentId: folder.id, mediaId, order: 1 });
    const wind = aSoundNode('p1', {
      name: 'Vent',
      parentId: folder.id,
      mediaId: 'absent',
      order: 0,
    });
    const root = aSoundNode('p1', { name: 'À la racine' });
    await repository().saveLibraryNodes([folder, rain, wind, root]);
    await repository().saveAction(
      anAction('s1', {
        elements: [{ id: 'e', type: 'stop-sound', soundId: rain.id }],
      }),
    );
    await store.load('p1');
    expect(store.rows().map((r) => r.node.name)).toEqual(['À la racine']);

    store.open('p1', folder.id);
    expect(
      store
        .rows()
        .map((r) => [r.node.name, r.media?.mimeType ?? null, r.media?.durationMs, r.usages]),
    ).toEqual([
      ['Vent', null, undefined, 0],
      ['Pluie', 'audio/ogg', 760_000, 1],
    ]);
  });

  it('recherche les sons par nom dans toutes les bibliothèques affichées, sans accents (6.4)', async () => {
    const folder = aSoundNode('p1', { kind: 'folder', name: 'Ambiances' });
    await repository().saveLibraryNodes([
      folder,
      aSoundNode('p1', { name: 'Forêt de nuit', parentId: folder.id }),
      aSoundNode('global', { name: 'Foret pluvieuse' }),
      aSoundNode('global', { kind: 'folder', name: 'Forêts' }),
      aSoundNode('global', { name: 'Orage', order: 2 }),
    ]);
    await store.load('p1');
    store.query.set('  FORET ');
    expect(store.searching()).toBe(true);
    expect(store.rows().map((r) => [r.node.name, r.libraryId, r.folders])).toEqual([
      ['Forêt de nuit', 'p1', ['Ambiances']],
      ['Foret pluvieuse', 'global', []],
    ]);

    store.open('global', null);
    expect(store.query()).toBe('');
    expect(store.rows().map((r) => r.node.name)).toEqual(['Foret pluvieuse', 'Orage']);
  });

  it('importe les sons dans le dossier ouvert, à la suite, et refuse les autres formats (6.5)', async () => {
    const folder = aSoundNode('p1', { kind: 'folder', name: 'Ambiances' });
    const existing = aSoundNode('p1', { name: 'Ancien', parentId: folder.id, order: 3 });
    await repository().saveLibraryNodes([folder, existing]);
    await store.load('p1');
    store.open('p1', folder.id);

    const result = await store.importFiles([
      new File(['a'], 'Taverne animée.ogg', { type: 'audio/ogg' }),
      new File(['b'], 'notes.txt', { type: 'text/plain' }),
      new File(['c'], 'carte.png', { type: 'image/png' }),
      new File(['d'], 'vent.WAV', { type: '' }),
    ]);

    expect(result.rejected.map((f) => f.name)).toEqual(['notes.txt', 'carte.png']);
    expect(result.imported.map((n) => [n.name, n.order, n.parentId])).toEqual([
      ['Taverne animée', 4, folder.id],
      ['vent', 5, folder.id],
    ]);
    expect(store.rows().map((r) => [r.node.name, r.media?.mimeType, r.media?.durationMs])).toEqual([
      ['Ancien', undefined, undefined],
      ['Taverne animée', 'audio/ogg', 90_000],
      ['vent', 'audio/wav', undefined],
    ]);
    expect(
      (await repository().listLibraryNodes('p1')).filter((n) => n.kind === 'item'),
    ).toHaveLength(3);
    expect(store.importing()).toBe(false);
  });

  describe('éléments sans fichier (VID-13)', () => {
    async function loadWithoutFile() {
      await repository().importMedia('m-taverne', new File(['son'], 'taverne.mp3'));
      await repository().saveLibraryNodes([
        aSoundNode('p1', { id: 'taverne', name: 'Taverne', mediaId: 'm-taverne' }),
        aSoundNode('p1', { id: 'intro', name: 'Intro', mediaId: 'm-intro', mediaKind: 'video' }),
        aSoundNode('global', { id: 'orage', name: 'Orage', mediaId: 'm-orage' }),
      ]);
      await store.load('p1');
    }

    it('liste les sons et vidéos sans fichier de toutes les bibliothèques affichées', async () => {
      await loadWithoutFile();
      expect(names(store.withoutFile())).toEqual(['Intro', 'Orage']);
      expect(store.rows().find((r) => r.node.id === 'intro')?.media).toBeNull();
    });

    it('importe le fichier sous l’identifiant de média prévu, avec sa durée', async () => {
      await loadWithoutFile();
      const intro = store.nodesOf('p1').find((n) => n.id === 'intro')!;
      const result = await store.importMissingFile(
        intro,
        new File(['vidéo'], 'intro.mp4', { type: 'video/mp4' }),
      );
      expect(result).toBe('imported');
      expect(names(store.withoutFile())).toEqual(['Orage']);
      expect(store.rows().find((r) => r.node.id === 'intro')?.media).toMatchObject({
        id: 'm-intro',
        mimeType: 'video/mp4',
        durationMs: 90_000,
      });
      // Le nœud n'a pas changé : les actions qui le lancent liront ce fichier.
      expect((await repository().listLibraryNodes('p1')).find((n) => n.id === 'intro')).toEqual(
        intro,
      );
    });

    it('refuse un fichier d’une autre nature ou d’un format refusé, sans rien enregistrer', async () => {
      await loadWithoutFile();
      const intro = store.nodesOf('p1').find((n) => n.id === 'intro')!;
      expect(
        await store.importMissingFile(
          intro,
          new File(['son'], 'pluie.mp3', { type: 'audio/mpeg' }),
        ),
      ).toBe('wrong-kind');
      expect(
        await store.importMissingFile(intro, new File(['x'], 'notes.txt', { type: 'text/plain' })),
      ).toBe('wrong-kind');
      expect(await repository().getMediaInfo(['m-intro'])).toEqual([]);
    });
  });

  it('importe aussi les vidéos, avec leur nature, et donne l’avancement (VID-01, TEC-36)', async () => {
    await store.load('p1');
    const progress: unknown[] = [];
    vi.spyOn(TestBed.inject(MediaDuration), 'read').mockImplementation(async () => {
      progress.push(store.importProgress());
      return 90_000;
    });

    const result = await store.importFiles([
      new File(['a'], 'Intro.mp4', { type: 'video/mp4' }),
      new File(['b'], 'pluie.ogg', { type: 'audio/ogg' }),
      new File(['c'], 'boucle.webm', { type: '' }),
    ]);

    expect(result.imported.map((n) => [n.name, n.mediaKind])).toEqual([
      ['Intro', 'video'],
      ['pluie', 'sound'],
      ['boucle', 'video'],
    ]);
    expect(progress).toEqual([
      { current: 1, total: 3 },
      { current: 2, total: 3 },
      { current: 3, total: 3 },
    ]);
    expect(store.importProgress()).toBeNull();
    expect((await repository().listLibraryNodes('p1')).map((n) => n.mediaKind).sort()).toEqual([
      'sound',
      'video',
      'video',
    ]);
  });

  it('pendant un import, un fichier déjà importé a ses infos (pas « Fichier introuvable »)', async () => {
    await store.load('p1');
    const rowsDuringSecond: unknown[] = [];
    vi.spyOn(TestBed.inject(MediaDuration), 'read').mockImplementation(async (file) => {
      if ((file as File).name === 'b.mp3') {
        rowsDuringSecond.push(...store.rows().map((row) => [row.node.name, row.media?.size]));
      }
      return 90_000;
    });
    await store.importFiles([
      new File(['aa'], 'a.mp3', { type: 'audio/mpeg' }),
      new File(['b'], 'b.mp3', { type: 'audio/mpeg' }),
    ]);
    expect(rowsDuringSecond).toEqual([['a', 2]]);
  });

  it('filtre le tableau par type, y compris la recherche ; choisir un élément masqué retire le filtre (VID-02)', async () => {
    const intro = aSoundNode('global', { name: 'Intro pluie', mediaKind: 'video' });
    const rain = aSoundNode('global', { name: 'Pluie', order: 1 });
    await repository().saveLibraryNodes([intro, rain]);
    await store.load(undefined);
    expect(store.rows().map((r) => [r.node.name, r.kind])).toEqual([
      ['Intro pluie', 'video'],
      ['Pluie', 'sound'],
    ]);

    store.kindFilter.set('sound');
    expect(names(store.rows().map((r) => r.node))).toEqual(['Pluie']);
    store.query.set('pluie');
    expect(names(store.rows().map((r) => r.node))).toEqual(['Pluie']);
    store.kindFilter.set('video');
    expect(names(store.rows().map((r) => r.node))).toEqual(['Intro pluie']);

    store.kindFilter.set('sound');
    store.select('global', intro.id);
    expect(store.kindFilter()).toBe('all');
    expect(store.selectedSoundId()).toBe(intro.id);
  });

  it('nomme un son d’après son fichier, sans l’extension', () => {
    expect(soundName('Forêt de nuit.mp3')).toBe('Forêt de nuit');
    expect(soundName('archive.tar.ogg')).toBe('archive.tar');
    expect(soundName('.ogg')).toBe('.ogg');
    expect(soundName('sans-extension')).toBe('sans-extension');
  });

  it('arrête l’import sur une erreur de stockage et garde les sons déjà importés', async () => {
    await store.load('p1');
    const quota = new Error('quota');
    const upload = repository().uploadMedia.bind(repository());
    vi.spyOn(repository(), 'uploadMedia')
      .mockImplementationOnce(upload)
      .mockRejectedValueOnce(quota);

    const result = await store.importFiles([
      new File(['a'], 'un.ogg'),
      new File(['b'], 'deux.ogg'),
      new File(['c'], 'trois.ogg'),
    ]);
    expect(result.imported.map((n) => n.name)).toEqual(['un']);
    expect(result.failure).toBe(quota);
    expect(store.rows().map((r) => r.node.name)).toEqual(['un']);
    expect(store.importing()).toBe(false);
  });

  it('compte les sons d’un dossier et ceux qui sont utilisés', async () => {
    const folder = aSoundNode('p1', { kind: 'folder', name: 'Effets' });
    const sub = aSoundNode('p1', { kind: 'folder', name: 'Portes', parentId: folder.id });
    const used = aSoundNode('p1', { name: 'Grincement', parentId: sub.id });
    await repository().saveLibraryNodes([
      folder,
      sub,
      used,
      aSoundNode('p1', { name: 'Cloche', parentId: folder.id }),
      aSoundNode('p1', { name: 'Ailleurs' }),
    ]);
    await repository().saveAction(
      anAction('s1', { elements: [{ id: 'e', type: 'stop-sound', soundId: used.id }] }),
    );
    await store.load('p1');
    expect(store.folderUsage('p1', folder.id)).toEqual({ sounds: 2, used: 1 });
    expect(store.folderUsage('p1', sub.id)).toEqual({ sounds: 1, used: 1 });
  });
});
