import { ActionElement } from './action-element';
import { Id } from './id';

/** Déclencheur d'une action : à l'ouverture de la scène ou à la main par le MJ. */
export type Trigger = 'scene-open' | 'manual';

/** Suite d'éléments exécutés dans l'ordre (TRD §3, §6). */
export interface Action {
  id: Id;
  sceneId: Id;
  name: string;
  trigger: Trigger;
  /** Position dans la liste des actions de la scène. */
  order: number;
  /** `true` = action « Texte de scène » (non supprimable). */
  isSceneText: boolean;
  elements: ActionElement[];
}
