import { elementProblem } from './element-validation';

describe('elementProblem', () => {
  it('exige une cible choisie pour la battlemap, les sons et le changement de scène', () => {
    expect(elementProblem({ id: 'e', type: 'show-battlemap', battlemapId: '' })).toBe(
      'action.form.battlemapRequired',
    );
    expect(
      elementProblem({
        id: 'e',
        type: 'play-sound',
        soundId: '',
        volume: 1,
        loop: false,
        fadeInMs: 0,
        fadeOutMs: 0,
      }),
    ).toBe('action.form.soundRequired');
    expect(elementProblem({ id: 'e', type: 'stop-sound', soundId: '' })).toBe(
      'action.form.soundRequired',
    );
    expect(elementProblem({ id: 'e', type: 'change-scene', sceneId: '' })).toBe(
      'action.form.sceneRequired',
    );
  });

  it('une cible supprimée n’est pas bloquante (signalée, PRS-07)', () => {
    expect(elementProblem({ id: 'e', type: 'change-scene', sceneId: 'supprimée' })).toBeNull();
    expect(elementProblem({ id: 'e', type: 'stop-sound', soundId: 'supprimé' })).toBeNull();
  });

  it('exige le texte du clic et une durée d’attente positive', () => {
    expect(elementProblem({ id: 'e', type: 'user-click', text: '  ' })).toBe(
      'action.form.clickTextRequired',
    );
    expect(elementProblem({ id: 'e', type: 'user-click', text: 'Ok' })).toBeNull();
    expect(elementProblem({ id: 'e', type: 'wait', seconds: 0 })).toBe(
      'action.form.durationInvalid',
    );
    expect(elementProblem({ id: 'e', type: 'wait', seconds: 2 })).toBeNull();
  });

  it('les autres éléments sont toujours valides', () => {
    expect(elementProblem({ id: 'e', type: 'stop-all-sounds' })).toBeNull();
    expect(elementProblem({ id: 'e', type: 'add-text', text: '' })).toBeNull();
  });
});
