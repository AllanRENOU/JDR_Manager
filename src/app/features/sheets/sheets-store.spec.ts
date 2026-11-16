import { TestBed } from '@angular/core/testing';

import { aProject, aSceneNode, aSheet, aSheetNode, anAction } from '../../../testing/data-builders';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY, DataRepository } from '../../core/data/data-repository';
import { Project } from '../../core/models';
import { UiPreferences } from '../../core/preferences/ui-preferences';
import { SHEET_SAVE_DELAY_MS, SheetsStore, lastOpenedSheetKey } from './sheets-store';

describe('SheetsStore', () => {
  let store: SheetsStore;
  let repository: DataRepository;
  let project: Project;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [SheetsStore, ...useTestRepository()] });
    store = TestBed.inject(SheetsStore);
    repository = TestBed.inject(DATA_REPOSITORY);
    project = aProject({ name: 'La crypte', updatedAt: '2026-01-01T00:00:00.000Z' });
    await repository.saveProject(project);
  });

  afterEach(() => localStorage.clear());

  it('charge le projet, ses fiches, leurs textes et leurs utilisations', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde', order: 1 });
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
    expect(store.usageCount(folder.id)).toBe(1);
    expect(store.hasNodes()).toBe(true);
    expect(store.selectedId()).toBeNull();
  });

  it('signale un projet introuvable', async () => {
    await store.load('inconnu');
    expect(store.status()).toBe('missing');
    expect(store.project()).toBeNull();
    expect(store.hasNodes()).toBe(false);
  });

  it('rouvre la dernière fiche ouverte, si elle existe encore (FCH-03)', async () => {
    const garde = aSheetNode(project.id, { name: 'Garde' });
    await repository.saveSheetNodes([garde]);
    await store.load(project.id);
    await store.open(garde.id);
    expect(TestBed.inject(UiPreferences).get(lastOpenedSheetKey(project.id), null)).toBe(garde.id);

    await store.load(project.id);
    expect(store.selectedId()).toBe(garde.id);

    TestBed.inject(UiPreferences).set(lastOpenedSheetKey(project.id), 'supprimée');
    await store.load(project.id);
    expect(store.selectedId()).toBeNull();
  });

  it('n’ouvre pas un dossier', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder' });
    await repository.saveSheetNodes([folder]);
    await store.load(project.id);
    await store.open(folder.id);
    expect(store.selectedId()).toBeNull();
  });

  it('crée une fiche vide à la fin de son dossier, l’ouvre et efface la recherche', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    await repository.saveSheetNodes([folder, aSheetNode(project.id, { parentId: folder.id })]);
    await store.load(project.id);
    store.query.set('introuvable');

    const node = await store.createNode('item', folder.id, 'Nouvelle fiche');

    expect(node).toMatchObject({ parentId: folder.id, order: 1, kind: 'item' });
    expect(await repository.getSheet(node.id)).toEqual({
      id: node.id,
      projectId: project.id,
      text: '',
    });
    expect(store.selectedId()).toBe(node.id);
    expect(store.query()).toBe('');
    expect((await repository.getProject(project.id))?.updatedAt).not.toBe(project.updatedAt);
  });

  it('crée un dossier sans texte ni ouverture', async () => {
    await store.load(project.id);
    const node = await store.createNode('folder', null, 'Lieux');
    expect(await repository.listSheets(project.id)).toEqual([]);
    expect(store.selectedId()).toBeNull();
    expect((await repository.listSheetNodes(project.id)).map((n) => n.id)).toEqual([node.id]);
  });

  it('enchaîne deux créations rapides sans collision d’ordre', async () => {
    await store.load(project.id);
    const [a, b] = await Promise.all([
      store.createNode('item', null, 'A'),
      store.createNode('item', null, 'B'),
    ]);
    expect([a.order, b.order]).toEqual([0, 1]);
  });

  it('renomme un nœud et ignore un nom vide', async () => {
    const garde = aSheetNode(project.id, { name: 'Garde' });
    await repository.saveSheetNodes([garde]);
    await store.load(project.id);

    await store.renameNode(garde.id, '   ');
    await store.renameNode(garde.id, ' Garde du pont ');

    expect((await repository.listSheetNodes(project.id))[0].name).toBe('Garde du pont');
    expect(store.nodes()[0].name).toBe('Garde du pont');
  });

  it('supprime un dossier avec ses fiches et ferme la fiche ouverte qui en faisait partie', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder' });
    const inner = aSheetNode(project.id, { parentId: folder.id });
    const kept = aSheetNode(project.id, { order: 1 });
    await repository.saveSheetNodes([folder, inner, kept]);
    await repository.saveSheet(aSheet(project.id, inner.id));
    await store.load(project.id);
    await store.open(inner.id);

    await store.removeNode(folder.id);

    expect(store.nodes().map((n) => n.id)).toEqual([kept.id]);
    expect(store.sheets()[inner.id]).toBeUndefined();
    expect(store.selectedId()).toBeNull();
    expect(await repository.getSheet(inner.id)).toBeUndefined();
  });

  it('déplace une fiche dans un dossier', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder' });
    const garde = aSheetNode(project.id, { order: 1 });
    await repository.saveSheetNodes([folder, garde]);
    await store.load(project.id);

    await store.moveNode({ id: garde.id, parentId: folder.id, order: 0 });

    expect(
      (await repository.listSheetNodes(project.id)).find((n) => n.id === garde.id),
    ).toMatchObject({ parentId: folder.id, order: 0 });
  });

  it('filtre l’arborescence sur le titre et le texte (FCH-06)', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde' });
    const pont = aSheetNode(project.id, { name: 'Pont', order: 1 });
    await repository.saveSheetNodes([folder, garde, pont]);
    await repository.saveSheet(
      aSheet(project.id, garde.id, { text: 'Il surveille le *passage*.' }),
    );
    await store.load(project.id);

    store.query.set('PASSAGE');

    expect(store.searching()).toBe(true);
    expect(
      store
        .visibleNodes()
        .map((n) => n.name)
        .sort(),
    ).toEqual(['Garde', 'PNJ']);
  });

  it('propose comme parent le dossier sélectionné, celui de la fiche sélectionnée ou ouverte', async () => {
    const folder = aSheetNode(project.id, { kind: 'folder' });
    const inner = aSheetNode(project.id, { parentId: folder.id });
    await repository.saveSheetNodes([folder, inner]);
    await store.load(project.id);

    expect(store.creationParent(folder.id)).toBe(folder.id);
    expect(store.creationParent(inner.id)).toBe(folder.id);
    expect(store.creationParent()).toBeNull();
    await store.open(inner.id);
    expect(store.creationParent()).toBe(folder.id);
  });

  describe('texte de la fiche ouverte (FCH-05)', () => {
    async function twoSheets() {
      const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
      const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde' });
      const pont = aSheetNode(project.id, { name: 'Pont', order: 1 });
      await repository.saveSheetNodes([folder, garde, pont]);
      await repository.saveSheet(aSheet(project.id, garde.id, { text: 'Fatigué' }));
      await repository.saveSheet(aSheet(project.id, pont.id, { text: '' }));
      await store.load(project.id);
      return { folder, garde, pont };
    }

    it('donne le texte et le chemin de la fiche ouverte', async () => {
      const { folder, garde } = await twoSheets();
      await store.open(garde.id);
      expect(store.initialText()).toBe('Fatigué');
      expect(store.selectedFolders()).toEqual([folder]);
    });

    it('enregistre la saisie après un temps de calme, sans toucher au texte figé', async () => {
      const { garde } = await twoSheets();
      await store.open(garde.id);
      store.editText('Fatigu');
      store.editText('Fatigué et bavard');
      expect(store.saveState()).toBe('pending');
      await new Promise((resolve) => setTimeout(resolve, SHEET_SAVE_DELAY_MS / 2));
      expect((await repository.getSheet(garde.id))?.text).toBe('Fatigué');

      await vi.waitFor(() => expect(store.saveState()).toBe('saved'), { timeout: 2000 });
      expect((await repository.getSheet(garde.id))?.text).toBe('Fatigué et bavard');
      expect(store.sheets()[garde.id].text).toBe('Fatigué et bavard');
      expect(store.initialText()).toBe('Fatigué');
    });

    it('enregistre la saisie en attente avant d’ouvrir une autre fiche', async () => {
      const { garde, pont } = await twoSheets();
      await store.open(garde.id);
      store.editText('Endormi');

      await store.open(pont.id);

      expect((await repository.getSheet(garde.id))?.text).toBe('Endormi');
      expect(store.selectedId()).toBe(pont.id);
      expect(store.initialText()).toBe('');
    });

    it('flush() enregistre tout de suite ; une erreur est signalée', async () => {
      const { garde } = await twoSheets();
      await store.open(garde.id);
      store.editText('Vite');
      await store.flush();
      expect((await repository.getSheet(garde.id))?.text).toBe('Vite');

      vi.spyOn(repository, 'saveSheet').mockRejectedValueOnce(new Error('disque plein'));
      store.editText('Perdu ?');
      await expect(store.flush()).rejects.toThrow('disque plein');
      expect(store.saveState()).toBe('error');
    });

    it('enregistre la saisie avant de supprimer une autre fiche', async () => {
      const { garde, pont } = await twoSheets();
      await store.open(garde.id);
      store.editText('Gardé');
      await store.removeNode(pont.id);
      expect((await repository.getSheet(garde.id))?.text).toBe('Gardé');
      expect(store.selectedId()).toBe(garde.id);
    });
  });
});
