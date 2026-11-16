import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MarkdownPipe } from '../../../../shared/markdown/markdown-pipe';
import { Modal } from '../../../../shared/ui/modal/modal';

/** Contenu de la fenêtre : fiche lue au moment de l'ouverture. */
export interface SheetDialogData {
  title: string;
  /** Dossiers de la fiche, « PNJ › Auberge » ; vide à la racine. */
  path: string;
  /** Texte Markdown. */
  text: string;
}

/**
 * Fiche du MJ en Présentation (FCH-08, Brief §6.9) : titre, chemin et texte mis en forme, en
 * lecture seule. Ouverte par `GmScreenPage` (`Modals.open`, taille `lg`) ; jamais montrée aux
 * joueurs (TEC-57).
 */
@Component({
  selector: 'app-sheet-dialog',
  imports: [Modal, MarkdownPipe, TranslocoPipe],
  templateUrl: './sheet-dialog.html',
  styleUrl: './sheet-dialog.scss',
})
export class SheetDialog {
  protected readonly sheet = inject<SheetDialogData>(DIALOG_DATA);
}
