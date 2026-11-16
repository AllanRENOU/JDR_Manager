import { Component, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideLibraryBig, LucidePlus, LucideSettings, LucideUpload } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { pluralKey } from '../../../core/i18n/plural';
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
import type {
  ExportProjectDialogData,
  ExportProjectDialogResult,
} from '../../project-transfer/export-project-dialog/export-project-dialog';
import type {
  ImportProjectDialogData,
  ImportProjectDialogResult,
} from '../../project-transfer/import-project-dialog/import-project-dialog';
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
    LucideLibraryBig,
    LucidePlus,
    LucideSettings,
    LucideUpload,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly modals = inject(Modals);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);

  /** Projets (du plus récemment modifié au plus ancien) avec les informations de leur carte. */
  protected readonly projects = resource({
    loader: async () => {
      const projects = await this.repository.listProjects();
      return Promise.all(projects.map((project) => loadProjectSummary(this.repository, project)));
    },
  });

  /** Demande un nom, crée le projet puis l'ouvre en mode Édition. */
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
    } catch (error) {
      this.notifications.fromError(error);
      return null;
    }
    await this.router.navigate(['/projects', project.id, 'edit']);
    return project;
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

  /**
   * Ouvre la fenêtre « Exporter le projet » (PRJ-05) ; la fenêtre écrit le `.zip`. Elle est chargée
   * à la demande : la bibliothèque zip n'alourdit pas l'accueil.
   */
  async exportProject(project: Project): Promise<boolean> {
    const { ExportProjectDialog } =
      await import('../../project-transfer/export-project-dialog/export-project-dialog');
    const ref = this.modals.open<ExportProjectDialogResult, ExportProjectDialogData>(
      ExportProjectDialog,
      { data: { project }, size: 'md', closable: false },
    );
    const exported = (await firstValueFrom(ref.closed)) === true;
    if (exported) {
      this.notifications.info(
        this.transloco.translate('transfer.export.done', { name: project.name }),
      );
    }
    return exported;
  }

  /** Fichier choisi avec « Importer un projet ». */
  protected onImportChosen(input: HTMLInputElement): void {
    const file = input.files?.[0];
    // Remis à zéro : choisir de nouveau le même fichier doit relancer l'import.
    input.value = '';
    if (file) {
      void this.importProject(file);
    }
  }

  /**
   * Ouvre la fenêtre « Importer un projet » (PRJ-05), chargée à la demande comme l'export, puis
   * recharge la liste. @returns le résultat de l'import, ou `undefined` si rien n'a été importé.
   */
  async importProject(file: File): Promise<ImportProjectDialogResult | undefined> {
    const { ImportProjectDialog } =
      await import('../../project-transfer/import-project-dialog/import-project-dialog');
    const ref = this.modals.open<ImportProjectDialogResult, ImportProjectDialogData>(
      ImportProjectDialog,
      { data: { file }, size: 'md', closable: false },
    );
    const result = await firstValueFrom(ref.closed);
    if (result) {
      this.projects.reload();
      const key =
        result.withoutFile > 0
          ? pluralKey('transfer.import.doneWithoutFile', result.withoutFile)
          : 'transfer.import.done';
      this.notifications.info(
        this.transloco.translate(key, { name: result.name, count: result.withoutFile }),
      );
    }
    return result;
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
