import { GLOBAL_SOUND_LIBRARY, Id, SoundNode, TreeNode } from '../../core/models';
import { pathTo } from '../tree/tree-model';

/** Noms affichés des deux bibliothèques (déjà traduits). */
export interface LibraryNames {
  project: string;
  global: string;
}

const rootId = (libraryId: string) => `library:${libraryId}`;

/**
 * Arborescence proposée pour choisir un son (ACT-05, ACT-06) : la bibliothèque du projet puis la
 * globale, chacune sous un dossier racine qui porte son nom.
 */
export function soundChoiceNodes(
  sounds: readonly SoundNode[],
  projectId: Id,
  names: LibraryNames,
): TreeNode[] {
  const libraries = [projectId, GLOBAL_SOUND_LIBRARY];
  const roots: TreeNode[] = libraries.map((libraryId, order) => ({
    id: rootId(libraryId),
    parentId: null,
    order,
    kind: 'folder',
    name: libraryId === GLOBAL_SOUND_LIBRARY ? names.global : names.project,
  }));
  const nodes = sounds
    .filter((n) => libraries.includes(n.libraryId))
    .map<TreeNode>((n) => ({
      id: n.id,
      parentId: n.parentId ?? rootId(n.libraryId),
      order: n.order,
      kind: n.kind,
      name: n.name,
    }));
  return [...roots, ...nodes];
}

/** Emplacement d'un son : « Ce projet › Ambiances › Taverne animée » ; `null` s'il n'existe plus. */
export function soundPath(
  soundId: Id,
  sounds: readonly SoundNode[],
  names: LibraryNames,
): string | null {
  const sound = sounds.find((n) => n.id === soundId && n.kind === 'item');
  if (!sound) {
    return null;
  }
  const library = sound.libraryId === GLOBAL_SOUND_LIBRARY ? names.global : names.project;
  const inLibrary = sounds.filter((n) => n.libraryId === sound.libraryId);
  return [library, ...pathTo(inLibrary, sound.id).map((n) => n.name)].join(' › ');
}
