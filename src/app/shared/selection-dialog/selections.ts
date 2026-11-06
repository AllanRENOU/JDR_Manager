import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Id, TreeNode } from '../../core/models';
import { Modals } from '../ui/modal/modals';
import { SelectionDialog, SelectionOptions } from './selection-dialog';

/** Ouvre la fenêtre de sélection (scènes suivantes, cible de « Changer de scène », choix d'un son…). */
@Service()
export class Selections {
  private readonly modals = inject(Modals);

  /**
   * @returns les identifiants choisis (un seul en mode `single`), ou `null` si l'utilisateur annule.
   */
  async select<T extends TreeNode>(options: SelectionOptions<T>): Promise<Id[] | null> {
    const ref = this.modals.open<Id[], SelectionOptions<T>>(SelectionDialog, {
      data: options,
      size: 'sm',
    });
    return (await firstValueFrom(ref.closed)) ?? null;
  }
}
