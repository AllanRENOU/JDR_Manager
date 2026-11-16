import { BlobReader, BlobWriter, TextWriter, ZipReader } from '@zip.js/zip.js';

import { aProject } from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { ARCHIVE_DATA_PATH, ProjectArchive, buildArchive } from './project-archive';
import { ZipProgress, writeProjectZip } from './zip-writer';

describe('writeProjectZip', () => {
  useNodeBlob();

  const contents: Record<string, string> = {
    'm-carte': 'image de la carte',
    'm-pluie': 'son de la pluie, un peu plus long',
    'm-intro': 'vidéo',
  };
  const readMedia = (id: string) => Promise.resolve(new Blob([contents[id]]));

  function anArchive(): ProjectArchive {
    return buildArchive(
      {
        data: {
          project: aProject({ id: 'p1', name: 'La crypte' }),
          sceneNodes: [],
          scenes: [],
          battlemaps: [],
          actions: [],
          sheetNodes: [],
          sheets: [],
          libraryNodes: [],
        },
        media: [
          { id: 'm-carte', mimeType: 'image/png', size: 17, fileName: 'carte.png' },
          { id: 'm-pluie', mimeType: 'audio/ogg', size: 33, fileName: 'pluie.ogg' },
          { id: 'm-intro', mimeType: 'video/mp4', size: 6, fileName: 'intro.mp4' },
        ],
      },
      { includeVideos: false, includeLargeVideos: false },
      new Date('2026-11-16T10:00:00.000Z'),
    );
  }

  async function entriesOf(zip: Blob) {
    const reader = new ZipReader(new BlobReader(zip));
    const entries = await reader.getEntries();
    const result = new Map<string, { text: string; compressionMethod: number }>();
    for (const entry of entries) {
      if (!entry.directory) {
        result.set(entry.filename, {
          text: await entry.getData(new TextWriter()),
          compressionMethod: entry.compressionMethod,
        });
      }
    }
    await reader.close();
    return result;
  }

  it('écrit projet.json et les fichiers inclus, sous medias/<id>.<extension>', async () => {
    const archive = anArchive();
    const zip = await writeProjectZip<Blob>(new BlobWriter('application/zip'), archive, readMedia);
    const entries = await entriesOf(zip);

    expect([...entries.keys()]).toEqual([
      ARCHIVE_DATA_PATH,
      'medias/m-carte.png',
      'medias/m-pluie.ogg',
    ]);
    expect(JSON.parse(entries.get(ARCHIVE_DATA_PATH)!.text)).toEqual(archive);
    expect(entries.get('medias/m-pluie.ogg')?.text).toBe(contents['m-pluie']);
  });

  it('n’écrit pas le fichier d’une vidéo exclue', async () => {
    const zip = await writeProjectZip<Blob>(new BlobWriter(), anArchive(), readMedia);
    expect([...(await entriesOf(zip)).keys()]).not.toContain('medias/m-intro.mp4');
  });

  it('écrit les médias sans compression', async () => {
    const zip = await writeProjectZip<Blob>(new BlobWriter(), anArchive(), readMedia);
    expect((await entriesOf(zip)).get('medias/m-carte.png')?.compressionMethod).toBe(0);
  });

  it('signale l’avancement jusqu’au poids total', async () => {
    const progress: ZipProgress[] = [];
    await writeProjectZip<Blob>(new BlobWriter(), anArchive(), readMedia, {
      onProgress: (p) => progress.push(p),
    });
    const written = progress.map((p) => p.writtenBytes);
    expect(written).toEqual([...written].sort((a, b) => a - b));
    expect(written[0]).toBe(0);
    const last = progress.at(-1)!;
    expect(last.writtenBytes).toBe(last.totalBytes);
    // JSON + carte (17) + pluie (33) ; la vidéo exclue n'est pas comptée.
    expect(last.totalBytes).toBe(new TextEncoder().encode(JSON.stringify(anArchive())).length + 50);
  });

  it('s’arrête quand le MJ annule', async () => {
    const controller = new AbortController();
    const reads: string[] = [];
    const slowRead = (id: string) => {
      reads.push(id);
      controller.abort();
      return readMedia(id);
    };
    const writing = writeProjectZip<Blob>(new BlobWriter(), anArchive(), slowRead, {
      signal: controller.signal,
    });
    await expect(writing).rejects.toMatchObject({ name: 'AbortError' });
    expect(reads).toEqual(['m-carte']);
  });

  it('échoue si un média a disparu entre-temps', async () => {
    const failure = new Error('media-not-found');
    const writing = writeProjectZip<Blob>(new BlobWriter(), anArchive(), () =>
      Promise.reject(failure),
    );
    await expect(writing).rejects.toBe(failure);
  });
});
