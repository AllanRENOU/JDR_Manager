import { Id } from './id';

/** Champs communs à tous les éléments d'action. */
interface BaseElement {
  id: Id;
}

/** Affiche une battlemap de la scène (écran du MJ et fenêtre joueurs). */
export interface ShowBattlemapElement extends BaseElement {
  type: 'show-battlemap';
  battlemapId: Id;
}

/** Lance un son. Le paramétrage audio est porté par l'élément, pas par le son (spécifications §3). */
export interface PlaySoundElement extends BaseElement {
  type: 'play-sound';
  /** Id du `SoundNode` (bibliothèque globale ou du projet). */
  soundId: Id;
  /** Volume de 0 à 1. */
  volume: number;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
}

/** Arrête un son en cours. */
export interface StopSoundElement extends BaseElement {
  type: 'stop-sound';
  soundId: Id;
}

/** Arrête tous les sons en cours. */
export interface StopAllSoundsElement extends BaseElement {
  type: 'stop-all-sounds';
}

/** Ajoute un texte au fil d'actualité. */
export interface AddTextElement extends BaseElement {
  type: 'add-text';
  text: string;
}

/** Ouvre une autre scène. */
export interface ChangeSceneElement extends BaseElement {
  type: 'change-scene';
  sceneId: Id;
}

/** Attend avant l'élément suivant. */
export interface WaitElement extends BaseElement {
  type: 'wait';
  seconds: number;
  /**
   * Texte facultatif, montré sur la ligne de l'attente dans l'éditeur et pendant l'attente en
   * Présentation (rien n'est ajouté au fil). Absent ou vide : pas de texte.
   */
  text?: string;
}

/**
 * Rend visibles, dans la liste des actions de la Présentation, des actions « au clic du MJ » de la
 * même scène : masquées par leur propriété `hidden` ou parce qu'elles sont terminées (ACT-12).
 */
export interface ShowActionElement extends BaseElement {
  type: 'show-action';
  /** Ids d'actions de la même scène, dans l'ordre de la scène (au moins une si valide). */
  actionIds: Id[];
}

/**
 * Masque, dans la liste des actions de la Présentation, des actions « au clic du MJ » de la même
 * scène, comme des actions masquées au départ ; une action en cours d'exécution se termine
 * normalement. « Afficher l'action » les rend de nouveau visibles.
 */
export interface HideActionElement extends BaseElement {
  type: 'hide-action';
  /** Ids d'actions de la même scène ; vide si `all`. */
  actionIds: Id[];
  /** Masque toutes les actions « au clic du MJ » de la scène (aucune action à choisir). */
  all?: boolean;
}

/** Affiche un texte et attend le clic « Cliquer pour continuer ». */
export interface UserClickElement extends BaseElement {
  type: 'user-click';
  text: string;
}

/** Élément d'une action : union discriminée sur `type` (TRD §3). */
export type ActionElement =
  | ShowBattlemapElement
  | PlaySoundElement
  | StopSoundElement
  | StopAllSoundsElement
  | AddTextElement
  | ChangeSceneElement
  | WaitElement
  | UserClickElement
  | ShowActionElement
  | HideActionElement;

/** Type d'élément d'action. */
export type ActionElementType = ActionElement['type'];

/** Liste ordonnée des types d'éléments (menu « Ajouter un élément »). */
export const ACTION_ELEMENT_TYPES: readonly ActionElementType[] = [
  'add-text',
  'show-battlemap',
  'play-sound',
  'stop-sound',
  'stop-all-sounds',
  'wait',
  'user-click',
  'change-scene',
  'show-action',
  'hide-action',
];
