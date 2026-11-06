import { CdkDialogContainer, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { Button } from '../button/button';

let nextId = 0;

/**
 * Mise en page d'une fenêtre modale (Brief §6.9) : en-tête (titre Cinzel, sous-titre, fermer),
 * contenu défilant, pied (action destructive à gauche, Annuler + action principale à droite).
 *
 * ```html
 * <app-modal title="Choisir les scènes suivantes" subtitle="Scène : La taverne">
 *   … contenu …
 *   <button modalFooterStart appButton="danger">Supprimer</button>
 *   <button modalFooterEnd appButton="secondary">Annuler</button>
 *   <button modalFooterEnd appButton>Valider</button>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  imports: [Button, TranslocoPipe, LucideX],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
  host: { '[class.danger]': 'danger()' },
})
export class Modal {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  readonly title = input.required<string>();
  readonly subtitle = input('');
  /** Bordure rouge des confirmations destructives. */
  readonly danger = input(false);
  /** Masque la croix de fermeture. */
  readonly hideClose = input(false);

  protected readonly titleId = `app-modal-title-${++nextId}`;

  constructor() {
    // La fenêtre est nommée par son titre pour les lecteurs d'écran (aria-labelledby).
    const container = this.dialogRef?.containerInstance;
    if (container instanceof CdkDialogContainer) {
      container._ariaLabelledByQueue.push(this.titleId);
    }
  }

  protected close(): void {
    this.dialogRef?.close();
  }
}
