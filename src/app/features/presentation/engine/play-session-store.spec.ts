import { TestBed } from '@angular/core/testing';

import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { DataError } from '../../../core/data/data-error';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { PlaySessionStore, newSceneState } from './play-session-store';

describe('PlaySessionStore', () => {
  let store: PlaySessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [PlaySessionStore, ...useTestRepository()],
    });
    store = TestBed.inject(PlaySessionStore);
  });

  const repository = () => TestBed.inject(DATA_REPOSITORY);

  it('enregistre chaque événement, dans l’ordre (9.3.1)', async () => {
    await store.restart('p1', 'A');
    store.updateScene('A', () => newSceneState('b1'));
    store.updateScene('A', (s) => ({ ...s, doneActionIds: ['x'] }));
    store.setCurrentScene('B');
    await store.flush();
    const saved = await repository().getPlaySession('p1');
    expect(saved?.currentSceneId).toBe('B');
    expect(saved?.scenes['A']).toMatchObject({ currentBattlemapId: 'b1', doneActionIds: ['x'] });
  });

  it('Recommencer efface la partie précédente (9.3.3)', async () => {
    await store.restart('p1', 'A');
    store.updateScene('A', () => newSceneState(null));
    await store.flush();
    await store.restart('p1', 'A');
    await store.flush();
    expect((await repository().getPlaySession('p1'))?.scenes).toEqual({});
  });

  it('Continuer reprend une copie de la partie sauvegardée (9.3.2)', async () => {
    await store.restart('p1', 'A');
    store.updateScene('A', () => newSceneState('b1'));
    await store.flush();
    const saved = (await store.findSaved('p1'))!;
    store.resume(saved);
    store.updateScene('A', (s) => ({ ...s, currentBattlemapId: 'b2' }));
    expect(saved.scenes['A'].currentBattlemapId).toBe('b1');
    expect(store.sceneState('A')?.currentBattlemapId).toBe('b2');
  });

  it('une écriture ratée est signalée et n’empêche pas les suivantes (NF-25)', async () => {
    const save = vi
      .spyOn(repository(), 'savePlaySession')
      .mockRejectedValueOnce(new DataError('quota-exceeded', 'quota'));
    await store.restart('p1', 'A');
    store.setCurrentScene('B');
    await store.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(Notifications).notifications()).toHaveLength(1);
    expect((await repository().getPlaySession('p1'))?.currentSceneId).toBe('B');
  });
});
