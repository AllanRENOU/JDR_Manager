import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Modal } from '../../../shared/ui/modal/modal';
import { SettingsContent } from '../settings-content/settings-content';

/**
 * Paramètres dans une fenêtre, ouverts depuis les modes Édition et Présentation :
 * l'écran reste en place (scène ouverte, sons, fenêtre joueurs).
 */
@Component({
  selector: 'app-settings-dialog',
  imports: [Modal, SettingsContent, TranslocoPipe],
  templateUrl: './settings-dialog.html',
})
export class SettingsDialog {}
