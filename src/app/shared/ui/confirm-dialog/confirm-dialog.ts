import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideTriangleExclamationPoint } from '@lucide/angular';

import { Button } from '../button/button';
import { HoldToConfirm } from '../hold-to-confirm/hold-to-confirm';
import { Modal } from '../modal/modal';

/** Contenu d'une demande de confirmation ; les textes sont déjà traduits. */
export interface ConfirmOptions {
  title: string;
  message: string;
  subtitle?: string;
  /** Libellé du bouton de confirmation ; « Confirmer » par défaut. */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation ; « Annuler » par défaut. */
  cancelLabel?: string;
  /** Action irréversible : bordure et bouton « Danger fort », icône d'alerte (NF-31). */
  destructive?: boolean;
  /**
   * Valider en restant appuyé `HOLD_TO_CONFIRM_MS` sur le bouton de confirmation (directive
   * `appHoldToConfirm`, bouton « Danger » qui se remplit) ; un clic simple affiche un message sous
   * les boutons. Pour les suppressions qu'on ne veut pas faire par mégarde (NF-31).
   */
  holdToConfirm?: boolean;
}

/** Fenêtre de confirmation (Brief §6.9). Ouverte par `Modals.confirm()`, renvoie `true` si confirmé. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal, Button, HoldToConfirm, TranslocoPipe, LucideTriangleExclamationPoint],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly options = inject<ConfirmOptions>(DIALOG_DATA);
}
