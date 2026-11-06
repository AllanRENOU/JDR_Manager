import { Id } from './id';

/** Texte ajouté au fil par un élément `add-text` ; le texte est relu dans l'action. */
export interface TextFeedItem {
  id: Id;
  type: 'text';
  actionId: Id;
  elementId: Id;
}

/** Miniature de battlemap dans le fil. */
export interface BattlemapFeedItem {
  id: Id;
  type: 'battlemap';
  battlemapId: Id;
}

/** Bloc « Clic de l'utilisateur » ; `validated` passe à `true` après le clic. */
export interface UserClickFeedItem {
  id: Id;
  type: 'user-click';
  actionId: Id;
  elementId: Id;
  validated: boolean;
}

/**
 * Entrée du fil d'actualité. Seules des références sont stockées : une action ou une battlemap
 * supprimée est détectée à l'affichage (PRD PRS-07).
 */
export type FeedItem = TextFeedItem | BattlemapFeedItem | UserClickFeedItem;
