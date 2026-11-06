import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { LucidePencil, LucidePlay, LucidePlus } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Project, newId } from '../../../core/models';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';
import { CreateProjectDialog } from '../create-project-dialog/create-project-dialog';

/** Accueil : grille des projets et carte « Créer un projet » en dernier (PRJ-01, TEC-93). */
@Component({
  selector: 'app-projects-page',
  imports: [
    AppHeader,
    Placeholder,
    Alert,
    Button,
    RouterLink,
    DatePipe,
    TranslocoPipe,
    LucidePlus,
    LucidePencil,
    LucidePlay,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly modals = inject(Modals);
  private readonly notifications = inject(Notifications);

  /** Projets, du plus récemment modifié au plus ancien. */
  protected readonly projects = resource({ loader: () => this.repository.listProjects() });

  /** Demande un nom puis crée le projet. */
  async createProject(): Promise<Project | null> {
    const name = await firstValueFrom(this.modals.open<string>(CreateProjectDialog).closed);
    if (!name) {
      return null;
    }
    const now = new Date().toISOString();
    const project: Project = {
      id: newId(),
      name,
      firstSceneId: null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await this.repository.saveProject(project);
      this.projects.reload();
      return project;
    } catch (error) {
      this.notifications.fromError(error);
      return null;
    }
  }
}
