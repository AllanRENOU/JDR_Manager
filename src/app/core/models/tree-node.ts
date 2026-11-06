import { Id } from './id';

/** Type de nœud : dossier ou élément (scène, son). */
export type TreeNodeKind = 'folder' | 'item';

/** Nœud d'arborescence commun aux scènes et aux sons (TRD §3, §8). */
export interface TreeNode {
  id: Id;
  /** `null` = nœud à la racine. */
  parentId: Id | null;
  /** Position parmi les frères (croissante). */
  order: number;
  kind: TreeNodeKind;
  name: string;
}
