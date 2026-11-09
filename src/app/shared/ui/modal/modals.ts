import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ConfirmDialog, ConfirmOptions } from '../confirm-dialog/confirm-dialog';

/**
 * Largeurs de fenêtre (Brief §6.9) : sélection / confirmation, lancement, édition d'une action,
 * battlemap en grand (FIL-04).
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalOptions<D> {
  data?: D;
  size?: ModalSize;
  /** `false` empêche la fermeture par Échap ou clic sur le fond (ex. saisie en cours). */
  closable?: boolean;
}

/**
 * Ouvre des fenêtres modales (CDK Dialog) avec les réglages du design system : fond
 * `--bg-backdrop`, largeur selon `size`, focus piégé et rendu à l'élément d'origine à la fermeture.
 * Le composant ouvert utilise `<app-modal>` pour sa mise en page et injecte `DialogRef` / `DIALOG_DATA`.
 */
@Service()
export class Modals {
  private readonly dialog = inject(Dialog);

  open<R, D = unknown, C = unknown>(
    component: ComponentType<C>,
    options: ModalOptions<D> = {},
  ): DialogRef<R, C> {
    const config: DialogConfig<D, DialogRef<R, C>> = {
      data: options.data,
      width: `var(--layout-modal-${options.size ?? 'sm'})`,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      panelClass: 'app-dialog-panel',
      backdropClass: 'app-dialog-backdrop',
      disableClose: options.closable === false,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    };
    return this.dialog.open<R, D, C>(component, config);
  }

  /**
   * Demande une confirmation (Brief §6.9, NF-31). Le focus initial est sur « Annuler » :
   * une touche Entrée par erreur ne déclenche pas une action destructive.
   * @returns `true` si l'utilisateur confirme, `false` s'il annule ou ferme la fenêtre.
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.open<boolean, ConfirmOptions>(ConfirmDialog, { data: options, size: 'sm' });
    return (await firstValueFrom(ref.closed)) === true;
  }

  /** Ferme toutes les fenêtres ouvertes (changement d'écran). */
  closeAll(): void {
    this.dialog.closeAll();
  }
}
