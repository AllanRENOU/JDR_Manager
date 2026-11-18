import { TestBed } from '@angular/core/testing';

import {
  aBattlemap,
  aPlaySession,
  aProject,
  aScene,
  aSceneNode,
  aSoundNode,
} from '../../../testing/data-builders';
import { useTestRepository } from '../../../testing/test-repository';
import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { loadProjectSummary } from './project-summary';

describe('loadProjectSummary (5.1.2)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [...useTestRepository()] }));
  const repository = () => TestBed.inject(DATA_REPOSITORY);

  it('résume un projet vide', async () => {
    const project = aProject();
    await repository().saveProject(project);
    expect(await loadProjectSummary(repository(), project)).toEqual({
      project,
      sceneCount: 0,
      soundCount: 0,
      lastSceneName: null,
      hasPlaySession: false,
      thumbnailMediaId: null,
    });
  });

  it('compte scènes et sons, trouve la dernière scène jouée', async () => {
    const project = aProject();
    const folder = aSceneNode(project.id, { kind: 'folder' });
    const first = aSceneNode(project.id, { name: 'Entrée', parentId: folder.id });
    const second = aSceneNode(project.id, { name: 'Crypte' });
    const map1 = aBattlemap(first.id, 'media-1', { order: 0 });
    const map2 = aBattlemap(first.id, 'media-2', { order: 1 });
    await repository().saveProject({ ...project, firstSceneId: first.id });
    await repository().saveSceneNodes([folder, first, second]);
    await repository().saveScene(aScene(project.id, first.id, { defaultBattlemapId: map2.id }));
    await repository().saveBattlemap(map1);
    await repository().saveBattlemap(map2);
    await repository().saveLibraryNodes([
      aSoundNode(project.id),
      aSoundNode(project.id, { kind: 'folder' }),
      aSoundNode('global'),
    ]);
    await repository().savePlaySession(aPlaySession(project.id, second.id));

    const summary = await loadProjectSummary(repository(), { ...project, firstSceneId: first.id });
    expect(summary).toMatchObject({
      sceneCount: 2,
      soundCount: 1,
      lastSceneName: 'Crypte',
      hasPlaySession: true,
    });
  });

  it("prend l'image du projet pour la vignette, jamais une battlemap (5.3.3)", async () => {
    const project = aProject();
    const scene = aSceneNode(project.id);
    const map = aBattlemap(scene.id, 'media-map');
    await repository().saveProject({ ...project, firstSceneId: scene.id });
    await repository().saveSceneNodes([scene]);
    await repository().saveScene(aScene(project.id, scene.id, { defaultBattlemapId: map.id }));
    await repository().saveBattlemap(map);

    const withoutImage = { ...project, firstSceneId: scene.id };
    expect((await loadProjectSummary(repository(), withoutImage)).thumbnailMediaId).toBeNull();
    const withImage = { ...withoutImage, imageMediaId: 'media-image' };
    expect((await loadProjectSummary(repository(), withImage)).thumbnailMediaId).toBe(
      'media-image',
    );
  });
});
