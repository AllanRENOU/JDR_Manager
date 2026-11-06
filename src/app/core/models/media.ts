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
}
