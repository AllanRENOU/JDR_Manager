import { Injectable } from '@angular/core';

import {
  Action,
  ActionElement,
  AddTextElement,
  ChangeSceneElement,
  Id,
  PlaySoundElement,
  ShowActionElement,
  ShowBattlemapElement,
  StopSoundElement,
  UserClickElement,
  WaitElement,
} from '../../../core/models';

/**
 * Ce que le moteur met à disposition d'une action pendant son exécution (TRD §6.2). Chaque
 * méthode applique l'événement à la partie et la sauvegarde (TEC-52) ; aucune ne lève d'erreur
 * pour une ressource manquante : elle la signale et la partie continue (NF-25).
 */
export interface ActionContext {
  /**
   * À attendre avant chaque élément **affiché** dans le fil (texte, battlemap, clic de
   * l'utilisateur) : laisse un temps de lecture depuis l'affichage précédent. Rejetée si le
   * signal est annulé.
   */
  beforeDisplay(signal: AbortSignal): Promise<void>;
  /** Ajoute le texte au fil ; s'il y est déjà (relance, CTL-03), le fil revient sur lui. */
  addText(action: Action, element: AddTextElement): void;
  /** Affiche la battlemap et ajoute sa miniature au fil (ACT-04, FIL-03). */
  showBattlemap(element: ShowBattlemapElement): void;
  /** Lance le son, sans attendre son chargement (ACT-05). */
  playSound(element: PlaySoundElement): void;
  /** Arrête le son avec son fondu de sortie (ACT-06). */
  stopSound(element: StopSoundElement): void;
  /** Arrête tous les sons, chacun avec son fondu de sortie (ACT-07). */
  stopAllSounds(): void;
  /**
   * Affiche le bloc « Clic de l'utilisateur » ; la promesse est résolue au clic sur « Continuer »
   * et rejetée si le signal est annulé (ACT-11, FIL-05). Pour un « Changer de scène », le bloc
   * propose d'aller à la scène cible (bouton « Aller »).
   */
  waitForUserClick(
    action: Action,
    element: UserClickElement | ChangeSceneElement,
    signal: AbortSignal,
  ): Promise<void>;
  /**
   * Attend la durée de l'élément en affichant le temps restant dans le fil ; rejetée si le signal
   * est annulé (ACT-10, TEC-51).
   */
  wait(element: WaitElement, signal: AbortSignal): Promise<void>;
  /**
   * `true` si la scène cible existe ; sinon le problème est signalé et la scène ne change pas
   * (PRS-07).
   */
  canChangeScene(element: ChangeSceneElement): boolean;
  /**
   * Rend visible une action de la scène, masquée au départ ou terminée (ACT-12) ; une action
   * introuvable est signalée.
   */
  showAction(element: ShowActionElement): void;
  /** Marque l'action comme effectuée dans la scène (CTL-01). */
  markDone(action: Action): void;
}

/** Fin d'une action : terminée, ou terminée par un « Changer de scène » à appliquer. */
export type RunOutcome = { kind: 'done' } | { kind: 'change-scene'; sceneId: Id };

/**
 * Exécute les éléments d'une action dans l'ordre (TEC-50, TRD §6.2), indépendamment de
 * l'interface. Annulable (TEC-51) : l'annulation du signal (scène quittée) interrompt l'action
 * entre deux éléments, pendant une attente ou un clic en attente ; la promesse est alors rejetée
 * et l'action n'est pas marquée comme effectuée.
 *
 * Les éléments affichés (texte, battlemap, clic de l'utilisateur, changer de scène) attendent
 * `context.beforeDisplay()` ; les éléments de son et « Attendre », non.
 *
 * « Changer de scène » ne change pas de scène tout de suite : comme un clic de l'utilisateur, il
 * attend que le MJ clique sur « Aller » (scène cible supprimée : ni bloc ni changement).
 *
 * Une action déjà effectuée peut être relancée (CTL-03) : c'est le contexte qui évite les doublons
 * dans le fil.
 */
@Injectable()
export class ActionRunner {
  async run(action: Action, context: ActionContext, signal: AbortSignal): Promise<RunOutcome> {
    for (const element of action.elements) {
      signal.throwIfAborted();
      if (element.type === 'change-scene') {
        // Fin de l'action : les éléments suivants ne sont pas exécutés (ACT-09). La scène change
        // au clic du MJ sur « Aller ».
        if (!context.canChangeScene(element)) {
          context.markDone(action);
          return { kind: 'done' };
        }
        await context.beforeDisplay(signal);
        await context.waitForUserClick(action, element, signal);
        context.markDone(action);
        return { kind: 'change-scene', sceneId: element.sceneId };
      }
      if (DISPLAYED.has(element.type)) {
        await context.beforeDisplay(signal);
      }
      switch (element.type) {
        case 'add-text':
          context.addText(action, element);
          break;
        case 'show-battlemap':
          context.showBattlemap(element);
          break;
        case 'play-sound':
          context.playSound(element);
          break;
        case 'stop-sound':
          context.stopSound(element);
          break;
        case 'stop-all-sounds':
          context.stopAllSounds();
          break;
        case 'show-action':
          context.showAction(element);
          break;
        case 'wait':
          await context.wait(element, signal);
          break;
        case 'user-click':
          await context.waitForUserClick(action, element, signal);
          break;
      }
      // Laisse l'interface se mettre à jour entre deux éléments.
      await Promise.resolve();
    }
    signal.throwIfAborted();
    context.markDone(action);
    return { kind: 'done' };
  }
}

/** Éléments affichés dans le fil, espacés par `ActionContext.beforeDisplay()`. */
const DISPLAYED: ReadonlySet<ActionElement['type']> = new Set([
  'add-text',
  'show-battlemap',
  'user-click',
]);
