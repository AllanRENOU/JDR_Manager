import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Modal } from '../../../../shared/ui/modal/modal';
import { PRESENTATION_SHORTCUTS } from './shortcuts';

/** Aide des raccourcis clavier de la Présentation (NF-32), ouverte par « ? » ou l'en-tête. */
@Component({
  selector: 'app-shortcuts-dialog',
  imports: [Modal, TranslocoPipe],
  templateUrl: './shortcuts-dialog.html',
  styleUrl: './shortcuts-dialog.scss',
})
export class ShortcutsDialog {
  protected readonly shortcuts = PRESENTATION_SHORTCUTS;
}
