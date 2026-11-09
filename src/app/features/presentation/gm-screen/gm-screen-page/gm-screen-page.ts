import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowLeft, LucidePresentation } from '@lucide/angular';

import { Id } from '../../../../core/models';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AppHeader } from '../../../../shared/ui/app-header/app-header';
import { Button } from '../../../../shared/ui/button/button';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { ActionRunner } from '../../engine/action-runner';
import { PlaySessionStore } from '../../engine/play-session-store';
import { PresentationEngine } from '../../engine/presentation-engine';

/** Mode Présentation, écran du MJ (`/projects/:projectId/play`, PRJ-03) : fil d'actualité de la scène. */
@Component({
  selector: 'app-gm-screen-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucidePresentation,
  ],
  providers: [PresentationEngine, ActionRunner, PlaySessionStore],
  templateUrl: './gm-screen-page.html',
  styleUrl: './gm-screen-page.scss',
})
export class GmScreenPage {
  protected readonly engine = inject(PresentationEngine);
  private readonly notifications = inject(Notifications);

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      // Seul le projet relance la Présentation : les signals lus par le moteur ne sont pas suivis.
      untracked(() =>
        // Une erreur n'interrompt jamais la partie (NF-25) : on la signale.
        this.engine.start(projectId).catch((error) => this.notifications.fromError(error)),
      );
    });
    inject(DestroyRef).onDestroy(() => this.engine.stop());
  }
}
