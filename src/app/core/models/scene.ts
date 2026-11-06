import { Id } from './id';

/** Contenu d'une scène ; `id` = id du `SceneNode` de type `item` (TRD §3). */
export interface Scene {
  id: Id;
  projectId: Id;
  /** Battlemap affichée à l'ouverture de la scène. */
  defaultBattlemapId: Id | null;
  /** Scènes proposées par le bouton « Scène suivante ». */
  nextSceneIds: Id[];
  /** Action « Texte de scène », déclenchée à l'ouverture et non supprimable. */
  sceneTextActionId: Id | null;
}
