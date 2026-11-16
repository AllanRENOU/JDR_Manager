import { Id, Sheet, SheetNode } from '../../core/models';
import { markdownToPlainText } from '../../shared/markdown/markdown-format';
import { filterNodes, normalizeSearch } from '../../shared/tree/tree-model';

/** Nombre de caractères gardés avant l'occurrence dans un extrait. */
export const EXCERPT_BEFORE = 40;
/** Longueur visée d'un extrait (avant les points de suspension). */
export const EXCERPT_LENGTH = 140;

/**
 * Extrait du texte d'une fiche, en texte brut. `match` est le passage trouvé (vide si la
 * recherche ne porte pas sur le texte) : l'écran peut le mettre en évidence sans `innerHTML`.
 */
export interface SheetExcerpt {
  before: string;
  match: string;
  after: string;
  /** Le texte continue avant `before` (points de suspension à afficher). */
  cutStart: boolean;
  /** Le texte continue après `after`. */
  cutEnd: boolean;
}

/** Fiche trouvée par `searchSheets`. */
export interface SheetSearchResult {
  node: SheetNode;
  /** Dossiers de la racine jusqu'à la fiche (exclue), pour afficher « A › B ». */
  folders: SheetNode[];
  /** Le titre contient la recherche. */
  titleMatch: boolean;
  /** Le texte contient la recherche. */
  textMatch: boolean;
  /** Passage du texte autour de la première occurrence, sinon début du texte ; `null` si texte vide. */
  excerpt: SheetExcerpt | null;
}

/**
 * Recherche des fiches sur leur titre et leur texte, sans tenir compte des accents ni de la
 * casse (FCH-06, TEC-55). Recherche vide : toutes les fiches.
 *
 * Ordre : fiches dont le titre correspond, puis celles trouvées par le texte seulement, chacune
 * dans l'ordre de l'arborescence.
 */
export function searchSheets(
  nodes: readonly SheetNode[],
  sheets: readonly Sheet[],
  query: string,
): SheetSearchResult[] {
  const search = normalizeSearch(query);
  const texts = new Map(sheets.map((s) => [s.id, s.text]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const titleResults: SheetSearchResult[] = [];
  const textResults: SheetSearchResult[] = [];

  for (const node of treeOrder(nodes)) {
    if (node.kind !== 'item') {
      continue;
    }
    const plain = markdownToPlainText(texts.get(node.id));
    const titleMatch = !search || normalizeSearch(node.name).includes(search);
    const found = search ? findNormalized(plain, search) : null;
    if (!titleMatch && !found) {
      continue;
    }
    const result: SheetSearchResult = {
      node,
      folders: foldersOf(node, byId),
      titleMatch,
      textMatch: found !== null,
      excerpt: excerptOf(plain, found),
    };
    (titleMatch ? titleResults : textResults).push(result);
  }
  return [...titleResults, ...textResults];
}

/**
 * Arborescence filtrée par la recherche de l'écran Fiches : comme `filterNodes` (titres des
 * fiches et noms des dossiers), plus les fiches trouvées par leur texte et leurs dossiers.
 */
export function filterSheetNodes(
  nodes: readonly SheetNode[],
  sheets: readonly Sheet[],
  query: string,
): SheetNode[] {
  if (!normalizeSearch(query)) {
    return [...nodes];
  }
  const kept = new Set(filterNodes(nodes, query).map((n) => n.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const { node } of searchSheets(nodes, sheets, query)) {
    kept.add(node.id);
    foldersOf(node, byId).forEach((folder) => kept.add(folder.id));
  }
  return nodes.filter((n) => kept.has(n.id));
}

/** Nœuds dans l'ordre d'affichage de l'arborescence (parcours en profondeur, par `order`). */
function treeOrder(nodes: readonly SheetNode[]): SheetNode[] {
  const children = new Map<Id | null, SheetNode[]>();
  for (const node of nodes) {
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  }
  const ids = new Set(nodes.map((n) => n.id));
  const roots = nodes.filter((n) => n.parentId === null || !ids.has(n.parentId));
  const result: SheetNode[] = [];
  const visited = new Set<Id>();
  const visit = (list: readonly SheetNode[]) => {
    for (const node of [...list].sort((a, b) => a.order - b.order)) {
      if (visited.has(node.id)) {
        continue; // données incohérentes (cycle) : chaque nœud une seule fois
      }
      visited.add(node.id);
      result.push(node);
      visit(children.get(node.id) ?? []);
    }
  };
  visit(roots);
  return result;
}

/** Dossiers parents d'un nœud, de la racine au plus proche. */
function foldersOf(node: SheetNode, byId: ReadonlyMap<Id, SheetNode>): SheetNode[] {
  const folders: SheetNode[] = [];
  let parent = node.parentId ? byId.get(node.parentId) : undefined;
  while (parent && !folders.includes(parent)) {
    folders.unshift(parent);
    parent = parent.parentId ? byId.get(parent.parentId) : undefined;
  }
  return folders;
}

/** Position `[début, fin[` dans `text` de la première occurrence de `search` (déjà normalisé). */
function findNormalized(text: string, search: string): [number, number] | null {
  // Texte normalisé caractère par caractère, avec la position d'origine de chaque caractère
  // produit : la normalisation (accents, casse) peut changer la longueur du texte.
  let normalized = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;
  for (const char of text) {
    const part = char
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    normalized += part;
    starts.push(...new Array<number>(part.length).fill(index));
    ends.push(...new Array<number>(part.length).fill(index + char.length));
    index += char.length;
  }
  const at = normalized.indexOf(search);
  if (at < 0) {
    return null;
  }
  return [starts[at], ends[at + search.length - 1]];
}

/** Extrait autour de l'occurrence trouvée, ou début du texte ; coupé sur des espaces. */
function excerptOf(text: string, found: [number, number] | null): SheetExcerpt | null {
  if (!text) {
    return null;
  }
  const [matchStart, matchEnd] = found ?? [0, 0];
  let start = Math.max(0, matchStart - EXCERPT_BEFORE);
  if (start > 0) {
    const space = text.indexOf(' ', start);
    start = space >= 0 && space < matchStart ? space + 1 : start;
  }
  let end = Math.min(text.length, Math.max(matchEnd, start + EXCERPT_LENGTH));
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    end = space > matchEnd ? space : end;
  }
  return {
    before: text.slice(start, matchStart),
    match: text.slice(matchStart, matchEnd),
    after: text.slice(matchEnd, end),
    cutStart: start > 0,
    cutEnd: end < text.length,
  };
}
