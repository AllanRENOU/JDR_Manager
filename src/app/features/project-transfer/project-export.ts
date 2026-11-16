import { DOCUMENT, Service, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BlobWriter } from '@zip.js/zip.js';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { Id } from '../../core/models';
import { collectProject } from './collect-project';
import { CollectedProject, ProjectArchive } from './project-archive';
import { WriteZipOptions, writeProjectZip } from './zip-writer';

/**
 * Au-delà de 2 Go, l'export construit en mémoire (Firefox) est déconseillé : le navigateur peut
 * manquer de mémoire. La fenêtre d'export avertit le MJ (décision d'Allan, 16/11/2026).
 */
export const IN_MEMORY_EXPORT_WARNING_BYTES = 2 * 1024 ** 3;

/** Délai avant de libérer l'URL du zip téléchargé (le téléchargement doit avoir commencé). */
const DOWNLOAD_URL_LIFETIME_MS = 60_000;

/** Où écrire le zip, choisi au clic sur « Exporter ». */
export type ExportDestination =
  /** Chrome, Edge : fichier choisi par le MJ, écrit en flux. */
  | { kind: 'file'; writable: FileSystemWritableFileStream }
  /** Firefox : zip construit en mémoire, puis téléchargé sous ce nom. */
  | { kind: 'download'; fileName: string };

/** `showSaveFilePicker()` (File System Access API, Chrome et Edge), absent des types du DOM. */
interface SaveFilePicker {
  showSaveFilePicker?(options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }): Promise<FileSystemFileHandle>;
}

/**
 * Export d'un projet en `.zip` (lot 16, PRJ-05) : relecture du projet, choix du fichier, écriture
 * en flux (Chrome, Edge) ou en mémoire puis téléchargement (Firefox).
 */
@Service()
export class ProjectExport {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);

  private get picker(): SaveFilePicker {
    return (this.document.defaultView ?? {}) as SaveFilePicker;
  }

  /** Vrai si le navigateur écrit le zip directement sur le disque (Chrome, Edge). */
  get streamsToDisk(): boolean {
    return typeof this.picker.showSaveFilePicker === 'function';
  }

  /** Vrai s'il faut avertir le MJ : zip construit en mémoire (Firefox) et de plus de 2 Go. */
  inMemoryWarning(bytes: number): boolean {
    return !this.streamsToDisk && bytes > IN_MEMORY_EXPORT_WARNING_BYTES;
  }

  /** Projet à exporter, relu dans le dépôt (fenêtre d'export : poids, vidéos). */
  collect(projectId: Id): Promise<CollectedProject> {
    return collectProject(this.repository, projectId);
  }

  /**
   * Choix de la destination. À appeler **au début** du gestionnaire du clic « Exporter » :
   * `showSaveFilePicker()` exige un geste du MJ.
   * @returns `null` si le MJ ferme la fenêtre d'enregistrement sans choisir de fichier.
   */
  async pickDestination(fileName: string): Promise<ExportDestination | null> {
    const picker = this.picker;
    if (typeof picker.showSaveFilePicker !== 'function') {
      return { kind: 'download', fileName };
    }
    try {
      const handle = await picker.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: this.transloco.translate('transfer.fileType'),
            accept: { 'application/zip': ['.zip'] },
          },
        ],
      });
      return { kind: 'file', writable: await handle.createWritable() };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Écrit le zip vers la destination choisie. En cas d'erreur ou d'annulation, un fichier choisi
   * sur le disque est abandonné (Chrome n'enregistre le fichier qu'à la fin) et rien n'est
   * téléchargé.
   * @throws l'erreur de lecture d'un média, de quota du disque, ou `AbortError`.
   */
  async write(
    destination: ExportDestination,
    archive: ProjectArchive,
    options: WriteZipOptions = {},
  ): Promise<void> {
    const readMedia = (id: Id) => this.repository.getMediaBlob(id);
    if (destination.kind === 'file') {
      try {
        await writeProjectZip(destination.writable, archive, readMedia, options);
      } catch (error) {
        await destination.writable.abort(error).catch(() => undefined);
        throw error;
      }
      return;
    }
    const zip = await writeProjectZip<Blob>(
      new BlobWriter('application/zip'),
      archive,
      readMedia,
      options,
    );
    options.signal?.throwIfAborted();
    this.download(zip, destination.fileName);
  }

  /** Propose le zip au téléchargement (Firefox). */
  private download(zip: Blob, fileName: string): void {
    const url = URL.createObjectURL(zip);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    this.document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
  }
}
