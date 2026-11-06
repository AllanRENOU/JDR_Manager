/** Catégorie d'un média importé. */
export type MediaKind = 'image' | 'sound';

export interface MediaType {
  kind: MediaKind;
  /** Type MIME normalisé, enregistré avec le média. */
  mimeType: string;
}

/**
 * Formats acceptés à l'import (TEC-34), par extension.
 * Le type MIME fourni par le navigateur est parfois vide ou non standard (ex. `audio/x-m4a`) :
 * on le normalise à partir de cette table.
 */
const BY_EXTENSION: Record<string, MediaType> = {
  png: { kind: 'image', mimeType: 'image/png' },
  jpg: { kind: 'image', mimeType: 'image/jpeg' },
  jpeg: { kind: 'image', mimeType: 'image/jpeg' },
  webp: { kind: 'image', mimeType: 'image/webp' },
  mp3: { kind: 'sound', mimeType: 'audio/mpeg' },
  ogg: { kind: 'sound', mimeType: 'audio/ogg' },
  wav: { kind: 'sound', mimeType: 'audio/wav' },
  m4a: { kind: 'sound', mimeType: 'audio/mp4' },
};

/** Variantes de types MIME rencontrées selon les navigateurs et systèmes. */
const BY_MIME: Record<string, MediaType> = {
  'image/png': BY_EXTENSION['png'],
  'image/jpeg': BY_EXTENSION['jpg'],
  'image/pjpeg': BY_EXTENSION['jpg'],
  'image/webp': BY_EXTENSION['webp'],
  'audio/mpeg': BY_EXTENSION['mp3'],
  'audio/mp3': BY_EXTENSION['mp3'],
  'audio/ogg': BY_EXTENSION['ogg'],
  'application/ogg': BY_EXTENSION['ogg'],
  'audio/wav': BY_EXTENSION['wav'],
  'audio/wave': BY_EXTENSION['wav'],
  'audio/x-wav': BY_EXTENSION['wav'],
  'audio/vnd.wave': BY_EXTENSION['wav'],
  'audio/mp4': BY_EXTENSION['m4a'],
  'audio/x-m4a': BY_EXTENSION['m4a'],
  'audio/m4a': BY_EXTENSION['m4a'],
};

/** Valeur de l'attribut `accept` d'un `<input type="file">` pour une catégorie. */
export function acceptAttribute(kind: MediaKind): string {
  const entries = Object.entries(BY_EXTENSION).filter(([, type]) => type.kind === kind);
  return [
    ...entries.map(([ext]) => `.${ext}`),
    ...new Set(entries.map(([, t]) => t.mimeType)),
  ].join(',');
}

/**
 * Détermine le type d'un fichier à importer : d'abord son type MIME, sinon son extension.
 * @returns `null` si le format n'est pas accepté (TEC-34).
 */
export function resolveMediaType(file: Pick<File, 'name' | 'type'>): MediaType | null {
  const mime = file.type.toLowerCase().split(';')[0].trim();
  if (mime && BY_MIME[mime]) {
    return BY_MIME[mime];
  }
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  // Un type MIME connu mais d'une autre famille (ex. vidéo .mp4) reste refusé.
  if (
    mime &&
    !mime.startsWith('image/') &&
    !mime.startsWith('audio/') &&
    mime !== 'application/octet-stream'
  ) {
    return null;
  }
  return BY_EXTENSION[extension] ?? null;
}

/** Libellés des formats acceptés, pour les messages (ex. « PNG, JPG, WebP »). */
export const FORMAT_LABELS: Record<MediaKind, readonly string[]> = {
  image: ['PNG', 'JPG', 'WebP'],
  sound: ['MP3', 'OGG', 'WAV', 'M4A'],
};

/** Libellé court du format d'un média enregistré (colonne « Format » du tableau des sons). */
const LABEL_BY_MIME: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
  'audio/mpeg': 'MP3',
  'audio/ogg': 'OGG',
  'audio/wav': 'WAV',
  'audio/mp4': 'M4A',
};

/** Libellé du format d'un type MIME normalisé ; à défaut, la partie après « / » en majuscules. */
export function formatLabel(mimeType: string): string {
  return LABEL_BY_MIME[mimeType] ?? (mimeType.split('/').pop() ?? '').toUpperCase();
}
