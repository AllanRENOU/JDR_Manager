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

/**
 * Vidéo lancée dans la fenêtre joueurs (par une action ou à la main) : simple mention, sans
 * contrôle (décision d'Allan, 14/11/2026). La vidéo elle-même n'est pas enregistrée (TEC-48).
 */
export interface VideoFeedItem {
  id: Id;
  type: 'video';
  /** Nœud de bibliothèque de la vidéo ; son nom est relu à l'affichage. */
  videoId: Id;
}

/**
 * Fiche ouverte par un élément `show-sheet` : bloc cliquable qui la rouvre (FIL-11). Un seul bloc
 * par élément (pas de doublon à la relance) ; le titre est relu à l'affichage.
 */
export interface SheetFeedItem {
  id: Id;
  type: 'sheet';
  actionId: Id;
  elementId: Id;
  /** Nœud de la fiche ; fiche supprimée détectée à l'affichage (PRS-07). */
  sheetId: Id;
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
export type FeedItem =
  TextFeedItem | BattlemapFeedItem | UserClickFeedItem | VideoFeedItem | SheetFeedItem;
