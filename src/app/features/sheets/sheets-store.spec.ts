import { TestBed } from '@angular/core/testing';

import { aProject, aSceneNode, aSheet, aSheetNode, anAction } from '../../../testing/data-builders';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { SheetsStore } from './sheets-store';

describe('SheetsStore', () => {
  let store: SheetsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SheetsStore, ...useTestRepository()] });
    store = TestBed.inject(SheetsStore);
  });

  it('charge le projet, ses fiches, leurs textes et leurs utilisations', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject({ name: 'La crypte' });
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde', order: 1 });
    await repository.saveProject(project);
    await repository.saveSheetNodes([folder, garde, aSheetNode('autre')]);
    await repository.saveSheet(aSheet(project.id, garde.id, { text: 'Fatigué' }));
    await repository.saveSceneNodes([aSceneNode(project.id, { id: 'scene' })]);
    await repository.saveAction(
      anAction('scene', { elements: [{ id: 'e', type: 'show-sheet', sheetId: garde.id }] }),
    );

    await store.load(project.id);

    expect(store.status()).toBe('ready');
    expect(store.project()?.name).toBe('La crypte');
    expect(store.nodes().map((n) => n.name)).toEqual(['PNJ', 'Garde']);
    expect(store.sheets()[garde.id].text).toBe('Fatigué');
    expect(store.usages()).toEqual({ [garde.id]: 1 });
    expect(store.hasSheets()).toBe(true);
  });

  it('signale un projet introuvable', async () => {
    await store.load('inconnu');
    expect(store.status()).toBe('missing');
    expect(store.project()).toBeNull();
    expect(store.hasSheets()).toBe(false);
  });
});
