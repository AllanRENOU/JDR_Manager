import { DataRepository } from '../../core/data/data-repository';
import { Id, Project } from '../../core/models';

/** Informations affichées sur la carte d'un projet (PRJ-01). */
export interface ProjectSummary {
  project: Project;
  sceneCount: number;
  soundCount: number;
  /** Nom de la dernière scène jouée (partie sauvegardée), sinon `null`. */
  lastSceneName: string | null;
  /** Une partie est sauvegardée (PRS-02). */
  hasPlaySession: boolean;
  /** Image de la vignette : battlemap par défaut de la première scène, sinon sa première battlemap. */
  thumbnailMediaId: Id | null;
}

/** Calcule le résumé d'un projet à partir du dépôt. */
export async function loadProjectSummary(
  repository: DataRepository,
  project: Project,
): Promise<ProjectSummary> {
  const [nodes, sounds, session] = await Promise.all([
    repository.listSceneNodes(project.id),
    repository.listSoundNodes(project.id),
    repository.getPlaySession(project.id),
  ]);
  const scenes = nodes.filter((n) => n.kind === 'item');
  const lastScene = session ? scenes.find((n) => n.id === session.currentSceneId) : undefined;

  let thumbnailMediaId: Id | null = null;
  const firstSceneId = project.firstSceneId ?? scenes[0]?.id;
  if (firstSceneId) {
    const [scene, battlemaps] = await Promise.all([
      repository.getScene(firstSceneId),
      repository.listBattlemaps(firstSceneId),
    ]);
    const battlemap = battlemaps.find((b) => b.id === scene?.defaultBattlemapId) ?? battlemaps[0];
    thumbnailMediaId = battlemap?.mediaId ?? null;
  }

  return {
    project,
    sceneCount: scenes.length,
    soundCount: sounds.filter((n) => n.kind === 'item').length,
    lastSceneName: lastScene?.name ?? null,
    hasPlaySession: !!session,
    thumbnailMediaId,
  };
}
