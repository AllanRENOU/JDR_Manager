import { Id } from './id';

/** Contenu d'une fiche du MJ ; `id` = id du `SheetNode` de type `item` (TEC-54, TRD §3). */
export interface Sheet {
  id: Id;
  projectId: Id;
  /** Texte Markdown (sans image). */
  text: string;
}
