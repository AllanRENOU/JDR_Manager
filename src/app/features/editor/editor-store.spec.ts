import { TestBed } from '@angular/core/testing';

import { aBattlemap, aProject, aScene, aSceneNode, anAction } from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { useTestRepository } from '../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { EditorStore } from './editor-store';

describe('EditorStore', () => {
  let store: EditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [EditorStore, ...useTestRepository()],
    });
    store = TestBed.inject(EditorStore);
  });

  const repository = () => TestBed.inject(DATA_REPOSITORY);

  it('signale un projet introuvable', async () => {
    await store.load('inconnu');
    expect(store.status()).toBe('missing');
    expect(store.project()).toBeNull();
  });

  it('charge le projet et ouvre la première scène', async () => {
    const project = aProject();
    const a = aSceneNode(project.id, { name: 'A', order: 0 });
    const b = aSceneNode(project.id, { name: 'B', order: 1 });
    await repository().saveProject({ ...project, firstSceneId: b.id });
    await repository().saveSceneNodes([a, b]);
    await repository().saveScene(aScene(project.id, b.id));

    await store.load(project.id);
    expect(store.status()).toBe('ready');
    expect(store.sceneNodes().map((n) => n.name)).toEqual(['A', 'B']);
    expect(store.selectedSceneId()).toBe(b.id);
    expect(store.scene()?.id).toBe(b.id);
    expect(store.isFirstScene(b.id)).toBe(true);
  });

  describe('création de la première scène (4.3)', () => {
    it('crée la scène, la marque comme première scène et l’ouvre', async () => {
      const project = aProject({ updatedAt: '2020-01-01T00:00:00.000Z' });
      await repository().saveProject(project);
      await store.load(project.id);
      expect(store.hasScenes()).toBe(false);

      const scene = await store.createFirstScene();

      expect(store.hasScenes()).toBe(true);
      expect(store.selectedNode()).toMatchObject({
        id: scene.id,
        kind: 'item',
        name: 'Première scène',
      });
      const saved = await repository().getProject(project.id);
      expect(saved?.firstSceneId).toBe(scene.id);
      expect(saved!.updatedAt > project.updatedAt).toBe(true);
      expect(await repository().getScene(scene.id)).toEqual(scene);
      expect(await repository().listSceneNodes(project.id)).toHaveLength(1);
    });
  });

  describe('texte de scène (4.4)', () => {
    async function withScene() {
      const project = aProject();
      await repository().saveProject(project);
      await store.load(project.id);
      return store.createFirstScene();
    }

    it('crée l’action « Texte de scène » à la première saisie non vide, puis la met à jour', async () => {
      const scene = await withScene();
      await store.setSceneText('   ');
      expect(await repository().listActions(scene.id)).toEqual([]);

      await store.setSceneText('La porte grince.');
      const [action] = await repository().listActions(scene.id);
      expect(action).toMatchObject({
        name: 'Texte de scène',
        trigger: 'scene-open',
        isSceneText: true,
        order: 0,
        elements: [{ type: 'add-text', text: 'La porte grince.' }],
      });
      expect((await repository().getScene(scene.id))?.sceneTextActionId).toBe(action.id);

      await store.setSceneText('La porte grince et s’ouvre.');
      const actions = await repository().listActions(scene.id);
      expect(actions).toHaveLength(1);
      expect(actions[0].id).toBe(action.id);
      expect(actions[0].elements[0]).toMatchObject({
        id: action.elements[0].id,
        text: 'La porte grince et s’ouvre.',
      });
      expect(store.sceneText()).toBe('La porte grince et s’ouvre.');
    });

    it('enchaîne les saisies rapprochées sans créer deux actions', async () => {
      const scene = await withScene();
      await Promise.all([
        store.setSceneText('L'),
        store.setSceneText('La'),
        store.setSceneText('La p'),
      ]);
      const actions = await repository().listActions(scene.id);
      expect(actions).toHaveLength(1);
      expect(actions[0].elements[0]).toMatchObject({ text: 'La p' });
    });

    it('relit le texte à la réouverture de la scène', async () => {
      const scene = await withScene();
      await store.setSceneText('Texte enregistré');
      await store.load(store.project()!.id);
      expect(store.selectedSceneId()).toBe(scene.id);
      expect(store.initialSceneText()).toBe('Texte enregistré');
    });
  });

  describe('enregistrement automatique (4.5)', () => {
    async function withScene() {
      const project = aProject();
      await repository().saveProject(project);
      await store.load(project.id);
      return store.createFirstScene();
    }

    const savedText = async (sceneId: string) =>
      (await repository().listActions(sceneId))[0]?.elements[0];

    it('enregistre après un temps de calme et indique l’état', async () => {
      const scene = await withScene();
      store.editSceneText('La');
      store.editSceneText('La porte');
      expect(store.saveState()).toBe('pending');
      expect(await repository().listActions(scene.id)).toEqual([]);

      await vi.waitFor(async () =>
        expect(await savedText(scene.id)).toMatchObject({ text: 'La porte' }),
      );
      await vi.waitFor(() => expect(store.saveState()).toBe('saved'));
    });

    it('flush enregistre tout de suite la saisie en attente', async () => {
      const scene = await withScene();
      store.editSceneText('Texte immédiat');
      await store.flush();
      expect(await savedText(scene.id)).toMatchObject({ text: 'Texte immédiat' });
      expect(store.saveState()).toBe('saved');
    });

    it('signale un échec d’enregistrement', async () => {
      await withScene();
      vi.spyOn(repository(), 'saveAction').mockRejectedValueOnce(new Error('disque plein'));
      store.editSceneText('Perdu ?');
      await expect(store.flush()).rejects.toThrow('disque plein');
      expect(store.saveState()).toBe('error');
    });
  });

  describe('arborescence des scènes (7.1)', () => {
    async function loadTree() {
      const project = aProject();
      const act = aSceneNode(project.id, { kind: 'folder', name: 'Acte I', order: 0 });
      const tavern = aSceneNode(project.id, { name: 'Taverne', parentId: act.id, order: 0 });
      const market = aSceneNode(project.id, { name: 'Marché', parentId: act.id, order: 1 });
      const crypt = aSceneNode(project.id, { name: 'Crypte', order: 1 });
      await repository().saveProject({ ...project, firstSceneId: tavern.id });
      await repository().saveSceneNodes([act, tavern, market, crypt]);
      for (const n of [tavern, market, crypt]) {
        await repository().saveScene(aScene(project.id, n.id));
      }
      await store.load(project.id);
      return { project, act, tavern, market, crypt };
    }

    it('crée dossiers et scènes dans le dossier de la scène ouverte, en dernière position (7.1.2)', async () => {
      const { project, act, tavern } = await loadTree();
      expect(store.creationParent()).toBe(act.id);

      const folder = await store.createNode('folder', act.id, 'Sous-dossier');
      expect(folder).toMatchObject({ parentId: act.id, order: 2, kind: 'folder' });
      expect(store.selectedSceneId()).toBe(tavern.id);

      const scene = await store.createNode('item', null, 'Nouvelle scène');
      expect(scene).toMatchObject({ parentId: null, order: 2, kind: 'item' });
      expect(store.selectedSceneId()).toBe(scene.id);
      expect(store.creationParent()).toBeNull();
      expect(await repository().getScene(scene.id)).toMatchObject({ nextSceneIds: [] });
      expect((await repository().getProject(project.id))?.firstSceneId).toBe(tavern.id);
      expect((await repository().listSceneNodes(project.id)).map((n) => n.name)).toContain(
        'Sous-dossier',
      );
    });

    it('renomme un nœud et change la première scène (7.1.3)', async () => {
      const { project, market, act } = await loadTree();
      await store.renameNode(act.id, 'Acte premier');
      expect(store.sceneNodes().find((n) => n.id === act.id)?.name).toBe('Acte premier');

      await store.setFirstScene(market.id);
      expect(store.isFirstScene(market.id)).toBe(true);
      expect((await repository().getProject(project.id))?.firstSceneId).toBe(market.id);
    });

    it('supprime un dossier et son contenu ; la scène ouverte supprimée est remplacée (7.1.3)', async () => {
      const { project, act, crypt } = await loadTree();
      await store.removeNode(act.id);

      expect(store.sceneNodes().map((n) => n.name)).toEqual(['Crypte']);
      expect(store.project()?.firstSceneId).toBeNull();
      expect(store.selectedSceneId()).toBe(crypt.id);
      expect(await repository().listSceneNodes(project.id)).toHaveLength(1);

      await store.removeNode(crypt.id);
      expect(store.selectedSceneId()).toBeNull();
      expect(store.scene()).toBeNull();
    });

    it('duplique une scène juste après elle, avec battlemaps et actions (7.1.5)', async () => {
      const { project, act, tavern, market } = await loadTree();
      const map = aBattlemap(tavern.id, 'media-1', { name: 'Salle' });
      const text = anAction(tavern.id, { isSceneText: true, trigger: 'scene-open' });
      const show = anAction(tavern.id, {
        name: 'Montrer',
        order: 1,
        elements: [
          { id: 'e1', type: 'show-battlemap', battlemapId: map.id },
          { id: 'e2', type: 'change-scene', sceneId: market.id },
        ],
      });
      await repository().saveBattlemap(map);
      await repository().saveAction(text);
      await repository().saveAction(show);
      await repository().saveScene({
        ...aScene(project.id, tavern.id),
        defaultBattlemapId: map.id,
        nextSceneIds: [market.id],
        sceneTextActionId: text.id,
      });

      const copy = (await store.duplicateScene(tavern.id))!;
      expect(copy).toMatchObject({ parentId: act.id, order: 1, name: 'Taverne (copie)' });
      expect(store.selectedSceneId()).toBe(copy.id);
      expect(
        store
          .sceneNodes()
          .filter((n) => n.parentId === act.id)
          .map((n) => [n.name, n.order]),
      ).toEqual([
        ['Taverne', 0],
        ['Taverne (copie)', 1],
        ['Marché', 2],
      ]);

      const [copiedMap] = await repository().listBattlemaps(copy.id);
      expect(copiedMap).toMatchObject({ name: 'Salle', mediaId: 'media-1' });
      expect(copiedMap.id).not.toBe(map.id);
      const scene = await repository().getScene(copy.id);
      expect(scene?.defaultBattlemapId).toBe(copiedMap.id);
      expect(scene?.nextSceneIds).toEqual([market.id]);
      const actions = await repository().listActions(copy.id);
      expect(actions.map((a) => a.name)).toEqual([text.name, 'Montrer']);
      expect(scene?.sceneTextActionId).toBe(actions[0].id);
      expect(actions[1].elements).toEqual([
        {
          id: expect.not.stringMatching(/^e1$/),
          type: 'show-battlemap',
          battlemapId: copiedMap.id,
        },
        { id: expect.not.stringMatching(/^e2$/), type: 'change-scene', sceneId: market.id },
      ]);
      // L'original n'a pas changé.
      expect((await repository().listActions(tavern.id))[1].elements[0]).toMatchObject({
        battlemapId: map.id,
      });
    });

    it('déplace une scène dans un autre dossier et renumérote les frères (7.1.4)', async () => {
      const { project, act, tavern, market, crypt } = await loadTree();
      await store.moveNode({ id: crypt.id, parentId: act.id, order: 1 });

      const byId = (nodes: { id: string; parentId: string | null; order: number }[]) =>
        Object.fromEntries(nodes.map((n) => [n.id, [n.parentId, n.order]]));
      const expected = {
        [act.id]: [null, 0],
        [tavern.id]: [act.id, 0],
        [crypt.id]: [act.id, 1],
        [market.id]: [act.id, 2],
      };
      expect(byId(store.sceneNodes())).toEqual(expected);
      expect(byId(await repository().listSceneNodes(project.id))).toEqual(expected);
    });
  });

  describe('textes des actions (7.2.3)', () => {
    it('liste les textes des actions sous le texte de scène, dans l’ordre d’affichage', async () => {
      const project = aProject();
      const node = aSceneNode(project.id);
      await repository().saveProject({ ...project, firstSceneId: node.id });
      await repository().saveSceneNodes([node]);
      await repository().saveScene(aScene(project.id, node.id));
      const text = (id: string, value: string) => ({ id, type: 'add-text' as const, text: value });
      await repository().saveAction(
        anAction(node.id, { name: 'Bagarre', order: 3, elements: [text('b1', 'Une chope vole.')] }),
      );
      await repository().saveAction(
        anAction(node.id, {
          name: 'Texte de scène',
          isSceneText: true,
          trigger: 'scene-open',
          order: 0,
          elements: [text('s1', 'La salle.'), text('s2', 'Un murmure.')],
        }),
      );
      await repository().saveAction(
        anAction(node.id, {
          name: 'Feu',
          trigger: 'scene-open',
          order: 1,
          elements: [{ id: 'w', type: 'wait', seconds: 1 }],
        }),
      );
      await store.load(project.id);

      expect(store.sceneText()).toBe('La salle.');
      expect(store.actions().map((a) => a.name)).toEqual(['Texte de scène', 'Feu', 'Bagarre']);
      expect(store.actionTexts().map((t) => [t.action.name, t.element.text])).toEqual([
        ['Texte de scène', 'Un murmure.'],
        ['Bagarre', 'Une chope vole.'],
      ]);
      expect(store.initialTexts()).toEqual({ s2: 'Un murmure.', b1: 'Une chope vole.' });
    });

    it('enregistre la saisie d’un texte d’action avec le texte de scène, après un temps de calme', async () => {
      const project = aProject();
      const node = aSceneNode(project.id);
      const action = anAction(node.id, {
        name: 'Bagarre',
        elements: [{ id: 'b1', type: 'add-text', text: 'Avant' }],
      });
      await repository().saveProject({ ...project, firstSceneId: node.id });
      await repository().saveSceneNodes([node]);
      await repository().saveScene(aScene(project.id, node.id));
      await repository().saveAction(action);
      await store.load(project.id);

      store.editActionText({ actionId: action.id, elementId: 'b1' }, 'Après');
      store.editSceneText('Texte de scène');
      expect(store.saveState()).toBe('pending');
      await vi.waitFor(() => expect(store.saveState()).toBe('saved'));

      const saved = await repository().listActions(node.id);
      expect(saved.find((a) => a.id === action.id)?.elements[0]).toMatchObject({ text: 'Après' });
      expect(saved.find((a) => a.isSceneText)?.elements[0]).toMatchObject({
        text: 'Texte de scène',
      });
      expect(store.actionTexts()[0].element.text).toBe('Après');
    });
  });

  it('réordonne les actions d’un même déclencheur, « Texte de scène » restant en tête (7.3.2)', async () => {
    const project = aProject();
    const node = aSceneNode(project.id);
    await repository().saveProject({ ...project, firstSceneId: node.id });
    await repository().saveSceneNodes([node]);
    await repository().saveScene(aScene(project.id, node.id));
    const action = (
      name: string,
      order: number,
      trigger: 'scene-open' | 'manual',
      isSceneText = false,
    ) => anAction(node.id, { name, order, trigger, isSceneText });
    for (const a of [
      action('Texte', 0, 'scene-open', true),
      action('Feu', 1, 'scene-open'),
      action('Vent', 2, 'scene-open'),
      action('Bagarre', 3, 'manual'),
      action('Fuite', 4, 'manual'),
    ]) {
      await repository().saveAction(a);
    }
    await store.load(project.id);
    const names = () => store.actions().map((a) => a.name);

    await store.reorderAction('manual', 1, 0);
    expect(names()).toEqual(['Texte', 'Feu', 'Vent', 'Fuite', 'Bagarre']);
    await store.reorderAction('scene-open', 2, 0);
    expect(names()).toEqual(['Texte', 'Vent', 'Feu', 'Fuite', 'Bagarre']);
    await store.reorderAction('scene-open', 0, 2);
    expect(names()).toEqual(['Texte', 'Vent', 'Feu', 'Fuite', 'Bagarre']);

    const saved = await repository().listActions(node.id);
    expect(saved.map((a) => [a.name, a.order])).toEqual([
      ['Texte', 0],
      ['Vent', 1],
      ['Feu', 2],
      ['Fuite', 3],
      ['Bagarre', 4],
    ]);
  });

  describe('battlemaps (7.3.4)', () => {
    useNodeBlob();

    it('importe des images à la suite ; la première devient la battlemap par défaut', async () => {
      const project = aProject();
      const node = aSceneNode(project.id);
      await repository().saveProject({ ...project, firstSceneId: node.id });
      await repository().saveSceneNodes([node]);
      await repository().saveScene(aScene(project.id, node.id));
      await store.load(project.id);

      const result = await store.importBattlemaps([
        new File(['a'], 'Rez-de-chaussée.png', { type: 'image/png' }),
        new File(['b'], 'pluie.mp3', { type: 'audio/mpeg' }),
        new File(['c'], 'Étage.webp', { type: 'image/webp' }),
      ]);

      expect(result.rejected.map((f) => f.name)).toEqual(['pluie.mp3']);
      expect(store.battlemaps().map((b) => [b.name, b.order])).toEqual([
        ['Rez-de-chaussée', 0],
        ['Étage', 1],
      ]);
      expect(store.scene()?.defaultBattlemapId).toBe(store.battlemaps()[0].id);
      expect((await repository().getScene(node.id))?.defaultBattlemapId).toBe(
        store.battlemaps()[0].id,
      );
      expect(await repository().listBattlemaps(node.id)).toHaveLength(2);
    });

    it('définit la battlemap par défaut, renomme, et supprime en reportant le défaut (7.3.5)', async () => {
      const project = aProject();
      const node = aSceneNode(project.id);
      const a = aBattlemap(node.id, 'm1', { name: 'A', order: 0 });
      const b = aBattlemap(node.id, 'm2', { name: 'B', order: 1 });
      const show = anAction(node.id, {
        elements: [{ id: 'e', type: 'show-battlemap', battlemapId: b.id }],
      });
      await repository().saveProject({ ...project, firstSceneId: node.id });
      await repository().saveSceneNodes([node]);
      await repository().saveScene({ ...aScene(project.id, node.id), defaultBattlemapId: a.id });
      await repository().saveBattlemap(a);
      await repository().saveBattlemap(b);
      await repository().saveAction(show);
      await store.load(project.id);

      expect(store.battlemapUsage(b.id)).toBe(1);
      expect(store.battlemapUsage(a.id)).toBe(0);

      await store.setDefaultBattlemap(b.id);
      expect((await repository().getScene(node.id))?.defaultBattlemapId).toBe(b.id);

      await store.renameBattlemap(a.id, 'Cave');
      expect((await repository().listBattlemaps(node.id)).map((m) => m.name)).toEqual([
        'Cave',
        'B',
      ]);

      await store.deleteBattlemap(b.id);
      expect(store.battlemaps().map((m) => m.name)).toEqual(['Cave']);
      expect(store.scene()?.defaultBattlemapId).toBe(a.id);
      expect((await repository().getScene(node.id))?.defaultBattlemapId).toBe(a.id);
      // L'élément qui visait la battlemap supprimée n'est pas modifié (PRS-07).
      expect((await repository().listActions(node.id))[0].elements[0]).toMatchObject({
        battlemapId: b.id,
      });

      await store.deleteBattlemap(a.id);
      expect(store.scene()?.defaultBattlemapId).toBeNull();
    });
  });

  it('enregistre une action de l’éditeur d’action, ou en crée une nouvelle à la fin (8.1.1)', async () => {
    const project = aProject();
    const node = aSceneNode(project.id);
    const existing = anAction(node.id, {
      name: 'Bagarre',
      order: 3,
      elements: [{ id: 't', type: 'add-text', text: 'Avant' }],
    });
    await repository().saveProject({ ...project, firstSceneId: node.id });
    await repository().saveSceneNodes([node]);
    await repository().saveScene(aScene(project.id, node.id));
    await repository().saveAction(existing);
    await store.load(project.id);

    await store.saveAction(existing, {
      name: 'Grosse bagarre',
      trigger: 'manual',
      elements: [{ id: 't', type: 'add-text', text: 'Après' }],
    });
    expect(store.initialTexts()['t']).toBe('Après');
    const created = await store.saveAction(null, {
      name: 'Fuite',
      trigger: 'manual',
      elements: [],
    });
    expect(created).toMatchObject({ sceneId: node.id, order: 4, isSceneText: false });

    const saved = await repository().listActions(node.id);
    expect(saved.map((a) => [a.name, a.order])).toEqual([
      ['Grosse bagarre', 3],
      ['Fuite', 4],
    ]);
    expect(store.actionTexts()[0].element.text).toBe('Après');
  });

  it('supprime une action, jamais « Texte de scène » (8.1.2)', async () => {
    const project = aProject();
    const node = aSceneNode(project.id);
    const text = anAction(node.id, { isSceneText: true, trigger: 'scene-open' });
    const other = anAction(node.id, { name: 'Bagarre', order: 1 });
    await repository().saveProject({ ...project, firstSceneId: node.id });
    await repository().saveSceneNodes([node]);
    await repository().saveScene(aScene(project.id, node.id));
    await repository().saveAction(text);
    await repository().saveAction(other);
    await store.load(project.id);

    await store.deleteAction(text.id);
    await store.deleteAction(other.id);
    expect(store.actions().map((a) => a.id)).toEqual([text.id]);
    expect((await repository().listActions(node.id)).map((a) => a.id)).toEqual([text.id]);
  });
});
