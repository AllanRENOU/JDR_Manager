import { Action, ActionElement, Battlemap, Id, SceneNode, SoundNode } from '../../core/models';

/** Données nécessaires pour nommer ce que vise un élément. */
export interface SummaryContext {
  soundNames: Readonly<Record<Id, string>>;
  /** Bibliothèques de sons (projet et globale) : choix d'un son dans l'éditeur d'action. */
  soundNodes?: readonly SoundNode[];
  battlemaps: readonly Battlemap[];
  sceneNodes: readonly SceneNode[];
  /** Actions de la scène : cible de « Afficher l'action » et « Masquer l'action » (ACT-12). */
  actions?: readonly Action[];
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
    case 'show-action':
    case 'hide-action': {
      if (element.type === 'hide-action' && element.all) {
        return { key: 'action.summary.hideAllActions', params: {}, missing: false };
      }
      const target = context.actions?.find((a) => a.id === element.actionId);
      const verb = element.type === 'show-action' ? 'showAction' : 'hideAction';
      return target
        ? { key: `action.summary.${verb}`, params: { name: target.name }, missing: false }
        : { key: `action.summary.${verb}Missing`, params: {}, missing: true };
    }
  }
}

/** Vrai si un élément de l'action vise un objet supprimé (signalé à l'écran, PRS-07). */
export function hasMissingTarget(action: Action, context: SummaryContext): boolean {
  return action.elements.some((e) => summarizeElement(e, context).missing);
}

/**
 * Détail d'un élément replié dans l'éditeur d'action (maquette « Édition — action ») :
 * texte saisi, nom de la cible, durée. `key` est une clé de traduction, sauf si `raw` est fourni.
 */
export interface ElementDetail {
  /** Texte à afficher tel quel (texte saisi, nom d'une cible). */
  raw?: string;
  key?: string;
  params?: Record<string, string | number>;
  /** Cible choisie mais introuvable, ou pas encore choisie. */
  missing: boolean;
}

export function describeElement(element: ActionElement, context: SummaryContext): ElementDetail {
  switch (element.type) {
    case 'add-text':
    case 'user-click':
      return element.text.trim()
        ? { raw: element.text, missing: false }
        : { key: 'action.detail.noText', missing: true };
    case 'play-sound':
    case 'stop-sound':
      return target(element.soundId, context.soundNames[element.soundId]);
    case 'show-battlemap':
      return target(
        element.battlemapId,
        context.battlemaps.find((b) => b.id === element.battlemapId)?.name,
      );
    case 'change-scene':
      return target(
        element.sceneId,
        context.sceneNodes.find((n) => n.id === element.sceneId && n.kind === 'item')?.name,
      );
    case 'wait':
      return { key: 'action.detail.seconds', params: { count: element.seconds }, missing: false };
    case 'show-action':
    case 'hide-action':
      if (element.type === 'hide-action' && element.all) {
        return { key: 'action.detail.allActions', missing: false };
      }
      return target(
        element.actionId,
        context.actions?.find((a) => a.id === element.actionId)?.name,
      );
    case 'stop-all-sounds':
      return { missing: false };
  }
}

function target(id: Id, name: string | undefined): ElementDetail {
  if (!id) {
    return { key: 'action.detail.notChosen', missing: true };
  }
  return name ? { raw: name, missing: false } : { key: 'action.detail.deleted', missing: true };
}
