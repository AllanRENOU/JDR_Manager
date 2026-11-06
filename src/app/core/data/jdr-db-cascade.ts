import { IDBPTransaction } from 'idb';

import { Id } from '../models';
import { JdrDbSchema, JdrStoreName } from './jdr-db';

/** Transaction en écriture sur tous les stores : les suppressions en cascade s'y font d'un bloc (TRD §4.2). */
export type CascadeTransaction = IDBPTransaction<JdrDbSchema, JdrStoreName[], 'readwrite'>;

/** Stores touchés par les suppressions en cascade. */
export const ALL_STORES: JdrStoreName[] = [
  'projects',
  'sceneNodes',
  'scenes',
  'battlemaps',
  'actions',
  'soundNodes',
  'media',
  'playSessions',
];

/**
 * Supprime des scènes avec leurs battlemaps et leurs actions.
 * @returns les médias des battlemaps supprimées, à nettoyer avec `deleteUnusedMedia`.
 */
export async function deleteScenes(
  tx: CascadeTransaction,
  sceneIds: Iterable<Id>,
): Promise<Set<Id>> {
  const mediaIds = new Set<Id>();
  const battlemaps = tx.objectStore('battlemaps');
  const actions = tx.objectStore('actions');
  for (const sceneId of sceneIds) {
    for (const battlemap of await battlemaps.index('sceneId').getAll(sceneId)) {
      mediaIds.add(battlemap.mediaId);
      await battlemaps.delete(battlemap.id);
    }
    for (const actionId of await actions.index('sceneId').getAllKeys(sceneId)) {
      await actions.delete(actionId);
    }
    await tx.objectStore('scenes').delete(sceneId);
  }
  return mediaIds;
}

/** Vrai si une battlemap ou un son utilise encore ce média. */
export async function isMediaUsed(tx: CascadeTransaction, mediaId: Id): Promise<boolean> {
  const [battlemaps, sounds] = await Promise.all([
    tx.objectStore('battlemaps').index('mediaId').count(mediaId),
    tx.objectStore('soundNodes').index('mediaId').count(mediaId),
  ]);
  return battlemaps + sounds > 0;
}

/** Supprime les médias qui ne sont plus utilisés par aucune battlemap ni aucun son. */
export async function deleteUnusedMedia(
  tx: CascadeTransaction,
  mediaIds: Iterable<Id>,
): Promise<void> {
  for (const mediaId of mediaIds) {
    if (!(await isMediaUsed(tx, mediaId))) {
      await tx.objectStore('media').delete(mediaId);
    }
  }
}

/**
 * Renvoie l'id demandé et tous ses descendants, à partir de la liste des nœuds de la même
 * arborescence.
 */
export function collectSubtree<T extends { id: Id; parentId: Id | null }>(
  nodes: T[],
  rootId: Id,
): T[] {
  const byParent = new Map<Id | null, T[]>();
  for (const node of nodes) {
    byParent.set(node.parentId, [...(byParent.get(node.parentId) ?? []), node]);
  }
  const result: T[] = [];
  const stack = nodes.filter((n) => n.id === rootId);
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);
    stack.push(...(byParent.get(node.id) ?? []));
  }
  return result;
}
