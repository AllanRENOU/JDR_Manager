import { TestBed } from '@angular/core/testing';

import { aProject, aScene, aSceneNode, anAction } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Action, AddTextElement } from '../../../core/models';
import { ActionRunner } from './action-runner';
import { PresentationEngine } from './presentation-engine';

describe('PresentationEngine (4.7)', () => {
  let engine: PresentationEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentationEngine, ActionRunner, ...useTestRepository()],
    });
    engine = TestBed.inject(PresentationEngine);
  });

  afterEach(() => engine.stop());

  const repository = () => TestBed.inject(DATA_REPOSITORY);
  const text = (id: string, value: string): AddTextElement => ({
    id,
    type: 'add-text',
    text: value,
  });
  const feedTexts = () => engine.feed().map((item) => engine.textOf(item));

  async function projectWithScenes(firstSceneIndex: number | null) {
    const project = aProject();
    const folder = aSceneNode(project.id, { kind: 'folder', name: 'Acte 1', order: 0 });
    const a = aSceneNode(project.id, { name: 'A', parentId: folder.id, order: 0 });
    const b = aSceneNode(project.id, { name: 'B', order: 1 });
    const scenes = [a, b];
    await repository().saveProject({
      ...project,
      firstSceneId: firstSceneIndex === null ? null : scenes[firstSceneIndex].id,
    });
    await repository().saveSceneNodes([folder, a, b]);
    for (const node of scenes) {
      await repository().saveScene(aScene(project.id, node.id));
    }
    return { project, a, b };
  }

  it('signale un projet introuvable ou sans scène', async () => {
    await engine.start('inconnu');
    expect(engine.status()).toBe('missing');

    const empty = aProject();
    await repository().saveProject(empty);
    await engine.start(empty.id);
    expect(engine.status()).toBe('no-scene');
  });

  it('ouvre la première scène du projet (PRS-01), sinon la première de l’arborescence', async () => {
    const withFirst = await projectWithScenes(1);
    await engine.start(withFirst.project.id);
    expect(engine.status()).toBe('ready');
    expect(engine.sceneNode()?.name).toBe('B');

    const withoutFirst = await projectWithScenes(null);
    await engine.start(withoutFirst.project.id);
    expect(engine.sceneNode()?.name).toBe('A');
  });

  it('lance les actions d’ouverture, « Texte de scène » en premier, puis par ordre', async () => {
    const { project, b } = await projectWithScenes(1);
    const actions: Action[] = [
      anAction(b.id, { order: 2, trigger: 'scene-open', elements: [text('e3', 'Troisième')] }),
      anAction(b.id, {
        order: 5,
        isSceneText: true,
        trigger: 'scene-open',
        elements: [text('e1', 'Texte de scène')],
      }),
      anAction(b.id, { order: 1, trigger: 'scene-open', elements: [text('e2', 'Deuxième')] }),
      anAction(b.id, { order: 0, trigger: 'manual', elements: [text('e4', 'Manuelle')] }),
    ];
    for (const action of actions) {
      await repository().saveAction(action);
    }
    await engine.start(project.id);
    expect(feedTexts()).toEqual(['Texte de scène', 'Deuxième', 'Troisième']);
  });

  it('n’ajoute pas deux fois le même texte au fil', async () => {
    const { project, b } = await projectWithScenes(1);
    const repeated = text('e1', 'Une seule fois');
    await repository().saveAction(
      anAction(b.id, { trigger: 'scene-open', elements: [repeated, repeated] }),
    );
    await engine.start(project.id);
    expect(feedTexts()).toEqual(['Une seule fois']);
  });

  it('renvoie null pour le texte d’un élément supprimé', async () => {
    const { project, b } = await projectWithScenes(1);
    const action = anAction(b.id, {
      trigger: 'scene-open',
      elements: [text('e1', 'Bientôt supprimé')],
    });
    await repository().saveAction(action);
    await engine.start(project.id);
    const [item] = engine.feed();
    engine.actions.set(new Map([[action.id, { ...action, elements: [] }]]));
    expect(engine.textOf(item)).toBeNull();
  });

  it('arrête les actions de la scène quittée', async () => {
    // Runner ralenti : il attend un feu vert après chaque élément.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const runner = TestBed.inject(ActionRunner);
    vi.spyOn(runner, 'run').mockImplementation(async (action, context, signal) => {
      for (const element of action.elements) {
        signal.throwIfAborted();
        context.addText(action, element as AddTextElement);
        await gate;
      }
      signal.throwIfAborted();
    });

    const { project, b } = await projectWithScenes(1);
    await repository().saveAction(
      anAction(b.id, { trigger: 'scene-open', elements: [text('e1', 'Un'), text('e2', 'Deux')] }),
    );
    const started = engine.start(project.id);
    await vi.waitFor(() => expect(engine.feed()).toHaveLength(1));
    engine.stop();
    release();
    await expect(started).resolves.toBeUndefined();
    expect(feedTexts()).toEqual(['Un']);
  });
});
