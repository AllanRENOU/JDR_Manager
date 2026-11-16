import { aBattlemap, aSceneNode, aSheetNode, anAction } from '../../../testing/data-builders';
import {
  SummaryContext,
  describeElement,
  hasMissingTarget,
  summarizeElement,
} from './action-summary';

describe('summarizeElement', () => {
  const scene = aSceneNode('p1', { name: 'La lisière' });
  const map = aBattlemap('s1', 'm1', { name: 'Salle' });
  const context: SummaryContext = {
    soundNames: { rain: 'Pluie', intro: 'Intro' },
    battlemaps: [map],
    sceneNodes: [scene],
  };
  const play = (soundId: string) =>
    ({
      id: 'x',
      type: 'play-sound',
      soundId,
      volume: 1,
      loop: false,
      fadeInMs: 0,
      fadeOutMs: 0,
    }) as const;

  it('résume chaque type d’élément avec le nom de sa cible', () => {
    expect(summarizeElement({ id: 'a', type: 'add-text', text: 'x' }, context).key).toBe(
      'action.summary.text',
    );
    expect(summarizeElement(play('rain'), context)).toEqual({
      key: 'action.summary.play',
      params: { name: 'Pluie' },
      missing: false,
    });
    expect(
      summarizeElement({ id: 'b', type: 'show-battlemap', battlemapId: map.id }, context).params,
    ).toEqual({ name: 'Salle' });
    expect(
      summarizeElement({ id: 'c', type: 'change-scene', sceneId: scene.id }, context).params,
    ).toEqual({ name: 'La lisière' });
    expect(summarizeElement({ id: 'd', type: 'wait', seconds: 3 }, context).params).toEqual({
      seconds: 3,
    });
  });

  it('signale les cibles supprimées (PRS-07)', () => {
    expect(summarizeElement(play('absent'), context)).toMatchObject({
      key: 'action.summary.playMissing',
      missing: true,
    });
    expect(
      summarizeElement({ id: 'c', type: 'change-scene', sceneId: 'supprimée' }, context).missing,
    ).toBe(true);
    expect(hasMissingTarget(anAction('s1', { elements: [play('absent')] }), context)).toBe(true);
    expect(hasMissingTarget(anAction('s1'), context)).toBe(false);
  });

  it('« Lancer la vidéo » : nom de la vidéo, ou vidéo supprimée ; « Arrêter la vidéo » (ACT-14, ACT-15)', () => {
    const playVideo = (videoId: string) =>
      ({ id: 'v', type: 'play-video', videoId, volume: 1 }) as const;
    expect(summarizeElement(playVideo('intro'), context)).toEqual({
      key: 'action.summary.playVideo',
      params: { name: 'Intro' },
      missing: false,
    });
    expect(summarizeElement(playVideo('absente'), context)).toMatchObject({
      key: 'action.summary.playVideoMissing',
      missing: true,
    });
    expect(summarizeElement({ id: 's', type: 'stop-video' }, context)).toEqual({
      key: 'action.summary.stopVideo',
      params: {},
      missing: false,
    });
    expect(describeElement(playVideo('intro'), context)).toEqual({ raw: 'Intro', missing: false });
    expect(describeElement(playVideo(''), context)).toMatchObject({
      key: 'action.detail.notChosen',
      missing: true,
    });
    expect(describeElement(playVideo('absente'), context)).toMatchObject({
      key: 'action.detail.deleted',
      missing: true,
    });
    expect(describeElement({ id: 's', type: 'stop-video' }, context)).toEqual({ missing: false });
  });

  it('« Afficher l’action » : nom de l’action visée, ou action supprimée (ACT-12, PRS-07)', () => {
    const withActions: SummaryContext = {
      ...context,
      actions: [anAction('s1', { id: 'fuite', name: 'La fuite' })],
    };
    expect(
      summarizeElement({ id: 'e', type: 'show-action', actionIds: ['fuite'] }, withActions),
    ).toEqual({ key: 'action.summary.showAction', params: { name: 'La fuite' }, missing: false });
    expect(
      summarizeElement({ id: 'e', type: 'show-action', actionIds: ['absente'] }, withActions),
    ).toMatchObject({ key: 'action.summary.showActionMissing', missing: true });
    expect(
      describeElement({ id: 'e', type: 'show-action', actionIds: ['fuite'] }, withActions),
    ).toEqual({ raw: 'La fuite', missing: false });
    expect(describeElement({ id: 'e', type: 'show-action', actionIds: [] }, withActions)).toEqual({
      key: 'action.detail.notChosen',
      missing: true,
    });
  });

  it('« Masquer l’action » : nom de l’action visée, ou action supprimée (PRS-07)', () => {
    const withActions: SummaryContext = {
      ...context,
      actions: [anAction('s1', { id: 'fuite', name: 'La fuite' })],
    };
    expect(
      summarizeElement({ id: 'e', type: 'hide-action', actionIds: ['fuite'] }, withActions),
    ).toEqual({ key: 'action.summary.hideAction', params: { name: 'La fuite' }, missing: false });
    expect(
      summarizeElement({ id: 'e', type: 'hide-action', actionIds: ['absente'] }, withActions),
    ).toMatchObject({ key: 'action.summary.hideActionMissing', missing: true });
    expect(
      describeElement({ id: 'e', type: 'hide-action', actionIds: ['fuite'] }, withActions),
    ).toEqual({ raw: 'La fuite', missing: false });
  });

  it('« Afficher / Masquer l’action » vers plusieurs actions : nombre et noms, supprimée signalée', () => {
    const withActions: SummaryContext = {
      ...context,
      actions: [
        anAction('s1', { id: 'fuite', name: 'La fuite' }),
        anAction('s1', { id: 'garde', name: 'Le garde' }),
      ],
    };
    expect(
      summarizeElement(
        { id: 'e', type: 'hide-action', actionIds: ['fuite', 'garde'] },
        withActions,
      ),
    ).toEqual({ key: 'action.summary.hideActions', params: { count: 2 }, missing: false });
    expect(
      describeElement({ id: 'e', type: 'show-action', actionIds: ['fuite', 'garde'] }, withActions),
    ).toEqual({ raw: 'La fuite, Le garde', missing: false });
    const partial = { id: 'e', type: 'show-action' as const, actionIds: ['fuite', 'absente'] };
    expect(summarizeElement(partial, withActions)).toMatchObject({
      key: 'action.summary.showActionMissing',
      missing: true,
    });
    expect(describeElement(partial, withActions)).toEqual({ raw: 'La fuite', missing: true });
  });

  it('« Masquer toutes les actions » : aucune cible, jamais signalé', () => {
    const element = { id: 'e', type: 'hide-action' as const, actionIds: [], all: true };
    expect(summarizeElement(element, context)).toEqual({
      key: 'action.summary.hideAllActions',
      params: {},
      missing: false,
    });
    expect(describeElement(element, context)).toEqual({
      key: 'action.detail.allActions',
      missing: false,
    });
  });
});

