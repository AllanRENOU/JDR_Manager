import { BlobReader, BlobWriter, Entry, FileEntry, TextWriter, ZipReader } from '@zip.js/zip.js';

import { ArchiveError, parseProjectArchive } from './archive-validation';
import {
  ARCHIVE_DATA_PATH,
  ArchiveMedia,
  ProjectArchive,
  archiveMediaPath,
} from './project-archive';

/** Taille maximale de `projet.json` (décompressé) : au-delà, le fichier est refusé. */
export const MAX_ARCHIVE_DATA_BYTES = 64 * 1024 ** 2;
/** Nombre maximal d'entrées dans le zip. */
const MAX_ENTRIES = 200_000;
/** En-tête local d'une entrée de zip : signature et longueur fixe (APPNOTE 4.3.7). */
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const LOCAL_HEADER_LENGTH = 30;

/** Export de projet ouvert : `projet.json` validé, fichiers des médias lus à la demande. */
export interface OpenedProjectZip {
  archive: ProjectArchive;
  /** Vrai si le fichier du média est dans le zip. */
  hasMediaFile(media: ArchiveMedia): boolean;
  /**
   * Fichier du média, ou `null` s'il n'est pas dans le zip. Un média écrit sans compression (cas
   * de nos exports) est une **portion** du fichier choisi, sans copie en mémoire, même pour une
   * vidéo de plusieurs Go.
   * @throws ArchiveError `invalid-data` si sa taille ne correspond pas à celle annoncée.
   */
  mediaFile(media: ArchiveMedia): Promise<File | null>;
  close(): Promise<void>;
}

/**
 * Ouvre un export de projet (lot 16.5) : lit la table des matières à la fin du zip, puis
 * `projet.json`, validé par `parseProjectArchive`. Rien n'est chargé d'autre. Les chemins du zip ne
 * servent jamais de chemins de fichiers : on cherche les chemins attendus (`archiveMediaPath`).
 * @throws ArchiveError
 */
export async function openProjectZip(file: Blob): Promise<OpenedProjectZip> {
  const reader = new ZipReader(new BlobReader(file), { useWebWorkers: false });
  try {
    let entries: Entry[];
    try {
      entries = await reader.getEntries();
    } catch {
      throw new ArchiveError('not-an-archive', 'zip');
    }
    if (entries.length > MAX_ENTRIES) {
      throw new ArchiveError('invalid-data', 'too-many-entries');
    }
    const files = new Map<string, FileEntry>();
    for (const entry of entries) {
      if (!entry.directory) {
        files.set(entry.filename, entry);
      }
    }
    const data = files.get(ARCHIVE_DATA_PATH);
    if (!data) {
      throw new ArchiveError('not-an-archive', ARCHIVE_DATA_PATH);
    }
    if (data.uncompressedSize > MAX_ARCHIVE_DATA_BYTES || data.encrypted) {
      throw new ArchiveError('invalid-data', ARCHIVE_DATA_PATH);
    }
    let json: unknown;
    try {
      json = JSON.parse(await data.getData(new TextWriter()));
    } catch {
      throw new ArchiveError('invalid-data', ARCHIVE_DATA_PATH);
    }
    const archive = parseProjectArchive(json);
    return {
      archive,
      hasMediaFile: (media) => files.has(archiveMediaPath(media)),
      mediaFile: (media) => readMedia(file, files.get(archiveMediaPath(media)), media),
      close: () => reader.close(),
    };
  } catch (error) {
    await reader.close().catch(() => undefined);
    throw error;
  }
}

async function readMedia(
  zip: Blob,
  entry: FileEntry | undefined,
  media: ArchiveMedia,
): Promise<File | null> {
  if (!entry) {
    return null;
  }
  if (entry.uncompressedSize !== media.size || entry.encrypted) {
    throw new ArchiveError('invalid-data', archiveMediaPath(media));
  }
  const type = media.mimeType;
  if (entry.compressionMethod === 0 && entry.compressedSize === entry.uncompressedSize) {
    const start = await dataOffset(zip, entry.offset);
    if (start !== null && start + media.size <= zip.size) {
      return new File([zip.slice(start, start + media.size, type)], media.fileName, { type });
    }
  }
  // Média compressé (zip refait par un autre outil) : décompressé par zip.js.
  const blob = await entry.getData(new BlobWriter(type));
  return new File([blob], media.fileName, { type });
}

/** Début des données d'une entrée : après son en-tête local, de longueur variable. */
async function dataOffset(zip: Blob, headerOffset: number): Promise<number | null> {
  const header = zip.slice(headerOffset, headerOffset + LOCAL_HEADER_LENGTH);
  const view = new DataView(await header.arrayBuffer());
  if (view.byteLength < LOCAL_HEADER_LENGTH || view.getUint32(0, true) !== LOCAL_HEADER_SIGNATURE) {
    return null;
  }
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  return headerOffset + LOCAL_HEADER_LENGTH + nameLength + extraLength;
}
