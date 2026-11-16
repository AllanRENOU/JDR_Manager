import { Id } from './id';
import { TreeNode } from './tree-node';

/**
 * Nœud de l'arborescence des fiches d'un projet : dossier ou fiche (TEC-54). Le titre de la fiche
 * est `name` ; un nœud `item` a une `Sheet` de même `id`.
 */
export interface SheetNode extends TreeNode {
  projectId: Id;
}
