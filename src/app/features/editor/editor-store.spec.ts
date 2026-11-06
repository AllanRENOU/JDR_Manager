import { TestBed } from '@angular/core/testing';

import { aProject, aScene, aSceneNode } from '../../../testing/data-builders';
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
});
