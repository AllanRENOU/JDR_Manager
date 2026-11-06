import { TestBed } from '@angular/core/testing';

import { aSoundNode } from '../../../testing/data-builders';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { SoundNode } from '../../core/models';
import { SoundLibraryStore } from './sound-library-store';

describe('SoundLibraryStore', () => {
  let store: SoundLibraryStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SoundLibraryStore, ...useTestRepository()] });
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
});
