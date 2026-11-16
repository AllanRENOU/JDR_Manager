import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MarkdownPipe } from '../../../../shared/markdown/markdown-pipe';
import { Button } from '../../../../shared/ui/button/button';
import { Modal } from '../../../../shared/ui/modal/modal';

/** Contenu de la fenêtre : fiche lue au moment de l'ouverture. */
export interface SheetDialogData {
  title: string;
  /** Texte Markdown. */
  text: string;
}

/**
 * Fiche du MJ en Présentation (FCH-08, Brief §6.9) : titre et texte mis en forme, en lecture
 * seule, bouton « Fermer » en bas à droite (décision d'Allan : pas de chemin du dossier). Ouverte par `GmScreenPage` (`Modals.open`, taille `lg`) ; jamais montrée aux
 * joueurs (TEC-57).
 */
@Component({
  selector: 'app-sheet-dialog',
  imports: [Modal, Button, MarkdownPipe, TranslocoPipe],
  templateUrl: './sheet-dialog.html',
  styleUrl: './sheet-dialog.scss',
})
export class SheetDialog {
  protected readonly sheet = inject<SheetDialogData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
}
