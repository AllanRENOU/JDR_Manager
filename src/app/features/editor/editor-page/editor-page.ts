import { Component, DestroyRef, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  LucideArrowLeft,
  LucideClapperboard,
  LucidePencilRuler,
  LucidePlay,
  LucidePlus,
} from '@lucide/angular';

import { Id } from '../../../core/models';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Tree } from '../../../shared/tree/tree';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Pill } from '../../../shared/ui/pill/pill';
import { EditorStore } from '../editor-store';

/** Mode Édition d'un projet (`/projects/:projectId/edit`, PRJ-03). */
@Component({
  selector: 'app-editor-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    Pill,
    ProjectNav,
    Tree,
    Field,
    Input,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucideClapperboard,
    LucidePencilRuler,
    LucidePlay,
    LucidePlus,
  ],
  providers: [EditorStore],
  host: { '(window:beforeunload)': 'onBeforeUnload()' },
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage {
  protected readonly store = inject(EditorStore);
  private readonly notifications = inject(Notifications);

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
    // Rien ne se perd en quittant l'écran : la saisie en attente est enregistrée.
    inject(DestroyRef).onDestroy(() => {
      this.store.flush().catch((error) => this.notifications.fromError(error));
    });
  }

  /** Fermeture ou rechargement de l'onglet : enregistrement de la saisie en attente. */
  protected onBeforeUnload(): void {
    void this.store.flush();
  }

  protected onSceneTextBlur(): void {
    this.store.flush().catch((error) => this.notifications.fromError(error));
  }

  protected createFirstScene(): void {
    this.store.createFirstScene().catch((error) => this.notifications.fromError(error));
  }

  protected onSceneTextInput(text: string): void {
    this.store.editSceneText(text);
  }

  protected openScene(id: Id | null): void {
    this.store.openScene(id).catch((error) => this.notifications.fromError(error));
  }
}
