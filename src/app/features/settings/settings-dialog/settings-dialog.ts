import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Id } from '../../../core/models';
import { Modal } from '../../../shared/ui/modal/modal';
import { SettingsContent } from '../settings-content/settings-content';

/**
 * Paramètres dans une fenêtre, ouverts depuis les modes Édition et Présentation :
 * l'écran reste en place (scène ouverte, sons, fenêtre joueurs).
 * Avec `data.projectId`, affiche aussi la section Projet.
 */
@Component({
  selector: 'app-settings-dialog',
  imports: [Modal, SettingsContent, TranslocoPipe],
  templateUrl: './settings-dialog.html',
})
export class SettingsDialog {
  protected readonly data = inject<SettingsDialogData | null>(DIALOG_DATA, { optional: true });
}

/** Données de la fenêtre des paramètres. */
export interface SettingsDialogData {
  /** Projet ouvert (écrans d'édition) : section Projet. */
  projectId?: Id;
}
