import { Service, inject } from '@angular/core';

import { DATA_REPOSITORY, ProjectData } from '../../core/data/data-repository';
import { StoragePersistence } from '../../core/data/storage-persistence';
import { Id, Project } from '../../core/models';
import { ArchiveMedia, ProjectArchive } from './project-archive';
import { OpenedProjectZip, openProjectZip } from './zip-reader';

/** Import prêt à être lancé, avec ce qu'il faut montrer au MJ avant de confirmer. */
export interface ImportPlan {
  archive: ProjectArchive;
  /** Objets à écrire : tous les nœuds de bibliothèque rangés dans la bibliothèque du projet. */
  data: ProjectData;
  /** Projet de même identifiant déjà présent (il sera remplacé), sinon `null`. */
  existing: Project | null;
  /** Médias à écrire : absents de ce navigateur et présents dans le zip. */
  toImport: ArchiveMedia[];
  /** Poids des médias à écrire, en octets. */
  bytes: number;
  /** Médias déjà présents sur ce navigateur, non réimportés. */
  alreadyPresent: number;
  /** Médias qui resteront sans fichier (vidéos exportées sans fichier, fichiers absents du zip). */
  withoutFile: number;
  /** Place insuffisante d'après l'estimation du navigateur, sinon `null`. */
  insufficientSpace: { needed: number; available: number } | null;
  zip: OpenedProjectZip;
}

/** Avancement de l'import : médias écrits (les données du projet s'écrivent à la fin). */
export interface ImportProgress {
  importedBytes: number;
  totalBytes: number;
}

export interface RunImportOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ImportProgress) => void;
}

/**
 * Import d'un projet exporté (lot 16.5, PRJ-05). Les identifiants sont conservés : un média déjà
 * présent n'est pas réimporté, les autres objets de même identifiant sont remplacés, rien de local
 * n'est supprimé, la partie sauvegardée n'est pas touchée ; tous les sons et vidéos vont dans la
 * bibliothèque du projet (décisions d'Allan, 16/11/2026).
 */
@Service()
export class ProjectImport {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly storage = inject(StoragePersistence);

  /**
   * Ouvre et valide le fichier, puis prépare l'import sans rien écrire. Le MJ voit le résultat et
   * confirme ; `plan.zip.close()` libère le fichier s'il renonce.
   * @throws ArchiveError
   */
  async prepare(file: Blob): Promise<ImportPlan> {
    const zip = await openProjectZip(file);
    try {
      const { archive } = zip;
      const projectId = archive.data.project.id;
      const data: ProjectData = {
        ...archive.data,
        libraryNodes: archive.data.libraryNodes.map((n) => ({ ...n, libraryId: projectId })),
      };
      const referenced = new Set([
        ...(data.project.imageMediaId ? [data.project.imageMediaId] : []),
        ...data.battlemaps.map((b) => b.mediaId),
        ...data.libraryNodes.flatMap((n) => (n.kind === 'item' && n.mediaId ? [n.mediaId] : [])),
      ]);
      const present = new Set(
        (await this.repository.getMediaInfo([...referenced])).map((m) => m.id),
      );
      const toImport = archive.media.filter(
        (m) => referenced.has(m.id) && !present.has(m.id) && m.included && zip.hasMediaFile(m),
      );
      const willExist = new Set([...present, ...toImport.map((m) => m.id)]);
      const bytes = toImport.reduce((total, m) => total + m.size, 0);
      return {
        archive,
        data,
        existing: (await this.repository.getProject(projectId)) ?? null,
        toImport,
        bytes,
        alreadyPresent: present.size,
        withoutFile: [...referenced].filter((id) => !willExist.has(id)).length,
        insufficientSpace: await this.checkSpace(bytes),
        zip,
      };
    } catch (error) {
      await zip.close().catch(() => undefined);
      throw error;
    }
  }

  /**
   * Écrit les médias un par un, puis toutes les données du projet en une transaction. En cas
   * d'erreur ou d'annulation, les médias déjà écrits sont supprimés : rien n'est à moitié importé.
   * Le zip est refermé à la fin.
   * @returns l'identifiant du projet importé.
   * @throws DataError (`quota-exceeded`…), ArchiveError ou `AbortError`.
   */
  async run(plan: ImportPlan, options: RunImportOptions = {}): Promise<Id> {
    const { signal, onProgress } = options;
    const written: Id[] = [];
    let importedBytes = 0;
    try {
      onProgress?.({ importedBytes, totalBytes: plan.bytes });
      for (const media of plan.toImport) {
        signal?.throwIfAborted();
        const file = await plan.zip.mediaFile(media);
        if (file) {
          const details = media.durationMs === undefined ? {} : { durationMs: media.durationMs };
          if (await this.repository.importMedia(media.id, file, details)) {
            written.push(media.id);
          }
        }
        importedBytes += media.size;
        onProgress?.({ importedBytes, totalBytes: plan.bytes });
      }
      signal?.throwIfAborted();
      await this.repository.importProjectData(plan.data);
      return plan.data.project.id;
    } catch (error) {
      for (const id of written) {
        // Supprimé seulement s'il n'est pas utilisé (ex. vidéo locale qui attendait ce fichier).
        await this.repository.deleteMedia(id).catch(() => undefined);
      }
      throw signal?.aborted ? signal.reason : error;
    } finally {
      await plan.zip.close().catch(() => undefined);
    }
  }

  /** Place libre estimée insuffisante pour `bytes` ; `null` si elle suffit ou est inconnue. */
  private async checkSpace(bytes: number): Promise<ImportPlan['insufficientSpace']> {
    const estimate = await this.storage.estimate();
    if (!estimate) {
      return null;
    }
    const available = Math.max(0, estimate.quota - estimate.usage);
    return bytes > available ? { needed: bytes, available } : null;
  }
}
