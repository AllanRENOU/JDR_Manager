import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, resource, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { isDataError } from '../../../core/data/data-error';
import { pluralKey } from '../../../core/i18n/plural';
import { Id } from '../../../core/models';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Modal } from '../../../shared/ui/modal/modal';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { formatFileSize } from '../../../shared/util/file-size';
import { ArchiveError } from '../archive-validation';
import { ImportPlan, ImportProgress, ProjectImport } from '../project-import';

export interface ImportProjectDialogData {
  file: File;
}

/** Résultat : le projet importé, ou `undefined` si rien n'a été importé. */
export interface ImportProjectDialogResult {
  projectId: Id;
  name: string;
  /** Médias restés sans fichier (à importer plus tard depuis la Bibliothèque). */
  withoutFile: number;
}

/**
 * Fenêtre « Importer un projet » (16.5, PRJ-05) : lit et valide le fichier choisi, montre ce qui
 * sera importé (et le projet remplacé, avec ses dates), puis écrit avec la progression et un
 * bouton « Annuler ». À ouvrir avec `closable: false`.
 */
@Component({
  selector: 'app-import-project-dialog',
  imports: [Alert, Button, DatePipe, Modal, TranslocoPipe],
  templateUrl: './import-project-dialog.html',
  styleUrl: './import-project-dialog.scss',
})
export class ImportProjectDialog {
  private readonly ref = inject<DialogRef<ImportProjectDialogResult>>(DialogRef);
  private readonly importer = inject(ProjectImport);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  protected readonly file = inject<ImportProjectDialogData>(DIALOG_DATA).file;

  /** Fichier lu et validé, import préparé (rien n'est encore écrit). */
  protected readonly plan = resource({
    loader: async () => {
      const plan = await this.importer.prepare(this.file);
      this.prepared = plan;
      if (this.destroyed) {
        // Fenêtre fermée pendant la lecture : on libère le fichier.
        void plan.zip.close();
      }
      return plan;
    },
  });
  /** Avancement de l'écriture ; `null` tant que l'import n'a pas commencé. */
  protected readonly progress = signal<ImportProgress | null>(null);
  private controller: AbortController | null = null;
  /** Import préparé, gardé pour refermer le zip à la fermeture de la fenêtre. */
  private prepared: ImportPlan | null = null;
  private destroyed = false;
  /** Vrai une fois l'import lancé : c'est `run()` qui referme le zip. */
  private started = false;

  /** Clé du message d'un fichier refusé. */
  protected readonly errorKey = computed(() => {
    const error = this.plan.error();
    return error ? messageKeyOf(error) : null;
  });
  protected readonly importing = computed(() => this.progress() !== null);
  protected readonly percent = computed(() => {
    const p = this.progress();
    return p && p.totalBytes > 0 ? Math.floor((p.importedBytes / p.totalBytes) * 100) : 0;
  });
  protected readonly progressText = computed(() => {
    const p = this.progress();
    return p
      ? { written: formatFileSize(p.importedBytes), total: formatFileSize(p.totalBytes) }
      : null;
  });
  protected readonly formatFileSize = formatFileSize;
  protected readonly pluralKey = pluralKey;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.controller?.abort();
      if (!this.started && this.prepared) {
        void this.prepared.zip.close();
      }
    });
  }

  /** Nombres affichés dans le résumé du projet. */
  protected counts(plan: ImportPlan): { scenes: number; sheets: number; media: number } {
    const { data } = plan;
    return {
      scenes: data.sceneNodes.filter((n) => n.kind === 'item').length,
      sheets: data.sheetNodes.filter((n) => n.kind === 'item').length,
      media: data.libraryNodes.filter((n) => n.kind === 'item').length,
    };
  }

  /** « Importer » ou « Remplacer » : écrit les médias puis les données du projet. */
  async import(): Promise<void> {
    if (!this.plan.hasValue() || this.importing()) {
      return;
    }
    const plan = this.plan.value();
    if (plan.insufficientSpace) {
      return;
    }
    const controller = new AbortController();
    this.controller = controller;
    this.started = true;
    this.progress.set({ importedBytes: 0, totalBytes: plan.bytes });
    try {
      const projectId = await this.importer.run(plan, {
        signal: controller.signal,
        onProgress: (p) => this.progress.set(p),
      });
      this.ref.close({
        projectId,
        name: plan.archive.data.project.name,
        withoutFile: plan.withoutFile,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        this.notifications.info(this.transloco.translate('transfer.import.cancelled'));
      } else {
        this.notifications.error(this.transloco.translate(messageKeyOf(error)));
      }
      // Le zip est refermé par `run()` : il faut rouvrir le fichier pour réessayer.
      this.ref.close();
    } finally {
      this.controller = null;
    }
  }

  /** « Annuler » : arrête l'import en cours (rien n'est gardé), ou ferme la fenêtre. */
  cancel(): void {
    if (this.controller) {
      this.controller.abort();
    } else {
      this.ref.close();
    }
  }
}

function messageKeyOf(error: unknown): string {
  if (error instanceof ArchiveError || isDataError(error)) {
    return error.messageKey;
  }
  return 'transfer.import.failed';
}
