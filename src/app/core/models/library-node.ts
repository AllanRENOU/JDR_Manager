import { Id } from './id';
import { TreeNode } from './tree-node';

/** Bibliothèque de sons et de vidéos : la bibliothèque globale ou celle d'un projet (id du projet). */
export type LibraryId = 'global' | Id;

/** Identifiant de la bibliothèque globale, partagée entre les projets. */
export const GLOBAL_LIBRARY = 'global';

/** Nature du fichier d'un élément de bibliothèque (VID-01). */
export type LibraryMediaKind = 'sound' | 'video';

/**
 * Nœud d'une bibliothèque : dossier, son ou vidéo (lot 12 ter : ex-`SoundNode`, store IndexedDB
 * `soundNodes` inchangé). Un nœud `item` référence un fichier son ou vidéo.
 */
export interface LibraryNode extends TreeNode {
  libraryId: LibraryId;
  /** Présent si `kind` = `item`. */
  mediaId?: Id;
  /**
   * Nature du fichier, posée à l'import si `kind` = `item`. Absente = `sound` (données d'avant le
   * lot 12 ter, pas de migration) : lire avec `mediaKindOf()`.
   */
  mediaKind?: LibraryMediaKind;
}

/** Nature du fichier d'un nœud de bibliothèque (`sound` si elle n'est pas renseignée). */
export function mediaKindOf(node: Pick<LibraryNode, 'mediaKind'>): LibraryMediaKind {
  return node.mediaKind ?? 'sound';
}
