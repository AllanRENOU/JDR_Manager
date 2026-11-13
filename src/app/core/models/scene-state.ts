import { FeedItem } from './feed-item';
import { Id } from './id';

/** Son en cours de lecture dans une scène, tel qu'il doit être restauré à la reprise (PRS-04). */
export interface PlayingSound {
  soundId: Id;
  /** Élément `play-sound` qui porte les paramètres de lecture ; `null` = lancé à la main par le MJ. */
  elementId: Id | null;
  paused: boolean;
  /** Volume réglé en direct par le MJ (0 à 1). */
  volume: number;
}

/** État d'une scène dans la partie sauvegardée. */
export interface SceneState {
  visited: boolean;
  doneActionIds: Id[];
  /**
   * Actions masquées au départ (`Action.hidden`) rendues visibles par « Afficher l'action »
   * (ACT-12). Absent dans les parties enregistrées avant cette propriété.
   */
  shownActionIds?: Id[];
  /**
   * Actions masquées par « Masquer l'action » ; « Afficher l'action » les en retire. Absent dans
   * les parties enregistrées avant cette propriété.
   */
  hiddenActionIds?: Id[];
  currentBattlemapId: Id | null;
  playingSounds: PlayingSound[];
  feed: FeedItem[];
}
