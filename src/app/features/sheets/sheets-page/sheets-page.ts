import { Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowLeft, LucidePencilRuler, LucidePlay, LucideScrollText } from '@lucide/angular';

import { Id } from '../../../core/models';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';
import { AudioPlayer } from '../../presentation/audio/audio-player';
import { SettingsButton } from '../../settings/settings-button/settings-button';
import { SheetsStore } from '../sheets-store';

/**
 * Écran « Fiches » d'un projet (FCH-02, Brief §7.2), route `/projects/:projectId/sheets` :
 * arborescence des fiches à gauche, fiche ouverte au centre.
 */
@Component({
  selector: 'app-sheets-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    Placeholder,
    ProjectNav,
    RouterLink,
    SettingsButton,
    TranslocoPipe,
    LucideArrowLeft,
    LucidePencilRuler,
    LucidePlay,
    LucideScrollText,
  ],
  providers: [SheetsStore],
  templateUrl: './sheets-page.html',
  styleUrl: './sheets-page.scss',
})
export class SheetsPage {
  private readonly notifications = inject(Notifications);
  private readonly audio = inject(AudioPlayer);
  protected readonly store = inject(SheetsStore);

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
  }

  /** « Présenter » lance une démo sans fenêtre de lancement : l'audio est débloqué dans le clic (TEC-43). */
  protected unlockAudio(): void {
    void this.audio.unlock();
  }
}
