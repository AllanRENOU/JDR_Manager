import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucidePlus, LucideSettings } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Project, newId } from '../../../core/models';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import {
  CreateProjectDialog,
  ProjectNameDialogData,
} from '../create-project-dialog/create-project-dialog';
import { ProjectCard } from '../project-card/project-card';
import { loadProjectSummary } from '../project-summary';

/** Accueil : grille des projets et carte « Créer un projet » en dernier (PRJ-01, TEC-93). */
@Component({
  selector: 'app-projects-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    ProjectCard,
    RouterLink,
    TranslocoPipe,
    LucidePlus,
    LucideSettings,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly modals = inject(Modals);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  /** Projets (du plus récemment modifié au plus ancien) avec les informations de leur carte. */
  protected readonly projects = resource({
    loader: async () => {
      const projects = await this.repository.listProjects();
      return Promise.all(projects.map((project) => loadProjectSummary(this.repository, project)));
    },
  });

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

  /** Demande un nouveau nom puis renomme le projet (PRJ-01). */
  async renameProject(project: Project): Promise<boolean> {
    const ref = this.modals.open<string, ProjectNameDialogData>(CreateProjectDialog, {
      data: { name: project.name },
    });
    const name = await firstValueFrom(ref.closed);
    if (!name || name === project.name) {
      return false;
    }
    try {
      await this.repository.saveProject({ ...project, name, updatedAt: new Date().toISOString() });
      this.projects.reload();
      return true;
    } catch (error) {
      this.notifications.fromError(error);
      return false;
    }
  }

  /** Supprime le projet et tout son contenu après confirmation (PRJ-02, NF-31). */
  async deleteProject(project: Project): Promise<boolean> {
    const t = (key: string) => this.transloco.translate(key, { name: project.name });
    const confirmed = await this.modals.confirm({
      title: t('project.delete.title'),
      message: t('project.delete.message'),
      confirmLabel: t('project.delete.confirm'),
      destructive: true,
    });
    if (!confirmed) {
      return false;
    }
    try {
      await this.repository.deleteProject(project.id);
      this.projects.reload();
      this.notifications.info(t('project.delete.done'));
      return true;
    } catch (error) {
      this.notifications.fromError(error);
      return false;
    }
  }
}
