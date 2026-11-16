import { ProjectData } from '../../core/data/data-repository';
import { LARGE_VIDEO_BYTES, mediaKindOfMime } from '../../core/media/media-types';
import { Id, MediaInfo } from '../../core/models';

/**
 * Format d'export d'un projet (lot 16, PRJ-05) : un `.zip` qui contient `projet.json`
 * (`ProjectArchive`) et chaque fichier inclus sous `medias/<id>.<extension>`.
 * Le lecteur hors ligne (lot 12 bis) lit le même format.
 */

/** Identifie un export de JDR Manager. */
export const ARCHIVE_FORMAT = 'jdr-manager-project';

/**
 * Version du format. Toute modification qui empêche une ancienne version de lire le fichier
 * l'incrémente ; l'import refuse une version plus récente que la sienne.
 */
export const ARCHIVE_VERSION = 1;

/** Chemin du fichier JSON dans le zip. */
export const ARCHIVE_DATA_PATH = 'projet.json';

/** Média décrit dans l'export, avec ou sans son fichier. */
export interface ArchiveMedia extends MediaInfo {
  /**
   * `true` : le fichier est dans le zip (`archiveMediaPath`). `false` : vidéo exclue de l'export,
   * créée sans fichier à l'import (VID-13).
   */
  included: boolean;
}

/** Contenu de `projet.json`. */
export interface ProjectArchive {
  format: typeof ARCHIVE_FORMAT;
  version: number;
  /** Date ISO 8601 de l'export. */
  exportedAt: string;
  /**
   * Objets du projet. Les nœuds de bibliothèque gardent leur `libraryId` d'origine (projet ou
   * `'global'`) : c'est l'import qui les range dans la bibliothèque du projet.
   */
  data: ProjectData;
  /** Médias référencés par le projet et présents à l'export (un média absent n'y est pas). */
  media: ArchiveMedia[];
}

/** Choix de la fenêtre « Exporter le projet » (VID-13). */
export interface ExportOptions {
  /** « Inclure les vidéos » (coché par défaut). */
  includeVideos: boolean;
  /** Inclure aussi les vidéos de plus de 500 Mo (décoché par défaut). */
  includeLargeVideos: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeVideos: true,
  includeLargeVideos: false,
};

/** Projet relu dans le dépôt, avant les choix d'export. */
export interface CollectedProject {
  data: ProjectData;
  /** Médias présents référencés par le projet (battlemaps, sons et vidéos exportés). */
  media: MediaInfo[];
}

/** Vrai si le média est une vidéo de plus de 500 Mo. */
export function isLargeVideo(media: Pick<MediaInfo, 'mimeType' | 'size'>): boolean {
  return mediaKindOfMime(media.mimeType) === 'video' && media.size > LARGE_VIDEO_BYTES;
}

/** Vrai si le fichier du média est écrit dans le zip avec ces choix (seules les vidéos sont exclues). */
export function isMediaIncluded(
  media: Pick<MediaInfo, 'mimeType' | 'size'>,
  options: ExportOptions,
): boolean {
  if (mediaKindOfMime(media.mimeType) !== 'video') {
    return true;
  }
  return options.includeVideos && (options.includeLargeVideos || !isLargeVideo(media));
}

/** Construit le contenu de `projet.json` selon les choix d'export. */
export function buildArchive(
  project: CollectedProject,
  options: ExportOptions,
  exportedAt: Date = new Date(),
): ProjectArchive {
  return {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: project.data,
    media: project.media.map((media) => ({ ...media, included: isMediaIncluded(media, options) })),
  };
}

/** Poids des fichiers inclus, en octets (le JSON, négligeable, n'est pas compté). */
export function archiveMediaBytes(archive: Pick<ProjectArchive, 'media'>): number {
  return archive.media.reduce((total, media) => total + (media.included ? media.size : 0), 0);
}

/** Extension de fichier d'un type MIME accepté. */
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/**
 * Chemin du fichier d'un média dans le zip. Il ne dépend que de l'`id` et du type validés : à
 * l'import, on cherche ce chemin, on n'utilise jamais les chemins lus dans le zip.
 */
export function archiveMediaPath(media: { id: Id; mimeType: string }): string {
  return `medias/${media.id}.${EXTENSIONS[media.mimeType] ?? 'bin'}`;
}

/** Nom du fichier `.zip` proposé : le nom du projet, sans les caractères interdits des systèmes de fichiers. */
export function archiveFileName(projectName: string): string {
  const safe = projectName
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/[\p{Cc}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  return `${safe || 'projet'}.zip`;
}
