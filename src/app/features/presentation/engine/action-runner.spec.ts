import { anAction } from '../../../../testing/data-builders';
import { Action, ActionElement } from '../../../core/models';
import { delay } from '../../../shared/util/delay';
import { ActionContext, ActionRunner } from './action-runner';

describe('ActionRunner', () => {
  const runner = new ActionRunner();

  /** Contexte qui journalise chaque appel ; les clics sont résolus à la main (`click()`). */
  function recorder(options: { sceneExists?: boolean; logPauses?: boolean } = {}) {
    const log: string[] = [];
    const clicks: { resolve: () => void; reject: (e: unknown) => void }[] = [];
    const context: ActionContext = {
      beforeDisplay: async () => {
        if (options.logPauses) {
          log.push('pause');
        }
      },
      addText: (_a, e) => log.push(`texte:${e.text}`),
      showBattlemap: (e) => log.push(`battlemap:${e.battlemapId}`),
      playSound: (e) => log.push(`lancer:${e.soundId}`),
      stopSound: (e) => log.push(`arrêter:${e.soundId}`),
      stopAllSounds: () => log.push('arrêter-tout'),
      waitForUserClick: (_a, e, signal) =>
        new Promise<void>((resolve, reject) => {
          log.push(`clic:${e.text}`);
          clicks.push({ resolve, reject });
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
      wait: (e, signal) => delay(e.seconds * 1000, signal),
      canChangeScene: (e) => {
        log.push(`scène:${e.sceneId}`);
        return options.sceneExists ?? true;
      },
      markDone: (a) => log.push(`effectuée:${a.name}`),
    };
    return { log, clicks, context };
  }

  const action = (elements: ActionElement[]): Action =>
    anAction('s1', { name: 'Bagarre', elements });

  it('exécute tous les types d’éléments dans l’ordre puis marque l’action effectuée (9.1.1 à 9.1.3, 9.1.7)', async () => {
    const { log, context } = recorder();
    const outcome = await runner.run(
      action([
        { id: 'a', type: 'add-text', text: 'Un' },
        { id: 'b', type: 'show-battlemap', battlemapId: 'carte' },
        {
          id: 'c',
          type: 'play-sound',
          soundId: 'combat',
          volume: 1,
          loop: false,
          fadeInMs: 0,
          fadeOutMs: 0,
        },
        { id: 'd', type: 'stop-sound', soundId: 'pluie' },
        { id: 'e', type: 'stop-all-sounds' },
        { id: 'f', type: 'add-text', text: 'Deux' },
      ]),
      context,
      new AbortController().signal,
    );
    expect(outcome).toEqual({ kind: 'done' });
    expect(log).toEqual([
      'texte:Un',
      'battlemap:carte',
      'lancer:combat',
      'arrêter:pluie',
      'arrêter-tout',
      'texte:Deux',
      'effectuée:Bagarre',
    ]);
  });

  it('attend beforeDisplay avant chaque élément affiché, pas avant les sons ni les attentes', async () => {
    const { log, clicks, context } = recorder({ logPauses: true });
    const run = runner.run(
      action([
        { id: 'a', type: 'add-text', text: 'Un' },
        { id: 'b', type: 'show-battlemap', battlemapId: 'carte' },
        { id: 'c', type: 'stop-sound', soundId: 'pluie' },
        { id: 'd', type: 'stop-all-sounds' },
        { id: 'e', type: 'wait', seconds: 0 },
        { id: 'f', type: 'user-click', text: 'Clic' },
        { id: 'g', type: 'change-scene', sceneId: 's2' },
      ]),
      context,
      new AbortController().signal,
    );
    await vi.waitFor(() => expect(clicks).toHaveLength(1));
    clicks[0].resolve();
    await run;
    expect(log).toEqual([
      'pause',
      'texte:Un',
      'pause',
      'battlemap:carte',
      'arrêter:pluie',
      'arrêter-tout',
      'pause',
      'clic:Clic',
      'effectuée:Bagarre',
      'scène:s2',
    ]);
  });

  it('s’interrompt quand le signal est annulé, sans marquer l’action effectuée (9.1.1)', async () => {
    const controller = new AbortController();
    const { log, context } = recorder();
    context.addText = (_a, e) => {
      log.push(`texte:${e.text}`);
      controller.abort();
    };
    const run = runner.run(
      action([
        { id: 'a', type: 'add-text', text: 'Un' },
        { id: 'b', type: 'add-text', text: 'Deux' },
      ]),
      context,
      controller.signal,
    );
    await expect(run).rejects.toThrow();
    expect(log).toEqual(['texte:Un']);
  });

  describe('Attendre (9.1.4)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('attend la durée de l’élément avant de continuer', async () => {
      const { log, context } = recorder();
      const run = runner.run(
        action([
          { id: 'w', type: 'wait', seconds: 2.5 },
          { id: 'a', type: 'add-text', text: 'Après' },
        ]),
        context,
        new AbortController().signal,
      );
      await vi.advanceTimersByTimeAsync(2499);
      expect(log).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await run;
      expect(log).toEqual(['texte:Après', 'effectuée:Bagarre']);
    });

    it('une attente en cours est annulable', async () => {
      const controller = new AbortController();
      const { log, context } = recorder();
      const run = runner.run(
        action([
          { id: 'w', type: 'wait', seconds: 60 },
          { id: 'a', type: 'add-text', text: 'Jamais' },
        ]),
        context,
        controller.signal,
      );
      await vi.advanceTimersByTimeAsync(1000);
      controller.abort();
      await expect(run).rejects.toThrow();
      expect(log).toEqual([]);
    });
  });

  it('Clic de l’utilisateur : reprend au clic, s’arrête à l’annulation (9.1.5)', async () => {
    const { log, clicks, context } = recorder();
    const run = runner.run(
      action([
        { id: 'c', type: 'user-click', text: 'Il approche.' },
        { id: 'a', type: 'add-text', text: 'Après le clic' },
      ]),
      context,
      new AbortController().signal,
    );
    await Promise.resolve();
    expect(log).toEqual(['clic:Il approche.']);
    clicks[0].resolve();
    await run;
    expect(log).toEqual(['clic:Il approche.', 'texte:Après le clic', 'effectuée:Bagarre']);

    const controller = new AbortController();
    const second = recorder();
    const pending = runner.run(
      action([
        { id: 'c', type: 'user-click', text: 'Attente' },
        { id: 'a', type: 'add-text', text: 'Jamais' },
      ]),
      second.context,
      controller.signal,
    );
    await Promise.resolve();
    controller.abort();
    await expect(pending).rejects.toThrow();
    expect(second.log).toEqual(['clic:Attente']);
  });

  it('Changer de scène termine l’action : éléments suivants ignorés (9.1.6)', async () => {
    const { log, context } = recorder();
    const outcome = await runner.run(
      action([
        { id: 'a', type: 'add-text', text: 'Avant' },
        { id: 's', type: 'change-scene', sceneId: 'forêt' },
        { id: 'b', type: 'add-text', text: 'Jamais' },
      ]),
      context,
      new AbortController().signal,
    );
    expect(outcome).toEqual({ kind: 'change-scene', sceneId: 'forêt' });
    expect(log).toEqual(['texte:Avant', 'effectuée:Bagarre', 'scène:forêt']);
  });

  it('Changer de scène vers une scène supprimée : pas de changement, action terminée (9.1.6, PRS-07)', async () => {
    const { log, context } = recorder({ sceneExists: false });
    const outcome = await runner.run(
      action([
        { id: 's', type: 'change-scene', sceneId: 'supprimée' },
        { id: 'b', type: 'add-text', text: 'Jamais' },
      ]),
      context,
      new AbortController().signal,
    );
    expect(outcome).toEqual({ kind: 'done' });
    expect(log).toEqual(['effectuée:Bagarre', 'scène:supprimée']);
  });

  it('une action effectuée peut être relancée : elle s’exécute de nouveau (9.1.7)', async () => {
    const { log, context } = recorder();
    const bagarre = action([{ id: 'a', type: 'add-text', text: 'Un' }]);
    await runner.run(bagarre, context, new AbortController().signal);
    await runner.run(bagarre, context, new AbortController().signal);
    expect(log).toEqual(['texte:Un', 'effectuée:Bagarre', 'texte:Un', 'effectuée:Bagarre']);
  });
});
