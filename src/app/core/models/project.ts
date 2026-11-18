import { Id } from './id';

/** Projet = un scénario préparé par le MJ (TRD §3). */
export interface Project {
  id: Id;
  name: string;
  /** Scène ouverte au lancement d'une nouvelle partie. */
  firstSceneId: Id | null;
  /**
   * Image d'illustration (carte de l'accueil), choisie dans Paramètres › Projet. Absente ou `null` :
   * pas d'image (les projets créés avant le lot 5.3 n'ont pas ce champ).
   */
  imageMediaId?: Id | null;
  /** Date ISO 8601. */
  createdAt: string;
  /** Date ISO 8601. */
  updatedAt: string;
}
