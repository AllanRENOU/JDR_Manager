import { Id } from './id';

/** Fichier importé (image ou son), stocké en `Blob` natif (TEC-30, TEC-31). */
export interface Media {
  id: Id;
  blob: Blob;
  mimeType: string;
  /** Taille en octets. */
  size: number;
  /** Nom du fichier d'origine (affichage, export). */
  fileName: string;
  /** Durée d'un son en millisecondes, lue à l'import ; absente si elle n'a pas pu être lue. */
  durationMs?: number;
}

/** Informations d'un média sans son contenu (tableau des sons, SON-03). */
export type MediaInfo = Omit<Media, 'blob'>;
