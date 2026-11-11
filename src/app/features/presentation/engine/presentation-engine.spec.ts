import { TestBed } from '@angular/core/testing';

import {
  aBattlemap,
  aProject,
  aScene,
  aSceneNode,
  aSoundNode,
  anAction,
} from '../../../../testing/data-builders';
import { useFakeAudio } from '../../../../testing/fake-audio';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Action, ActionElement, Id, PlaySession } from '../../../core/models';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { ActionRunner } from './action-runner';
import { PlaySessionStore, newSceneState } from './play-session-store';
import { DISPLAY_GAP_MS, PresentationEngine } from './presentation-engine';

describe('PresentationEngine', () => {
  const audio = useFakeAudio();
  let engine: PresentationEngine;
  /** Pause entre éléments affichés : 0 sauf dans « espacement des éléments affichés ». */
  let displayGapMs = 0;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        PresentationEngine,
        { provide: DISPLAY_GAP_MS, useFactory: () => displayGapMs },
        ActionRunner,
        PlaySessionStore,
        ...useTestRepository(),
        ...audio.providers,
      ],
    });
    engine = TestBed.inject(PresentationEngine);
  });

  afterEach(() => engine.stop());

  const repository = () => TestBed.inject(DATA_REPOSITORY);
  const store = () => TestBed.inject(PlaySessionStore);
  const errors = () =>
    TestBed.inject(Notifications)
      .notifications()
      .map((n) => n.message);
  const feedTexts = () =>
    engine
      .feed()
      .map((item) => (item.type === 'battlemap' ? `[${item.battlemapId}]` : engine.textOf(item)));
  const text = (id: string, value: string): ActionElement => ({
    id,
    type: 'add-text',
    text: value,
  });
  const playSound = (id: string, soundId: string, volume = 0.5): ActionElement => ({
    id,
    type: 'play-sound',
    soundId,
    volume,
    loop: true,
    fadeInMs: 500,
    fadeOutMs: 2000,
  });
  const savedSession = async (): Promise<PlaySession | undefined> => {
    await store().flush();
    return repository().getPlaySession('p1');
  };

  /**
   * Projet « p1 » : scène A (première, battlemap par défaut b1, texte de scène + ambiance + une
   * action d'ouverture), scène B (texte de scène), et des sons dans les deux bibliothèques.
   */
  async function seed(extraActions: Action[] = []) {
    const project = aProject({ id: 'p1' });
    const a = aSceneNode('p1', { id: 'A', name: 'La taverne', order: 0 });
    const b = aSceneNode('p1', { id: 'B', name: 'La forêt', order: 1 });
    await repository().saveProject({ ...project, firstSceneId: 'A' });
    await repository().saveSceneNodes([a, b]);
    await repository().saveScene(
      aScene('p1', 'A', { defaultBattlemapId: 'b1', nextSceneIds: ['B'] }),
    );
    await repository().saveScene(aScene('p1', 'B'));
    await repository().saveBattlemap(aBattlemap('A', 'm1', { id: 'b1', name: 'Salle', order: 0 }));
    await repository().saveBattlemap(aBattlemap('A', 'm2', { id: 'b2', name: 'Étage', order: 1 }));
    await repository().saveSoundNodes([
      aSoundNode('p1', { id: 'taverne', name: 'Taverne', mediaId: 'son-taverne' }),
      aSoundNode('p1', { id: 'fantome', name: 'Supprimé', mediaId: 'absent-1' }),
      aSoundNode('global', { id: 'pluie', name: 'Pluie', mediaId: 'son-pluie' }),
    ]);
    const actions = [
      anAction('A', {
        id: 'ambiance',
        name: 'Ambiance',
        trigger: 'scene-open',
        order: 2,
        elements: [playSound('e-amb', 'taverne')],
      }),
      anAction('A', {
        id: 'texte-a',
        name: 'Texte de scène',
        trigger: 'scene-open',
        isSceneText: true,
        order: 1,
        elements: [text('t-a', 'Odeur de bière.')],
      }),
      anAction('B', {
        id: 'texte-b',
        name: 'Texte de scène',
        trigger: 'scene-open',
        isSceneText: true,
        elements: [text('t-b', 'Les arbres se resserrent.')],
      }),
      ...extraActions,
    ];
    for (const action of actions) {
      await repository().saveAction(action);
    }
  }

  async function startAt(sceneId: Id = 'A') {
    await engine.start('p1');
    await vi.waitFor(() => expect(engine.scene()?.id).toBe(sceneId));
  }

  describe('ouverture d’une scène (9.2.1, PRS-01)', () => {
    it('sans partie : première scène, battlemap par défaut, texte de scène puis actions d’ouverture', async () => {
      await seed();
      await startAt('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      expect(engine.status()).toBe('ready');
      expect(engine.sceneNode()?.name).toBe('La taverne');
      expect(engine.shownBattlemap()).toEqual({
        id: 'b1',
        battlemap: expect.objectContaining({ name: 'Salle' }),
      });
      expect(feedTexts()).toEqual(['Odeur de bière.']);
      expect([...engine.doneActionIds()].sort()).toEqual(['ambiance', 'texte-a']);
      expect(engine.sounds()[0]).toMatchObject({ soundId: 'taverne', volume: 0.5, paused: false });
      expect(engine.nextScenes().map((n) => n.name)).toEqual(['La forêt']);
    });

    it('enregistre la partie dès l’ouverture (9.3.1)', async () => {
      await seed();
      await startAt('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      const saved = await savedSession();
      expect(saved?.currentSceneId).toBe('A');
      expect(saved?.scenes['A']).toMatchObject({
        visited: true,
        currentBattlemapId: 'b1',
        playingSounds: [{ soundId: 'taverne', elementId: 'e-amb', paused: false, volume: 0.5 }],
      });
      expect(saved?.scenes['A'].feed).toHaveLength(1);
    });
  });

  describe('quitter et revenir (9.2.2, 9.2.3)', () => {
    it('quitter : actions interrompues, sons coupés en fondu, état de la scène conservé', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        await seed([
          anAction('A', {
            id: 'longue',
            name: 'Longue',
            elements: [{ id: 'w', type: 'wait', seconds: 60 }, text('t-jamais', 'Jamais')],
          }),
        ]);
        await startAt('A');
        await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
        const gain = audio.gains[0];
        void engine.runAction('longue');
        expect(engine.runningActionIds().has('longue')).toBe(true);

        await engine.openScene('B');
        expect(engine.runningActionIds().has('longue')).toBe(false);
        expect(engine.sounds()).toEqual([]);
        // Fondu de sortie de l'élément (2 s), puis arrêt.
        expect(gain.gain.ramps.at(-1)).toMatchObject({ target: 0, endTime: 2 });
        await vi.advanceTimersByTimeAsync(2000);
        expect(audio.released).toContain('son-taverne');
        expect(feedTexts()).toEqual(['Les arbres se resserrent.']);

        const saved = await savedSession();
        expect(saved?.currentSceneId).toBe('B');
        expect(saved?.scenes['A'].doneActionIds).not.toContain('longue');
        expect(saved?.scenes['A'].playingSounds).toEqual([
          { soundId: 'taverne', elementId: 'e-amb', paused: false, volume: 0.5 },
        ]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('revenir : état restauré sans relancer les actions d’ouverture, sons relancés (PRS-06)', async () => {
      await seed();
      await startAt('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      engine.setVolume('taverne', 0.2);
      engine.pauseSound('taverne');
      engine.showBattlemap('b2');
      await engine.openScene('B');
      const playsBefore = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;

      await engine.openScene('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      expect(feedTexts()).toEqual(['Odeur de bière.', '[b2]']);
      expect(engine.shownBattlemap()?.id).toBe('b2');
      expect(engine.sounds()[0]).toMatchObject({ soundId: 'taverne', paused: true, volume: 0.2 });
      // Relancé en pause : pas de lecture ; un nouvel <audio> repart du début.
      expect(vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length).toBe(playsBefore);
      expect(audio.elements.at(-1)?.currentTime).toBe(0);
    });
  });

  describe('battlemap (9.2.4)', () => {
    it('le sélecteur change la battlemap et ajoute une miniature au fil ; pas de doublon', async () => {
      await seed();
      await startAt('A');
      engine.showBattlemap('b2');
      engine.showBattlemap('b2');
      expect(engine.shownBattlemap()?.id).toBe('b2');
      expect(feedTexts()).toEqual(['Odeur de bière.', '[b2]']);
      expect(engine.focus()?.itemId).toBe(engine.feed()[1].id);
      expect((await savedSession())?.scenes['A'].currentBattlemapId).toBe('b2');
    });

    it('un élément « Afficher une battlemap » fait de même ; une battlemap supprimée est signalée', async () => {
      await seed([
        anAction('A', {
          id: 'carte',
          name: 'Carte',
          elements: [{ id: 'sb', type: 'show-battlemap', battlemapId: 'supprimée' }],
        }),
      ]);
      await startAt('A');
      await engine.runAction('carte');
      expect(engine.shownBattlemap()).toEqual({ id: 'supprimée', battlemap: null });
      expect(feedTexts()).toEqual(['Odeur de bière.', '[supprimée]']);
    });
  });

  describe('élément montré dans le fil : le premier de chaque salve', () => {
    const idOf = (value: string) => engine.feed().find((item) => engine.textOf(item) === value)?.id;

    it('à l’ouverture de la scène, le premier élément affiché, pas le dernier', async () => {
      await seed([
        anAction('A', {
          id: 'suite',
          name: 'Suite',
          trigger: 'scene-open',
          order: 3,
          elements: [text('t-1', 'Un.'), { id: 'sb', type: 'show-battlemap', battlemapId: 'b2' }],
        }),
      ]);
      await startAt('A');
      await vi.waitFor(() => expect(feedTexts()).toEqual(['Odeur de bière.', 'Un.', '[b2]']));
      expect(engine.focus()?.itemId).toBe(idOf('Odeur de bière.'));
    });

    it('après « Continuer » et après une attente, le premier élément qui suit', async () => {
      await seed([
        anAction('A', {
          id: 'suite',
          name: 'Suite',
          elements: [
            text('t-1', 'Un.'),
            text('t-2', 'Deux.'),
            { id: 'uc', type: 'user-click', text: 'Clic.' },
            text('t-3', 'Trois.'),
            text('t-4', 'Quatre.'),
            { id: 'w', type: 'wait', seconds: 0 },
            text('t-5', 'Cinq.'),
            text('t-6', 'Six.'),
          ],
        }),
      ]);
      await startAt('A');
      const run = engine.runAction('suite');
      await vi.waitFor(() => expect(idOf('Clic.')).toBeDefined());
      expect(engine.focus()?.itemId).toBe(idOf('Un.'));

      engine.continueClick(idOf('Clic.')!);
      await run;
      expect(feedTexts().at(-1)).toBe('Six.');
      expect(engine.focus()?.itemId).toBe(idOf('Cinq.'));
    });

    it('après « Continuer », le premier élément qui suit (avant l’attente)', async () => {
      await seed([
        anAction('A', {
          id: 'suite',
          name: 'Suite',
          elements: [
            { id: 'uc', type: 'user-click', text: 'Clic.' },
            text('t-3', 'Trois.'),
            text('t-4', 'Quatre.'),
            { id: 'w', type: 'wait', seconds: 60 },
          ],
        }),
      ]);
      await startAt('A');
      void engine.runAction('suite');
      await vi.waitFor(() => expect(idOf('Clic.')).toBeDefined());
      engine.continueClick(idOf('Clic.')!);
      await vi.waitFor(() => expect(engine.waits()).toHaveLength(1));
      expect(feedTexts().slice(-2)).toEqual(['Trois.', 'Quatre.']);
      expect(engine.focus()?.itemId).toBe(idOf('Trois.'));
      await engine.openScene('B');
    });
  });

  describe('espacement des éléments affichés', () => {
    beforeAll(() => (displayGapMs = 150));
    afterAll(() => (displayGapMs = 0));

    it('espace les éléments affichés, d’une action d’ouverture à l’autre ; pas les sons', async () => {
      await seed([
        anAction('A', {
          id: 'suite',
          name: 'Suite',
          trigger: 'scene-open',
          order: 3,
          elements: [text('t-1', 'Un.'), playSound('e-pluie', 'pluie'), text('t-2', 'Deux.')],
        }),
      ]);
      // Instant d'apparition de chaque texte, et du son « pluie ».
      const seen = new Map<string | null, number>();
      const poll = setInterval(() => {
        for (const value of [...feedTexts(), ...engine.sounds().map((s) => s.soundId)]) {
          if (!seen.has(value)) {
            seen.set(value, Date.now());
          }
        }
      }, 2);
      try {
        await startAt('A');
        await vi.waitFor(() => expect(seen.has('Deux.')).toBe(true));
      } finally {
        clearInterval(poll);
      }
      const at = (value: string) => seen.get(value)!;
      // Texte de scène → « Un. » (autre action d'ouverture) → « Deux. » : 150 ms d'écart.
      expect(at('Un.') - at('Odeur de bière.')).toBeGreaterThanOrEqual(140);
      expect(at('Deux.') - at('Un.')).toBeGreaterThanOrEqual(140);
      // Le son entre les deux n'attend pas : il part avec « Un. ».
      expect(at('pluie')).toBeLessThan(at('Deux.'));
    });

    it('pas de pause pour un élément affiché longtemps après le précédent', async () => {
      await seed([
        anAction('A', { id: 'garde', name: 'Le garde', elements: [text('t-g', 'Halte !')] }),
      ]);
      await startAt('A');
      await new Promise((resolve) => setTimeout(resolve, 200));
      void engine.runAction('garde');
      await Promise.resolve();
      expect(feedTexts()).toEqual(['Odeur de bière.', 'Halte !']);
    });
  });

  describe('actions manuelles (9.1.7, 9.2.5)', () => {
    it('effectuée puis relancée : pas de texte en double, le fil revient dessus', async () => {
      await seed([
        anAction('A', {
          id: 'garde',
          name: 'Le garde',
          order: 3,
          elements: [text('t-g', 'Halte !')],
        }),
      ]);
      await startAt('A');
      expect(engine.manualActions().map((m) => [m.action.name, m.done])).toEqual([
        ['Le garde', false],
      ]);
      await engine.runAction('garde');
      expect(engine.manualActions()[0].done).toBe(true);
      expect(feedTexts()).toEqual(['Odeur de bière.', 'Halte !']);

      const textId = engine.feed()[1].id;
      engine.showBattlemap('b2');
      await engine.runAction('garde');
      expect(feedTexts()).toEqual(['Odeur de bière.', 'Halte !', '[b2]']);
      expect(engine.focus()?.itemId).toBe(textId);
      expect((await savedSession())?.scenes['A'].doneActionIds).toContain('garde');
    });

    it('Clic de l’utilisateur : l’action attend « Continuer », le bloc est validé', async () => {
      await seed([
        anAction('A', {
          id: 'clic',
          name: 'Clic',
          elements: [
            { id: 'uc', type: 'user-click', text: 'Il approche.' },
            text('t-apres', 'Il parle.'),
          ],
        }),
      ]);
      await startAt('A');
      const run = engine.runAction('clic');
      await vi.waitFor(() => expect(engine.feed()).toHaveLength(2));
      const block = engine.feed()[1];
      expect(block).toMatchObject({ type: 'user-click', validated: false });
      expect(engine.textOf(block)).toBe('Il approche.');
      expect(engine.manualActions()[0].running).toBe(true);

      engine.continueClick(block.id);
      await run;
      expect(engine.feed()[1]).toMatchObject({ validated: true });
      expect(feedTexts()).toEqual(['Odeur de bière.', 'Il approche.', 'Il parle.']);
      expect(engine.manualActions()[0]).toMatchObject({ done: true, running: false });
      expect((await savedSession())?.scenes['A'].feed[1]).toMatchObject({ validated: true });
    });

    it('un clic en attente est retiré du fil si la scène est quittée', async () => {
      await seed([
        anAction('A', {
          id: 'clic',
          name: 'Clic',
          elements: [{ id: 'uc', type: 'user-click', text: 'Il approche.' }],
        }),
      ]);
      await startAt('A');
      void engine.runAction('clic');
      await vi.waitFor(() => expect(engine.feed()).toHaveLength(2));
      await engine.openScene('B');
      const saved = await savedSession();
      expect(saved?.scenes['A'].feed).toHaveLength(1);
      expect(saved?.scenes['A'].doneActionIds).not.toContain('clic');
    });
  });

  describe('Attendre : ligne du fil avec le temps restant', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }));
    afterEach(() => vi.useRealTimers());

    it('l’attente est listée pendant sa durée, puis retirée ; rien n’est enregistré', async () => {
      await seed([
        anAction('A', {
          id: 'pause',
          name: 'Pause',
          elements: [{ id: 'w', type: 'wait', seconds: 3 }, text('t-apres', 'Après.')],
        }),
      ]);
      await startAt('A');
      const start = Date.now();
      void engine.runAction('pause');
      await vi.waitFor(() => expect(engine.waits()).toHaveLength(1));
      expect(engine.waits()[0]).toMatchObject({ durationMs: 3000, endsAt: start + 3000 });

      await vi.advanceTimersByTimeAsync(3000);
      await vi.waitFor(() => expect(feedTexts()).toContain('Après.'));
      expect(engine.waits()).toEqual([]);
      expect(JSON.stringify(await savedSession())).not.toContain('wait');
    });

    it('scène quittée pendant l’attente : la ligne disparaît', async () => {
      await seed([
        anAction('A', {
          id: 'pause',
          name: 'Pause',
          elements: [{ id: 'w', type: 'wait', seconds: 60 }],
        }),
      ]);
      await startAt('A');
      void engine.runAction('pause');
      await vi.waitFor(() => expect(engine.waits()).toHaveLength(1));
      await engine.openScene('B');
      await vi.waitFor(() => expect(engine.waits()).toEqual([]));
    });
  });

  describe('fermeture brutale pendant un clic (12.1)', () => {
    const clic = () =>
      anAction('A', {
        id: 'clic',
        name: 'Clic',
        elements: [{ id: 'uc', type: 'user-click', text: 'Il approche.' }],
      });

    async function crashWhileWaiting(alreadyDone: boolean) {
      await seed([clic()]);
      await startAt('A');
      if (alreadyDone) {
        const first = engine.runAction('clic');
        await vi.waitFor(() => expect(engine.feed()).toHaveLength(2));
        engine.continueClick(engine.feed()[1].id);
        await first;
      }
      void engine.runAction('clic');
      await vi.waitFor(() => expect(engine.feed()[1]).toMatchObject({ validated: false }));
      // Partie enregistrée avec le bloc en attente, sans passer par stop() : navigateur fermé.
      const saved = (await savedSession())!;
      expect(saved.scenes['A'].feed[1]).toMatchObject({ validated: false });
      await engine.stop();
      await repository().savePlaySession(saved);
      await engine.load('p1');
      await engine.continueSession();
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('A'));
    }

    it('action jamais terminée : le bloc en attente est retiré, l’action reste à faire', async () => {
      await crashWhileWaiting(false);
      expect(feedTexts()).toEqual(['Odeur de bière.']);
      expect(engine.manualActions()[0].done).toBe(false);
    });

    it('relance interrompue d’une action terminée : le bloc reste, validé', async () => {
      await crashWhileWaiting(true);
      expect(feedTexts()).toEqual(['Odeur de bière.', 'Il approche.']);
      expect(engine.feed()[1]).toMatchObject({ validated: true });
      expect(engine.manualActions()[0].done).toBe(true);
    });
  });

  describe('changer de scène (9.1.6, 9.3.4)', () => {
    it('ouvre la scène cible ; les éléments suivants ne sont pas exécutés', async () => {
      await seed([
        anAction('A', {
          id: 'fuite',
          name: 'Fuite',
          elements: [{ id: 'cs', type: 'change-scene', sceneId: 'B' }, text('t-x', 'Jamais')],
        }),
      ]);
      await startAt('A');
      await engine.runAction('fuite');
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('B'));
      expect(feedTexts()).toEqual(['Les arbres se resserrent.']);
      expect((await savedSession())?.scenes['A'].doneActionIds).toContain('fuite');
    });

    it('scène cible supprimée : message d’erreur, pas de changement', async () => {
      await seed([
        anAction('A', {
          id: 'fuite',
          name: 'Fuite',
          elements: [{ id: 'cs', type: 'change-scene', sceneId: 'supprimée' }],
        }),
      ]);
      await startAt('A');
      await engine.runAction('fuite');
      expect(engine.scene()?.id).toBe('A');
      expect(errors()).toContain(
        'La scène cible de « Changer de scène » a été supprimée : la scène ne change pas.',
      );
    });
  });

  describe('sons (9.2.5, 9.3.4)', () => {
    it('lancer à la main, pause, volume, arrêt par élément, arrêter tout', async () => {
      await seed([
        anAction('A', {
          id: 'calme',
          name: 'Calme',
          elements: [{ id: 'ss', type: 'stop-sound', soundId: 'taverne' }],
        }),
        anAction('A', {
          id: 'silence',
          name: 'Silence',
          elements: [{ id: 'sa', type: 'stop-all-sounds' }],
        }),
      ]);
      await startAt('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      await engine.playLibrarySound('pluie');
      expect(engine.sounds().map((s) => s.soundId)).toEqual(['taverne', 'pluie']);
      await engine.togglePlayback();
      expect(engine.anyPlaying()).toBe(false);
      await engine.togglePlayback();
      expect(engine.anyPlaying()).toBe(true);

      await engine.runAction('calme');
      expect(engine.sounds().map((s) => s.soundId)).toEqual(['pluie']);
      expect((await savedSession())?.scenes['A'].playingSounds).toEqual([
        { soundId: 'pluie', elementId: null, paused: false, volume: 1 },
      ]);
      await engine.runAction('silence');
      expect(engine.sounds()).toEqual([]);
    });

    it('un son supprimé n’est pas lancé et un message s’affiche (PRS-07)', async () => {
      await seed([
        anAction('A', {
          id: 'fantomes',
          name: 'Fantômes',
          elements: [playSound('e-f', 'fantome'), playSound('e-g', 'inconnu'), text('t-f', 'Brr.')],
        }),
      ]);
      await startAt('A');
      await engine.runAction('fantomes');
      await vi.waitFor(() => expect(errors()).toHaveLength(2));
      expect(errors()[0]).toBe('Un son a été supprimé du projet : il n’est pas lancé.');
      expect(feedTexts()).toContain('Brr.');
      expect(engine.sounds().map((s) => s.soundId)).toEqual(['taverne']);
    });
  });

  describe('partie sauvegardée (9.3.2, 9.3.3, 9.3.4)', () => {
    async function previousGame() {
      await seed([
        anAction('B', {
          id: 'loup',
          name: 'Le loup',
          elements: [text('t-loup', 'Un loup hurle.')],
        }),
      ]);
      await startAt('A');
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      await engine.openScene('B');
      await engine.runAction('loup');
      await engine.playLibrarySound('pluie');
      engine.setVolume('pluie', 0.4);
      engine.pauseSound('pluie');
      await engine.stop();
      engine = TestBed.inject(PresentationEngine);
    }

    it('une partie existe : le MJ choisit (statut « choose »)', async () => {
      await previousGame();
      await engine.load('p1');
      expect(engine.status()).toBe('choose');
      expect(engine.savedSession()?.currentSceneId).toBe('B');
    });

    it('Continuer : dernière scène dans l’état exact, sons repris depuis le début (PRS-05)', async () => {
      await previousGame();
      await engine.load('p1');
      await engine.continueSession();
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      expect(engine.scene()?.id).toBe('B');
      expect(feedTexts()).toEqual(['Les arbres se resserrent.', 'Un loup hurle.']);
      expect(engine.manualActions()[0].done).toBe(true);
      expect(engine.sounds()[0]).toMatchObject({ soundId: 'pluie', paused: true, volume: 0.4 });
    });

    it('Recommencer : partie effacée, retour à la première scène (PRS-03)', async () => {
      await previousGame();
      await engine.load('p1');
      await engine.restart();
      await vi.waitFor(() => expect(engine.sounds()).toHaveLength(1));
      expect(engine.scene()?.id).toBe('A');
      const saved = await savedSession();
      expect(Object.keys(saved?.scenes ?? {})).toEqual(['A']);
      expect(saved?.currentSceneId).toBe('A');
    });

    it('éléments supprimés depuis : textes masqués, scène courante supprimée → première scène', async () => {
      await previousGame();
      await repository().deleteAction('loup');
      await engine.load('p1');
      await engine.continueSession();
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('B'));
      expect(feedTexts()).toEqual(['Les arbres se resserrent.']);

      await engine.stop();
      await repository().deleteSceneNode('B');
      engine = TestBed.inject(PresentationEngine);
      await engine.load('p1');
      await engine.continueSession();
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('A'));
    });
  });

  describe('mode démo', () => {
    it('commence à la scène demandée, sans lire ni modifier la partie sauvegardée', async () => {
      await seed();
      // Partie sauvegardée : scène B déjà visitée, texte déjà affiché.
      const before: PlaySession = {
        projectId: 'p1',
        currentSceneId: 'A',
        scenes: { B: { ...newSceneState(null), doneActionIds: ['texte-b'] } },
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      await repository().savePlaySession(before);
      const save = vi.spyOn(repository(), 'savePlaySession');
      const remove = vi.spyOn(repository(), 'deletePlaySession');

      await engine.startDemo('p1', 'B');
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('B'));
      expect(engine.demo()).toBe(true);
      expect(engine.savedSession()).toBeNull();
      // Scène jamais visitée pour la démo : son texte d'ouverture est rejoué.
      await vi.waitFor(() => expect(engine.feed().map((item) => item.type)).toContain('text'));
      await engine.openScene('A');
      await engine.stop();
      await TestBed.inject(PlaySessionStore).flush();

      expect(save).not.toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      expect(await repository().getPlaySession('p1')).toEqual(before);
    });

    it('scène inconnue : commence à la première scène', async () => {
      await seed();
      await engine.startDemo('p1', 'absente');
      await vi.waitFor(() => expect(engine.scene()?.id).toBe('A'));
      await engine.stop();
    });
  });

  it('signale un projet introuvable ou sans scène', async () => {
    await engine.start('absent');
    expect(engine.status()).toBe('missing');
    await repository().saveProject(aProject({ id: 'vide' }));
    await engine.start('vide');
    expect(engine.status()).toBe('no-scene');
  });
});
