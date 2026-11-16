import { TestBed } from '@angular/core/testing';
import { BlobReader, ZipReader } from '@zip.js/zip.js';

import { DATA_REPOSITORY, DataRepository } from '../../core/data/data-repository';
import { aProject } from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { stubObjectUrls } from '../../../testing/object-url';
import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { ProjectArchive, buildArchive } from './project-archive';
import { ExportDestination, IN_MEMORY_EXPORT_WARNING_BYTES, ProjectExport } from './project-export';

type PickerWindow = Window & { showSaveFilePicker?: unknown };

describe('ProjectExport', () => {
  useNodeBlob();
  const objectUrls = stubObjectUrls();
  let service: ProjectExport;
  let getMediaBlob: ReturnType<typeof vi.fn<DataRepository['getMediaBlob']>>;

  beforeEach(() => {
    getMediaBlob = vi.fn((id: string) => Promise.resolve(new Blob([`contenu ${id}`])));
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        { provide: DATA_REPOSITORY, useValue: { getMediaBlob } as Partial<DataRepository> },
      ],
    });
    service = TestBed.inject(ProjectExport);
  });

  afterEach(() => {
    delete (window as PickerWindow).showSaveFilePicker;
  });

  function anArchive(): ProjectArchive {
    return buildArchive(
      {
        data: {
          project: aProject({ id: 'p1' }),
          sceneNodes: [],
          scenes: [],
          battlemaps: [],
          actions: [],
          sheetNodes: [],
          sheets: [],
          libraryNodes: [],
        },
        media: [{ id: 'm1', mimeType: 'image/png', size: 10, fileName: 'carte.png' }],
      },
      { includeVideos: true, includeLargeVideos: false },
    );
  }

  /** Fichier choisi sur le disque, simulé par un flux qui garde ce qu'il reçoit. */
  function aFileStream() {
    const chunks: Uint8Array[] = [];
    let closed = false;
    const stream = new WritableStream<Uint8Array>({
      write: (chunk) => void chunks.push(chunk),
      close: () => void (closed = true),
    });
    const abort = vi.spyOn(stream, 'abort');
    return {
      writable: stream as unknown as FileSystemWritableFileStream,
      abort,
      isClosed: () => closed,
      blob: () => new Blob(chunks as BlobPart[]),
    };
  }

  async function entryNames(zip: Blob): Promise<string[]> {
    const reader = new ZipReader(new BlobReader(zip));
    const names = (await reader.getEntries()).map((e) => e.filename);
    await reader.close();
    return names;
  }

  describe('sans showSaveFilePicker (Firefox)', () => {
    it('construit le zip en mémoire et avertit au-delà de 2 Go', () => {
      expect(service.streamsToDisk).toBe(false);
      expect(service.inMemoryWarning(IN_MEMORY_EXPORT_WARNING_BYTES)).toBe(false);
      expect(service.inMemoryWarning(IN_MEMORY_EXPORT_WARNING_BYTES + 1)).toBe(true);
    });

    it('propose le téléchargement sous le nom donné', async () => {
      expect(await service.pickDestination('La crypte.zip')).toEqual({
        kind: 'download',
        fileName: 'La crypte.zip',
      });
    });

    it('télécharge le zip une fois écrit', async () => {
      const clicks: HTMLAnchorElement[] = [];
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        clicks.push(this);
      });

      await service.write({ kind: 'download', fileName: 'La crypte.zip' }, anArchive());
      click.mockRestore();

      expect(clicks).toHaveLength(1);
      expect(clicks[0].download).toBe('La crypte.zip');
      expect(clicks[0].href).toBe('blob:test/1');
      expect(clicks[0].isConnected).toBe(false);
      const zip = objectUrls.createObjectURL.mock.calls[0][0];
      expect(zip.type).toBe('application/zip');
      expect(await entryNames(zip)).toEqual(['projet.json', 'medias/m1.png']);
    });

    it('ne télécharge rien si le MJ annule', async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(
        service.write({ kind: 'download', fileName: 'a.zip' }, anArchive(), {
          signal: controller.signal,
        }),
      ).rejects.toMatchObject({ name: 'AbortError' });
      expect(objectUrls.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('avec showSaveFilePicker (Chrome, Edge)', () => {
    it('demande le fichier au MJ et écrit le zip en flux', async () => {
      const file = aFileStream();
      const picker = vi.fn(() =>
        Promise.resolve({ createWritable: () => Promise.resolve(file.writable) }),
      );
      (window as PickerWindow).showSaveFilePicker = picker;
      expect(service.streamsToDisk).toBe(true);
      expect(service.inMemoryWarning(IN_MEMORY_EXPORT_WARNING_BYTES + 1)).toBe(false);

      const destination = await service.pickDestination('La crypte.zip');
      expect(picker).toHaveBeenCalledWith({
        suggestedName: 'La crypte.zip',
        types: [
          { description: 'Projet JDR Manager (zip)', accept: { 'application/zip': ['.zip'] } },
        ],
      });
      expect(destination).toEqual({ kind: 'file', writable: file.writable });

      await service.write(destination!, anArchive());
      expect(file.isClosed()).toBe(true);
      expect(await entryNames(file.blob())).toEqual(['projet.json', 'medias/m1.png']);
      expect(getMediaBlob).toHaveBeenCalledWith('m1');
    });

    it('renvoie null si le MJ ferme la fenêtre d’enregistrement', async () => {
      (window as PickerWindow).showSaveFilePicker = () =>
        Promise.reject(new DOMException('Annulé', 'AbortError'));
      expect(await service.pickDestination('a.zip')).toBeNull();
    });

    it('laisse passer les autres erreurs du choix du fichier', async () => {
      const failure = new DOMException('Refusé', 'SecurityError');
      (window as PickerWindow).showSaveFilePicker = () => Promise.reject(failure);
      await expect(service.pickDestination('a.zip')).rejects.toBe(failure);
    });

    it('abandonne le fichier si l’écriture échoue', async () => {
      const failure = new Error('média disparu');
      getMediaBlob.mockRejectedValue(failure);
      const file = aFileStream();
      const destination: ExportDestination = { kind: 'file', writable: file.writable };

      await expect(service.write(destination, anArchive())).rejects.toBe(failure);
      expect(file.isClosed()).toBe(false);
    });
  });
});
