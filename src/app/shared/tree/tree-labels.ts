/**
 * Libellés de l'arborescence : clés de traduction Transloco. Le parent remplace celles qu'il veut
 * (ex. `newItem: 'scene.new'`) ; les autres gardent les valeurs génériques de `tree.*`.
 * Paramètres disponibles : `{{ name }}` (nom du nœud), `{{ count }}` (nombre de descendants).
 */
export interface TreeLabels {
  /** « Nouvel élément » (menu, et nom proposé à la création). */
  newItem: string;
  /** « Nouveau dossier » / « Nouveau sous-dossier ». */
  newFolder: string;
  newSubfolder: string;
  rename: string;
  delete: string;
  /** Titre de la confirmation de suppression. */
  deleteTitle: string;
  /** Message de confirmation pour un élément. */
  deleteItemMessage: string;
  /** Message de confirmation pour un dossier : précise que le contenu sera supprimé. */
  deleteFolderMessage: string;
  /** Libellé d'accessibilité du bouton « ⋯ ». */
  moreActions: string;
  /** Libellé d'accessibilité du champ de renommage. */
  renameField: string;
  /** Mention en italique d'un élément non sélectionnable, ex. « scène actuelle ». */
  disabled: string;
}

export const DEFAULT_TREE_LABELS: TreeLabels = {
  newItem: 'tree.newItem',
  newFolder: 'tree.newFolder',
  newSubfolder: 'tree.newSubfolder',
  rename: 'tree.rename',
  delete: 'tree.delete',
  deleteTitle: 'tree.deleteTitle',
  deleteItemMessage: 'tree.deleteItemMessage',
  deleteFolderMessage: 'tree.deleteFolderMessage',
  moreActions: 'tree.moreActions',
  renameField: 'tree.renameField',
  disabled: 'tree.disabled',
};
