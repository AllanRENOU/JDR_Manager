import { Id } from './id';
import { TreeNode } from './tree-node';

/** Bibliothèque de sons : la bibliothèque globale ou celle d'un projet (id du projet). */
export type SoundLibraryId = 'global' | Id;

/** Identifiant de la bibliothèque de sons globale, partagée entre les projets. */
export const GLOBAL_SOUND_LIBRARY = 'global';

/** Nœud d'une bibliothèque de sons. Un nœud `item` référence un fichier son. */
export interface SoundNode extends TreeNode {
  libraryId: SoundLibraryId;
  /** Présent si `kind` = `item`. */
  mediaId?: Id;
}
