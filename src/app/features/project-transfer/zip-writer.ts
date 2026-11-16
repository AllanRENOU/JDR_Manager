import { BlobReader, TextReader, WritableWriter, Writer, ZipWriter } from '@zip.js/zip.js';

import { Id } from '../../core/models';
import {
  ARCHIVE_DATA_PATH,
  ProjectArchive,
  archiveMediaBytes,
  archiveMediaPath,
} from './project-archive';

/** Avancement de l'écriture du zip, en octets (fichiers des médias et JSON). */
export interface ZipProgress {
  writtenBytes: number;
  totalBytes: number;
}

export interface WriteZipOptions {
  /** Annulation par le MJ : l'écriture s'arrête et la promesse est rejetée (`AbortError`). */
  signal?: AbortSignal;
  onProgress?: (progress: ZipProgress) => void;
}

/** Destination du zip : un flux (fichier choisi sur le disque) ou l'écrivain de zip.js. */
export type ZipOutput<T> = Writer<T> | WritableWriter | WritableStream;

/**
 * Écrit l'export d'un projet en `.zip` (lot 16.3) : `projet.json` (compressé), puis chaque média
 * inclus, **sans compression** (images, sons et vidéos sont déjà compressés) et lu en flux depuis
 * son `Blob`, sans le copier en mémoire. Zip64 automatique au-delà de 4 Go.
 *
 * Sans Web Worker : rien à charger à part, ce qui reste compatible avec un lancement depuis un
 * fichier (lot 12 bis).
 * @param readMedia contenu d'un média (`DataRepository.getMediaBlob`).
 * @returns ce que renvoie l'écrivain (ex. le `Blob` d'un `BlobWriter`).
 */
export async function writeProjectZip<T>(
  output: ZipOutput<T>,
  archive: ProjectArchive,
  readMedia: (id: Id) => Promise<Blob>,
  options: WriteZipOptions = {},
): Promise<T> {
  const { signal, onProgress } = options;
  const json = JSON.stringify(archive);
  const jsonBytes = new TextEncoder().encode(json).length;
  const totalBytes = jsonBytes + archiveMediaBytes(archive);
  let doneBytes = 0;
  const report = (entryBytes: number) =>
    onProgress?.({ writtenBytes: Math.min(doneBytes + entryBytes, totalBytes), totalBytes });

  const lastModDate = new Date(archive.exportedAt);
  const zip = new ZipWriter<T>(output, {
    useWebWorkers: false,
    lastModDate,
    signal,
  });
  try {
    report(0);
    await zip.add(ARCHIVE_DATA_PATH, new TextReader(json), { level: 6 });
    doneBytes += jsonBytes;
    report(0);
    for (const media of archive.media) {
      if (!media.included) {
        continue;
      }
      signal?.throwIfAborted();
      const blob = await readMedia(media.id);
      await zip.add(archiveMediaPath(media), new BlobReader(blob), {
        level: 0,
        onprogress: (progress) => report(progress),
      });
      doneBytes += media.size;
      report(0);
    }
    signal?.throwIfAborted();
    return await zip.close();
  } catch (error) {
    // Le flux de sortie est interrompu : un fichier sur le disque n'est pas validé (voir ProjectExport).
    throw signal?.aborted ? signal.reason : error;
  }
}
