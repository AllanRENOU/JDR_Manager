import { Id } from './id';

/** Projet = un scénario préparé par le MJ (TRD §3). */
export interface Project {
  id: Id;
  name: string;
  /** Scène ouverte au lancement d'une nouvelle partie. */
  firstSceneId: Id | null;
  /** Date ISO 8601. */
  createdAt: string;
  /** Date ISO 8601. */
  updatedAt: string;
}
