import { Id, TreeNode } from '../../core/models';

/** Ligne visible de l'arborescence (liste aplatie, dans l'ordre d'affichage). */
export interface TreeRow<T extends TreeNode> {
  node: T;
  /** Profondeur : 0 = racine. */
  depth: number;
  /** Dossier contenant au moins un nœud. */
  hasChildren: boolean;
  expanded: boolean;
  /** Identifiants des ancêtres, du parent direct à la racine. */
  ancestors: Id[];
}

/** Regroupe les nœuds par parent, triés par `order` puis par nom. */
export function groupByParent<T extends TreeNode>(nodes: readonly T[]): Map<Id | null, T[]> {
  const ids = new Set(nodes.map((n) => n.id));
  const groups = new Map<Id | null, T[]>();
  for (const node of nodes) {
    // Un parent introuvable (donnée incohérente) ramène le nœud à la racine plutôt que de le perdre.
    const parentId = node.parentId !== null && ids.has(node.parentId) ? node.parentId : null;
    groups.set(parentId, [...(groups.get(parentId) ?? []), node]);
  }
  for (const children of groups.values()) {
    children.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fr'));
  }
  return groups;
}

/**
 * Construit la liste des lignes visibles à partir de la liste plate (TRD §8) : les enfants d'un
 * dossier replié ne sont pas affichés.
 */
export function visibleRows<T extends TreeNode>(
  nodes: readonly T[],
  collapsed: ReadonlySet<Id>,
): TreeRow<T>[] {
  const groups = groupByParent(nodes);
  const rows: TreeRow<T>[] = [];
  const visit = (parentId: Id | null, depth: number, ancestors: Id[]) => {
    for (const node of groups.get(parentId) ?? []) {
      const children = groups.get(node.id) ?? [];
      const expanded = node.kind === 'folder' && !collapsed.has(node.id);
      rows.push({ node, depth, hasChildren: children.length > 0, expanded, ancestors });
      if (expanded) {
        visit(node.id, depth + 1, [node.id, ...ancestors]);
      }
    }
  };
  visit(null, 0, []);
  return rows;
}

/** Identifiants de tous les descendants d'un nœud (sans le nœud lui-même). */
export function descendantIds<T extends TreeNode>(nodes: readonly T[], id: Id): Set<Id> {
  const groups = groupByParent(nodes);
  const result = new Set<Id>();
  const stack = [...(groups.get(id) ?? [])];
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.add(node.id);
    stack.push(...(groups.get(node.id) ?? []));
  }
  return result;
}

/** Chemin d'un nœud, de la racine au nœud (ex. pour « Ce projet › Ambiances › Taverne »). */
export function pathTo<T extends TreeNode>(nodes: readonly T[], id: Id): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: T[] = [];
  let current = byId.get(id);
  while (current && !path.includes(current)) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

/** Où déposer un nœud glissé : avant / après une ligne, dans un dossier, ou à la fin de la racine. */
export type TreeDropTarget =
  { position: 'before' | 'after' | 'inside'; id: Id } | { position: 'root-end' };

/** Déplacement demandé : nouveau parent et position parmi les nouveaux frères. */
export interface TreeMoveEvent {
  id: Id;
  parentId: Id | null;
  /** Position (0 = premier) parmi les frères, sans compter le nœud déplacé. */
  order: number;
}

/**
 * Traduit une cible de dépôt en déplacement. Renvoie `null` si le dépôt est impossible
 * (dans lui-même ou un de ses descendants, dans un élément) ou ne change rien.
 */
export function computeMove<T extends TreeNode>(
  nodes: readonly T[],
  draggedId: Id,
  target: TreeDropTarget,
): TreeMoveEvent | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const dragged = byId.get(draggedId);
  if (!dragged) {
    return null;
  }
  const forbidden = descendantIds(nodes, draggedId).add(draggedId);
  const siblingsOf = (parentId: Id | null) =>
    (groupByParent(nodes).get(parentId) ?? []).filter((n) => n.id !== draggedId);

  let move: TreeMoveEvent;
  if (target.position === 'root-end') {
    move = { id: draggedId, parentId: null, order: siblingsOf(null).length };
  } else {
    const reference = byId.get(target.id);
    if (!reference || forbidden.has(reference.id)) {
      return null;
    }
    if (target.position === 'inside') {
      if (reference.kind !== 'folder') {
        return null;
      }
      move = { id: draggedId, parentId: reference.id, order: siblingsOf(reference.id).length };
    } else {
      // Parent introuvable : le nœud de référence est affiché à la racine (cf. groupByParent).
      // Un parent interdit est impossible ici : la référence serait elle-même interdite.
      const parentId =
        reference.parentId !== null && byId.has(reference.parentId) ? reference.parentId : null;
      const index = siblingsOf(parentId).findIndex((n) => n.id === reference.id);
      move = { id: draggedId, parentId, order: index + (target.position === 'after' ? 1 : 0) };
    }
  }

  // Aucun changement : même parent, même rang.
  const currentParent =
    dragged.parentId !== null && byId.has(dragged.parentId) ? dragged.parentId : null;
  const currentIndex = (groupByParent(nodes).get(currentParent) ?? []).findIndex(
    (n) => n.id === draggedId,
  );
  if (move.parentId === currentParent && move.order === currentIndex) {
    return null;
  }
  return move;
}

/**
 * Applique un déplacement : renvoie les nœuds modifiés (le nœud déplacé et les frères dont
 * l'ordre change), à enregistrer par le parent (ex. `saveSceneNodes`).
 */
export function applyMove<T extends TreeNode>(nodes: readonly T[], move: TreeMoveEvent): T[] {
  const dragged = nodes.find((n) => n.id === move.id);
  if (!dragged) {
    return [];
  }
  const groups = groupByParent(nodes);
  const changed = new Map<Id, T>();
  const renumber = (siblings: T[]) =>
    siblings.forEach((node, order) => {
      if (node.order !== order || node.id === move.id) {
        changed.set(node.id, { ...node, order });
      }
    });

  const oldParent =
    dragged.parentId !== null && groups.has(dragged.parentId) ? dragged.parentId : null;
  const moved = { ...dragged, parentId: move.parentId } as T;
  const target = (groups.get(move.parentId) ?? []).filter((n) => n.id !== move.id);
  target.splice(Math.min(move.order, target.length), 0, moved);
  renumber(target);
  if (oldParent !== move.parentId) {
    renumber((groups.get(oldParent) ?? []).filter((n) => n.id !== move.id));
  }
  return [...changed.values()];
}

/** Texte normalisé pour la recherche : minuscules, sans accents. */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtre l'arborescence pour la recherche (fenêtre de sélection) : garde les nœuds dont le nom
 * contient le texte (sans tenir compte des accents ni des majuscules), leurs ancêtres pour
 * le contexte, et tout le contenu d'un dossier trouvé.
 */
export function filterNodes<T extends TreeNode>(nodes: readonly T[], query: string): T[] {
  const search = normalizeSearch(query);
  if (!search) {
    return [...nodes];
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kept = new Set<Id>();
  for (const node of nodes) {
    if (normalizeSearch(node.name).includes(search)) {
      kept.add(node.id);
      if (node.kind === 'folder') {
        descendantIds(nodes, node.id).forEach((id) => kept.add(id));
      }
      let parent = node.parentId ? byId.get(node.parentId) : undefined;
      while (parent && !kept.has(parent.id)) {
        kept.add(parent.id);
        parent = parent.parentId ? byId.get(parent.parentId) : undefined;
      }
    }
  }
  return nodes.filter((n) => kept.has(n.id));
}
