import { ActionElement } from '../../core/models';

/**
 * Problème bloquant d'un élément avant l'enregistrement de l'action (8.4.1), sous forme de clé
 * de traduction ; `null` : élément valide.
 *
 * Une cible **supprimée** (son, battlemap, scène) n'est pas bloquante : elle est signalée à
 * l'écran (PRS-07). Seule une cible jamais choisie l'est.
 */
export function elementProblem(element: ActionElement): string | null {
  switch (element.type) {
    case 'show-battlemap':
      return element.battlemapId ? null : 'action.form.battlemapRequired';
    case 'play-sound':
    case 'stop-sound':
      return element.soundId ? null : 'action.form.soundRequired';
    case 'change-scene':
      return element.sceneId ? null : 'action.form.sceneRequired';
    case 'show-action':
      return element.actionId ? null : 'action.form.actionRequired';
    case 'hide-action':
      return element.all || element.actionId ? null : 'action.form.hideActionRequired';
    case 'user-click':
      return element.text.trim() ? null : 'action.form.clickTextRequired';
    case 'wait':
      return element.seconds > 0 ? null : 'action.form.durationInvalid';
    default:
      return null;
  }
}
