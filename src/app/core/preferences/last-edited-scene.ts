import { Id } from '../models';

/**
 * Clé `UiPreferences` de la dernière scène ouverte dans l'éditeur d'un projet : la démo lancée
 * depuis l'écran Sons commence à cette scène.
 */
export function lastEditedSceneKey(projectId: Id): string {
  return `editor.lastScene.${projectId}`;
}