describe('« Afficher une fiche » (ACT-16, PRS-07)', () => {
  const folder = aSheetNode('p1', { id: 'pnj', kind: 'folder', name: 'PNJ' });
  const garde = aSheetNode('p1', { id: 'garde', name: 'Garde', parentId: folder.id });
  const context: SummaryContext = {
    soundNames: {},
    battlemaps: [],
    sceneNodes: [],
    sheetNodes: [folder, garde],
  };
  const show = (sheetId: string) => ({ id: 'f', type: 'show-sheet', sheetId }) as const;

  it('résume avec le titre de la fiche, ou signale une fiche supprimée', () => {
    expect(summarizeElement(show('garde'), context)).toEqual({
      key: 'action.summary.sheet',
      params: { name: 'Garde' },
      missing: false,
    });
    expect(summarizeElement(show('supprimée'), context)).toMatchObject({
      key: 'action.summary.sheetMissing',
      missing: true,
    });
    // Un dossier n'est pas une fiche.
    expect(summarizeElement(show('pnj'), context).missing).toBe(true);
    expect(hasMissingTarget(anAction('s1', { elements: [show('supprimée')] }), context)).toBe(true);
  });

  it('détail replié : titre, « À choisir » ou « Supprimé »', () => {
    expect(describeElement(show('garde'), context)).toEqual({ raw: 'Garde', missing: false });
    expect(describeElement(show(''), context)).toMatchObject({
      key: 'action.detail.notChosen',
      missing: true,
    });
    expect(describeElement(show('supprimée'), context)).toMatchObject({
      key: 'action.detail.deleted',
      missing: true,
    });
  });
});
