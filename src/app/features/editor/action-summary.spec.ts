import { aBattlemap, aSceneNode, anAction } from '../../../testing/data-builders';
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
    soundNames: { rain: 'Pluie' },
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

  it('« Afficher l’action » : nom de l’action visée, ou action supprimée (ACT-12, PRS-07)', () => {
    const withActions: SummaryContext = {
      ...context,
      actions: [anAction('s1', { id: 'fuite', name: 'La fuite' })],
    };
    expect(
      summarizeElement({ id: 'e', type: 'show-action', actionId: 'fuite' }, withActions),
    ).toEqual({ key: 'action.summary.showAction', params: { name: 'La fuite' }, missing: false });
    expect(
      summarizeElement({ id: 'e', type: 'show-action', actionId: 'absente' }, withActions),
    ).toMatchObject({ key: 'action.summary.showActionMissing', missing: true });
    expect(
      describeElement({ id: 'e', type: 'show-action', actionId: 'fuite' }, withActions),
    ).toEqual({ raw: 'La fuite', missing: false });
    expect(describeElement({ id: 'e', type: 'show-action', actionId: '' }, withActions)).toEqual({
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
      summarizeElement({ id: 'e', type: 'hide-action', actionId: 'fuite' }, withActions),
    ).toEqual({ key: 'action.summary.hideAction', params: { name: 'La fuite' }, missing: false });
    expect(
      summarizeElement({ id: 'e', type: 'hide-action', actionId: 'absente' }, withActions),
    ).toMatchObject({ key: 'action.summary.hideActionMissing', missing: true });
    expect(
      describeElement({ id: 'e', type: 'hide-action', actionId: 'fuite' }, withActions),
    ).toEqual({ raw: 'La fuite', missing: false });
  });

  it('« Masquer toutes les actions » : aucune cible, jamais signalé', () => {
    const element = { id: 'e', type: 'hide-action' as const, actionId: '', all: true };
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
