import { Injectable } from '@angular/core';

import { Action, AddTextElement } from '../../../core/models';

/**
 * Ce que le moteur met à disposition des actions pendant leur exécution. Il s'enrichira avec
 * les autres types d'éléments (battlemap, sons, attente, clic, changement de scène — lot 9).
 */
export interface ActionContext {
  /** Ajoute le texte au fil d'actualité de la scène (ou y revient s'il y est déjà). */
  addText(action: Action, element: AddTextElement): void;
}

/**
 * Exécute les éléments d'une action dans l'ordre (TEC-50, TRD §6.2), indépendamment de
 * l'interface. Annulable : l'arrêt du signal (scène quittée) interrompt l'action entre deux
 * éléments.
 *
 * Lot 4 : seul l'élément « Ajouter un texte » est exécuté ; les autres types sont ignorés
 * jusqu'au lot 9.
 */
@Injectable()
export class ActionRunner {
  async run(action: Action, context: ActionContext, signal: AbortSignal): Promise<void> {
    for (const element of action.elements) {
      signal.throwIfAborted();
      switch (element.type) {
        case 'add-text':
          context.addText(action, element);
          break;
        case 'show-battlemap':
        case 'play-sound':
        case 'stop-sound':
        case 'stop-all-sounds':
        case 'wait':
        case 'user-click':
        case 'change-scene':
          // Lot 9 (moteur de présentation complet).
          break;
      }
      // Laisse l'interface se mettre à jour entre deux éléments.
      await Promise.resolve();
    }
    signal.throwIfAborted();
  }
}
