import { TestBed } from '@angular/core/testing';

import { aSoundNode, anAction } from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { SoundNode } from '../../core/models';
import { AudioDuration } from '../../core/media/audio-duration';
import { SoundLibraryStore, soundName } from './sound-library-store';

const fakeDuration = (file: File) => (file.name.startsWith('vent') ? null : 90_000);

describe('SoundLibraryStore', () => {
  useNodeBlob();
  let store: SoundLibraryStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SoundLibraryStore,
        ...useTestRepository(),
        // jsdom ne lit pas l'audio : durée simulée d'après le nom du fichier.
        {
          provide: AudioDuration,
          useValue: { read: (file: File) => Promise.resolve(fakeDuration(file)) },
        },
      ],
    });
    store = TestBed.inject(SoundLibraryStore);
  });

  const repository = () => TestBed.inject(DATA_REPOSITORY);
  const names = (nodes: readonly SoundNode[]) => nodes.map((n) => n.name);

  it('charge la bibliothèque du projet puis la globale ; dossiers seuls dans les arborescences', async () => {
    await repository().saveSoundNodes([
      aSoundNode('p1', { kind: 'folder', name: 'Ambiances' }),
      aSoundNode('p1', { name: 'Taverne' }),
      aSoundNode('global', { kind: 'folder', name: 'Météo' }),
    ]);
    await store.load('p1');
    expect(store.trees().map((t) => [t.libraryId, t.isGlobal, names(t.folders)])).toEqual([
      ['p1', false, ['Ambiances']],
      ['global', true, ['Météo']],
    ]);
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: null });

    await store.load();
    expect(store.libraries()).toEqual(['global']);
    expect(store.opened()).toEqual({ libraryId: 'global', folderId: null });
  });

  it('crée un dossier en dernière position, l’ouvre et l’enregistre', async () => {
    await repository().saveSoundNodes([aSoundNode('p1', { kind: 'folder', name: 'A', order: 4 })]);
    await store.load('p1');
    const folder = await store.createFolder('p1', null, 'Nouveau dossier');
    expect(folder).toMatchObject({ libraryId: 'p1', parentId: null, order: 5, kind: 'folder' });
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: folder.id });
    expect(names(await repository().listSoundNodes('p1'))).toEqual(['A', 'Nouveau dossier']);
  });

  it('renomme un dossier', async () => {
    const folder = aSoundNode('global', { kind: 'folder', name: 'Météo' });
    await repository().saveSoundNodes([folder]);
    await store.load();
    await store.rename('global', folder.id, 'Climat');
    expect(names(store.foldersOf('global'))).toEqual(['Climat']);
    expect(names(await repository().listSoundNodes('global'))).toEqual(['Climat']);
  });

  it('supprime un dossier et son contenu ; le dossier ouvert supprimé ramène à la racine', async () => {
    const parent = aSoundNode('p1', { kind: 'folder', name: 'Effets' });
    const child = aSoundNode('p1', { kind: 'folder', name: 'Portes', parentId: parent.id });
    const sound = aSoundNode('p1', { name: 'Grincement', parentId: child.id });
    await repository().saveSoundNodes([parent, child, sound]);
    await store.load('p1');
    store.open('p1', child.id);

    await store.remove('p1', parent.id);
    expect(store.nodesOf('p1')).toEqual([]);
    expect(await repository().listSoundNodes('p1')).toEqual([]);
    expect(store.opened()).toEqual({ libraryId: 'p1', folderId: null });
  });

  it('déplace un dossier en ne renumérotant que les dossiers', async () => {
    const a = aSoundNode('p1', { kind: 'folder', name: 'A', order: 0 });
    const sound = aSoundNode('p1', { name: 'Son', order: 1 });
    const b = aSoundNode('p1', { kind: 'folder', name: 'B', order: 2 });
    await repository().saveSoundNodes([a, sound, b]);
    await store.load('p1');

    await store.move('p1', { id: b.id, parentId: null, order: 0 });
    expect(names(store.foldersOf('p1'))).toEqual(['B', 'A']);
    const saved = await repository().listSoundNodes('p1');
    expect(saved.find((n) => n.id === sound.id)?.order).toBe(1);

    await store.move('p1', { id: a.id, parentId: b.id, order: 0 });
    expect(store.foldersOf('p1').find((n) => n.id === a.id)?.parentId).toBe(b.id);
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
    await repository().saveSoundNodes([folder, rain, wind, root]);
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
    await repository().saveSoundNodes([
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
    await repository().saveSoundNodes([folder, existing]);
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
    expect((await repository().listSoundNodes('p1')).filter((n) => n.kind === 'item')).toHaveLength(
      3,
    );
    expect(store.importing()).toBe(false);
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
    await repository().saveSoundNodes([
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
