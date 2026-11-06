import { TreeNode } from '../../core/models';
import {
  applyMove,
  computeMove,
  descendantIds,
  groupByParent,
  pathTo,
  visibleRows,
} from './tree-model';

function node(
  id: string,
  parentId: string | null,
  order: number,
  kind: 'folder' | 'item' = 'item',
): TreeNode {
  return { id, parentId, order, kind, name: id };
}

// acte1/ (scène b, sous-dossier/ (scène c)), scène a, orpheline (parent inconnu)
const nodes: TreeNode[] = [
  node('a', null, 1),
  node('acte1', null, 0, 'folder'),
  node('c', 'sous', 0),
  node('sous', 'acte1', 1, 'folder'),
  node('b', 'acte1', 0),
  node('vide', null, 2, 'folder'),
  node('orpheline', 'inconnu', 3),
];

describe('tree-model', () => {
  it('trie les frères par ordre et ramène un nœud orphelin à la racine', () => {
    expect(
      groupByParent(nodes)
        .get(null)
        ?.map((n) => n.id),
    ).toEqual(['acte1', 'a', 'vide', 'orpheline']);
  });

  it('aplatit l’arbre dans l’ordre d’affichage avec profondeur et ancêtres', () => {
    const rows = visibleRows(nodes, new Set());
    expect(rows.map((r) => `${'  '.repeat(r.depth)}${r.node.id}`)).toEqual([
      'acte1',
      '  b',
      '  sous',
      '    c',
      'a',
      'vide',
      'orpheline',
    ]);
    const c = rows.find((r) => r.node.id === 'c')!;
    expect(c.ancestors).toEqual(['sous', 'acte1']);
    expect(rows.find((r) => r.node.id === 'acte1')).toMatchObject({
      hasChildren: true,
      expanded: true,
    });
    expect(rows.find((r) => r.node.id === 'vide')).toMatchObject({
      hasChildren: false,
      expanded: true,
    });
    expect(rows.find((r) => r.node.id === 'a')?.expanded).toBe(false);
  });

  it('masque le contenu d’un dossier replié', () => {
    const rows = visibleRows(nodes, new Set(['acte1']));
    expect(rows.map((r) => r.node.id)).toEqual(['acte1', 'a', 'vide', 'orpheline']);
    expect(rows[0].expanded).toBe(false);
  });

  it('liste les descendants et le chemin d’un nœud', () => {
    expect([...descendantIds(nodes, 'acte1')].sort()).toEqual(['b', 'c', 'sous']);
    expect(pathTo(nodes, 'c').map((n) => n.id)).toEqual(['acte1', 'sous', 'c']);
  });
});

describe('tree-model : déplacements (3.2.5)', () => {
  // acte1/ (b, sous/ (c)), a, vide/
  const tree: TreeNode[] = [
    node('acte1', null, 0, 'folder'),
    node('b', 'acte1', 0),
    node('sous', 'acte1', 1, 'folder'),
    node('c', 'sous', 0),
    node('a', null, 1),
    node('vide', null, 2, 'folder'),
  ];

  it('dépose dans un dossier (à la fin), avant ou après une ligne, ou à la fin de la racine', () => {
    expect(computeMove(tree, 'a', { position: 'inside', id: 'sous' })).toEqual({
      id: 'a',
      parentId: 'sous',
      order: 1,
    });
    expect(computeMove(tree, 'a', { position: 'before', id: 'b' })).toEqual({
      id: 'a',
      parentId: 'acte1',
      order: 0,
    });
    expect(computeMove(tree, 'c', { position: 'after', id: 'a' })).toEqual({
      id: 'c',
      parentId: null,
      order: 2,
    });
    expect(computeMove(tree, 'b', { position: 'root-end' })).toEqual({
      id: 'b',
      parentId: null,
      order: 3,
    });
  });

  it('refuse de déposer un dossier dans lui-même, un descendant ou un élément ; ignore un dépôt sans effet', () => {
    expect(computeMove(tree, 'acte1', { position: 'inside', id: 'sous' })).toBeNull();
    expect(computeMove(tree, 'acte1', { position: 'before', id: 'c' })).toBeNull();
    expect(computeMove(tree, 'acte1', { position: 'inside', id: 'acte1' })).toBeNull();
    expect(computeMove(tree, 'b', { position: 'inside', id: 'a' })).toBeNull();
    expect(computeMove(tree, 'a', { position: 'after', id: 'acte1' })).toBeNull();
    expect(computeMove(tree, 'a', { position: 'before', id: 'vide' })).toBeNull();
  });

  it('renumérote le nœud déplacé et les frères concernés, dans l’ancien et le nouveau parent', () => {
    const changed = applyMove(tree, { id: 'b', parentId: null, order: 1 });
    const summary = Object.fromEntries(changed.map((n) => [n.id, `${n.parentId}:${n.order}`]));
    expect(summary).toEqual({ b: 'null:1', a: 'null:2', vide: 'null:3', sous: 'acte1:0' });
  });

  it('réordonne parmi les mêmes frères', () => {
    const changed = applyMove(tree, { id: 'vide', parentId: null, order: 0 });
    const summary = Object.fromEntries(changed.map((n) => [n.id, n.order]));
    expect(summary).toEqual({ vide: 0, acte1: 1, a: 2 });
  });

  it('ignore un nœud ou une cible inconnus', () => {
    expect(computeMove(tree, 'inconnu', { position: 'root-end' })).toBeNull();
    expect(computeMove(tree, 'a', { position: 'before', id: 'inconnu' })).toBeNull();
    expect(applyMove(tree, { id: 'inconnu', parentId: null, order: 0 })).toEqual([]);
  });

  it('place avant / après un nœud dont le parent est introuvable comme à la racine', () => {
    const withOrphan = [...tree, node('orpheline', 'disparu', 3)];
    expect(computeMove(withOrphan, 'b', { position: 'after', id: 'orpheline' })).toEqual({
      id: 'b',
      parentId: null,
      order: 4,
    });
  });
});
