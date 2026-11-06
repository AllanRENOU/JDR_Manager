import { Action, ActionElement, Battlemap, Id, SceneNode } from '../../core/models';

/** Données nécessaires pour nommer ce que vise un élément. */
export interface SummaryContext {
  soundNames: Readonly<Record<Id, string>>;
  battlemaps: readonly Battlemap[];
  sceneNodes: readonly SceneNode[];
}

/** Partie de résumé d'un élément : clé de traduction et paramètres ; `missing` = cible supprimée (PRS-07). */
export interface ElementSummary {
  key: string;
  params: Record<string, string | number>;
  missing: boolean;
}

/** Résumé d'un élément d'action, pour la liste des actions (« lancer « Taverne animée » »). */
export function summarizeElement(element: ActionElement, context: SummaryContext): ElementSummary {
  const sound = (id: Id) => context.soundNames[id];
  switch (element.type) {
    case 'add-text':
      return { key: 'action.summary.text', params: {}, missing: false };
    case 'play-sound':
    case 'stop-sound': {
      const name = sound(element.soundId);
      const verb = element.type === 'play-sound' ? 'play' : 'stop';
      return name
        ? { key: `action.summary.${verb}`, params: { name }, missing: false }
        : { key: `action.summary.${verb}Missing`, params: {}, missing: true };
    }
    case 'stop-all-sounds':
      return { key: 'action.summary.stopAll', params: {}, missing: false };
    case 'show-battlemap': {
      const map = context.battlemaps.find((b) => b.id === element.battlemapId);
      return map
        ? { key: 'action.summary.battlemap', params: { name: map.name }, missing: false }
        : { key: 'action.summary.battlemapMissing', params: {}, missing: true };
    }
    case 'change-scene': {
      const scene = context.sceneNodes.find((n) => n.id === element.sceneId && n.kind === 'item');
      return scene
        ? { key: 'action.summary.scene', params: { name: scene.name }, missing: false }
        : { key: 'action.summary.sceneMissing', params: {}, missing: true };
    }
    case 'wait':
      return { key: 'action.summary.wait', params: { seconds: element.seconds }, missing: false };
    case 'user-click':
      return { key: 'action.summary.click', params: {}, missing: false };
  }
}

/** Vrai si un élément de l'action vise un objet supprimé (signalé à l'écran, PRS-07). */
export function hasMissingTarget(action: Action, context: SummaryContext): boolean {
  return action.elements.some((e) => summarizeElement(e, context).missing);
}
