import { Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideSettings } from '@lucide/angular';

import { Id } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { Modals } from '../../../shared/ui/modal/modals';
import { SettingsDialog } from '../settings-dialog/settings-dialog';

/**
 * Bouton réglages de l'en-tête des modes Édition et Présentation : ouvre `SettingsDialog`
 * sans quitter l'écran. À projeter avec `<app-settings-button headerEnd />`. Avec `projectId`
 * (écrans d'édition du projet), la fenêtre montre aussi la section Projet.
 */
@Component({
  selector: 'app-settings-button',
  imports: [Button, TranslocoPipe, LucideSettings],
  templateUrl: './settings-button.html',
})
export class SettingsButton {
  /** Projet ouvert : section Projet (image d'illustration) dans la fenêtre. */
  readonly projectId = input<Id | null>(null);

  private readonly modals = inject(Modals);

  protected open(): void {
    const projectId = this.projectId();
    this.modals.open(SettingsDialog, { size: 'lg', data: projectId ? { projectId } : null });
  }
}
