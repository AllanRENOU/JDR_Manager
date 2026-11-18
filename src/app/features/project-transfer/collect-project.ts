import { DataError } from '../../core/data/data-error';
import { DataRepository } from '../../core/data/data-repository';
import { ActionElement, GLOBAL_LIBRARY, Id, LibraryNode } from '../../core/models';
import { CollectedProject } from './project-archive';

/**
 * Relit tout ce qu'il faut exporter d'un projet (PRJ-05) : image du projet, scènes, battlemaps,
 * actions, fiches,
 * toute la bibliothèque du projet, et les sons et vidéos de la bibliothèque globale utilisés par
 * ses actions, avec les dossiers qui y mènent. Pas de partie sauvegardée.
 * @throws DataError `project-not-found`.
 */
export async function collectProject(
  repository: DataRepository,
  projectId: Id,
): Promise<CollectedProject> {
  const project = await repository.getProject(projectId);
  if (!project) {
    throw new DataError('project-not-found', `Projet introuvable : ${projectId}`);
  }
  const [sceneNodes, scenes, sheetNodes, sheets, projectLibrary, globalLibrary] = await Promise.all(
    [
      repository.listSceneNodes(projectId),
      repository.listScenes(projectId),
      repository.listSheetNodes(projectId),
      repository.listSheets(projectId),
      repository.listLibraryNodes(projectId),
      repository.listLibraryNodes(GLOBAL_LIBRARY),
    ],
  );
  const perScene = await Promise.all(
    scenes.map(async (scene) => ({
      battlemaps: await repository.listBattlemaps(scene.id),
      actions: await repository.listActions(scene.id),
    })),
  );
  const battlemaps = perScene.flatMap((s) => s.battlemaps);
  const actions = perScene.flatMap((s) => s.actions);

  const usedIds = new Set(actions.flatMap((a) => a.elements.flatMap(libraryTargets)));
  const libraryNodes = [...projectLibrary, ...withAncestors(globalLibrary, usedIds)];

  const mediaIds = new Set([
    ...(project.imageMediaId ? [project.imageMediaId] : []),
    ...battlemaps.map((b) => b.mediaId),
    ...libraryNodes.flatMap((n) => (n.kind === 'item' && n.mediaId ? [n.mediaId] : [])),
  ]);
  const media = await repository.getMediaInfo([...mediaIds]);

  return {
    data: { project, sceneNodes, scenes, battlemaps, actions, sheetNodes, sheets, libraryNodes },
    media,
  };
}

/** Nœuds de bibliothèque visés par un élément d'action (son ou vidéo). */
function libraryTargets(element: ActionElement): Id[] {
  switch (element.type) {
    case 'play-sound':
    case 'stop-sound':
      return [element.soundId];
    case 'play-video':
      return [element.videoId];
    default:
      return [];
  }
}

/** Nœuds demandés et leurs dossiers parents, dans l'ordre de `nodes`. */
function withAncestors(nodes: LibraryNode[], ids: ReadonlySet<Id>): LibraryNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kept = new Set<Id>();
  for (const id of ids) {
    let node = byId.get(id);
    // `kept` arrête aussi la remontée sur une boucle de parents (données abîmées).
    while (node && !kept.has(node.id)) {
      kept.add(node.id);
      node = node.parentId === null ? undefined : byId.get(node.parentId);
    }
  }
  return nodes.filter((n) => kept.has(n.id));
}
