import { SceneNode } from '../../../core/models';

/** Arborescence de scènes de test pour la page de démonstration. */
export const DEMO_SCENES: SceneNode[] = [
  { id: 'prologue', projectId: 'demo', parentId: null, order: 0, kind: 'item', name: 'Prologue' },
  {
    id: 'acte1',
    projectId: 'demo',
    parentId: null,
    order: 1,
    kind: 'folder',
    name: 'Acte 1 — Le village',
  },
  {
    id: 'taverne',
    projectId: 'demo',
    parentId: 'acte1',
    order: 0,
    kind: 'item',
    name: 'La taverne du Sanglier',
  },
  { id: 'marche', projectId: 'demo', parentId: 'acte1', order: 1, kind: 'item', name: 'Le marché' },
  { id: 'nuit', projectId: 'demo', parentId: 'acte1', order: 2, kind: 'folder', name: 'La nuit' },
  {
    id: 'embuscade',
    projectId: 'demo',
    parentId: 'nuit',
    order: 0,
    kind: 'item',
    name: 'Embuscade',
  },
  {
    id: 'acte2',
    projectId: 'demo',
    parentId: null,
    order: 2,
    kind: 'folder',
    name: 'Acte 2 — La crypte',
  },
  {
    id: 'entree',
    projectId: 'demo',
    parentId: 'acte2',
    order: 0,
    kind: 'item',
    name: 'Entrée de la crypte',
  },
  {
    id: 'salle',
    projectId: 'demo',
    parentId: 'acte2',
    order: 1,
    kind: 'item',
    name: 'La salle des tombeaux',
  },
];
