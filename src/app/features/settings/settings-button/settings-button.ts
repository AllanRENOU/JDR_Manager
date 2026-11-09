import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideSettings } from '@lucide/angular';

import { Button } from '../../../shared/ui/button/button';
import { Modals } from '../../../shared/ui/modal/modals';
import { SettingsDialog } from '../settings-dialog/settings-dialog';

/**
 * Bouton réglages de l'en-tête des modes Édition et Présentation : ouvre `SettingsDialog`
 * sans quitter l'écran. À projeter avec `<app-settings-button headerEnd />`.
 */
@Component({
  selector: 'app-settings-button',
  imports: [Button, TranslocoPipe, LucideSettings],
  templateUrl: './settings-button.html',
})
export class SettingsButton {
  private readonly modals = inject(Modals);

  protected open(): void {
    this.modals.open(SettingsDialog, { size: 'lg' });
  }
}
