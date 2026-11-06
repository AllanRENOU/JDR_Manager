import { Id } from './id';
import { SceneState } from './scene-state';

/** Partie sauvegardée : une par projet en V1, enregistrée à chaque événement (TEC-52). */
export interface PlaySession {
  /** Clé : une partie par projet. */
  projectId: Id;
  currentSceneId: Id;
  /** État de chaque scène visitée, par id de scène. */
  scenes: Record<Id, SceneState>;
  /** Date ISO 8601. */
  updatedAt: string;
}
