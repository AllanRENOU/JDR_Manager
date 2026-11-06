import { Id } from './id';
import { TreeNode } from './tree-node';

/** Nœud de l'arborescence des scènes d'un projet. Un nœud `item` a une `Scene` de même `id`. */
export interface SceneNode extends TreeNode {
  projectId: Id;
}
