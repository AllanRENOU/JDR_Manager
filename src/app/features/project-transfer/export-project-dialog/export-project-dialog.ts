import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, DestroyRef, computed, inject, resource, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { isDataError } from '../../../core/data/data-error';
import { pluralKey } from '../../../core/i18n/plural';
import { mediaKindOfMime } from '../../../core/media/media-types';
import { MediaInfo, Project } from '../../../core/models';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { Modal } from '../../../shared/ui/modal/modal';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { formatFileSize } from '../../../shared/util/file-size';
import {
  DEFAULT_EXPORT_OPTIONS,
  ExportOptions,
  archiveFileName,
  buildArchive,
  isLargeVideo,
  isMediaIncluded,
} from '../project-archive';
import { ProjectExport } from '../project-export';
import { ZipProgress } from '../zip-writer';

export interface ExportProjectDialogData {
  project: Project;
}

/** Résultat : `true` si le projet a été exporté. */
export type ExportProjectDialogResult = boolean;

/**
 * Fenêtre « Exporter le projet » (16.4, PRJ-05, VID-13) : choix des vidéos, poids de l'export,
 * puis écriture du `.zip` avec sa progression et un bouton « Annuler ». À ouvrir avec
 * `closable: false` : seule cette fenêtre décide quand elle se ferme (pas pendant l'écriture).
 */
@Component({
  selector: 'app-export-project-dialog',
  imports: [Alert, Button, Modal, TranslocoPipe],
  templateUrl: './export-project-dialog.html',
  styleUrl: './export-project-dialog.scss',
})
export class ExportProjectDialog {
  private readonly ref = inject<DialogRef<ExportProjectDialogResult>>(DialogRef);
  private readonly exporter = inject(ProjectExport);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  protected readonly project = inject<ExportProjectDialogData>(DIALOG_DATA).project;

  /** Projet relu dans le dépôt (médias et tailles). */
  protected readonly collected = resource({
    loader: () => this.exporter.collect(this.project.id),
  });

  protected readonly options = signal<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  /** Avancement de l'écriture ; `null` tant que l'export n'a pas commencé. */
  protected readonly progress = signal<ZipProgress | null>(null);
  private controller: AbortController | null = null;

  private readonly media = computed<MediaInfo[]>(() =>
    this.collected.hasValue() ? this.collected.value().media : [],
  );
  private readonly videos = computed(() =>
    this.media().filter((m) => mediaKindOfMime(m.mimeType) === 'video'),
  );
  private readonly largeVideos = computed(() => this.videos().filter(isLargeVideo));

  protected readonly videoCount = computed(() => this.videos().length);
  protected readonly videoSize = computed(() => formatFileSize(sizeOf(this.videos())));
  protected readonly largeVideoCount = computed(() => this.largeVideos().length);
  protected readonly largeVideoSize = computed(() => formatFileSize(sizeOf(this.largeVideos())));
  /** Vidéos exportées sans leur fichier avec les choix actuels. */
  protected readonly excludedCount = computed(
    () => this.videos().filter((m) => !isMediaIncluded(m, this.options())).length,
  );
  private readonly bytes = computed(() =>
    sizeOf(this.media().filter((m) => isMediaIncluded(m, this.options()))),
  );
  protected readonly size = computed(() => formatFileSize(this.bytes()));
  /** Firefox : zip construit en mémoire, déconseillé au-delà de 2 Go. */
  protected readonly inMemoryWarning = computed(() => this.exporter.inMemoryWarning(this.bytes()));

  protected readonly exporting = computed(() => this.progress() !== null);
  protected readonly percent = computed(() => {
    const p = this.progress();
    return p && p.totalBytes > 0 ? Math.floor((p.writtenBytes / p.totalBytes) * 100) : 0;
  });
  protected readonly progressText = computed(() => {
    const p = this.progress();
    return p
      ? { written: formatFileSize(p.writtenBytes), total: formatFileSize(p.totalBytes) }
      : null;
  });

  protected readonly pluralKey = pluralKey;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  protected setIncludeVideos(includeVideos: boolean): void {
    this.options.update((o) => ({ ...o, includeVideos }));
  }

  protected setIncludeLargeVideos(includeLargeVideos: boolean): void {
    this.options.update((o) => ({ ...o, includeLargeVideos }));
  }

  /**
   * « Exporter » : le choix du fichier vient en premier, dans le geste du MJ
   * (`showSaveFilePicker()` l'exige), puis l'écriture.
   */
  async export(): Promise<void> {
    const collected = this.collected.value();
    if (!collected || this.exporting()) {
      return;
    }
    let destination;
    try {
      destination = await this.exporter.pickDestination(archiveFileName(this.project.name));
    } catch (error) {
      this.notifyFailure(error);
      return;
    }
    if (!destination) {
      return;
    }
    const controller = new AbortController();
    this.controller = controller;
    const archive = buildArchive(collected, this.options());
    this.progress.set({ writtenBytes: 0, totalBytes: 0 });
    try {
      await this.exporter.write(destination, archive, {
        signal: controller.signal,
        onProgress: (p) => this.progress.set(p),
      });
      this.ref.close(true);
    } catch (error) {
      if (controller.signal.aborted) {
        this.notifications.info(this.transloco.translate('transfer.export.cancelled'));
        this.ref.close(false);
        return;
      }
      this.progress.set(null);
      this.notifyFailure(error);
    } finally {
      this.controller = null;
    }
  }

  /** « Annuler » : arrête l'écriture en cours, ou ferme la fenêtre. */
  cancel(): void {
    if (this.controller) {
      this.controller.abort();
    } else {
      this.ref.close(false);
    }
  }

  private notifyFailure(error: unknown): void {
    if (isDataError(error)) {
      this.notifications.fromError(error);
    } else {
      this.notifications.error(this.transloco.translate('transfer.export.failed'));
    }
  }
}

function sizeOf(media: MediaInfo[]): number {
  return media.reduce((total, m) => total + m.size, 0);
}
