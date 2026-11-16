import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataError } from '../../../core/data/data-error';
import { LARGE_VIDEO_BYTES } from '../../../core/media/media-types';
import { MediaInfo } from '../../../core/models';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { aProject } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { CollectedProject, ProjectArchive } from '../project-archive';
import { ExportDestination, ProjectExport } from '../project-export';
import { WriteZipOptions } from '../zip-writer';
import { ExportProjectDialog } from './export-project-dialog';

const project = aProject({ id: 'p1', name: 'La crypte' });
const image: MediaInfo = { id: 'm1', mimeType: 'image/png', size: 1024, fileName: 'carte.png' };
const video: MediaInfo = { id: 'm2', mimeType: 'video/mp4', size: 2048, fileName: 'intro.mp4' };
const largeVideo: MediaInfo = {
  id: 'm3',
  mimeType: 'video/webm',
  size: LARGE_VIDEO_BYTES + 1,
  fileName: 'film.webm',
};

describe('ExportProjectDialog', () => {
  let fixture: ComponentFixture<ExportProjectDialog>;
  let close: ReturnType<typeof vi.fn>;
  let exporter: {
    streamsToDisk: boolean;
    inMemoryWarning: ReturnType<typeof vi.fn<(bytes: number) => boolean>>;
    collect: ReturnType<typeof vi.fn<() => Promise<CollectedProject>>>;
    pickDestination: ReturnType<typeof vi.fn<() => Promise<ExportDestination | null>>>;
    write: ReturnType<
      typeof vi.fn<(d: ExportDestination, a: ProjectArchive, o?: WriteZipOptions) => Promise<void>>
    >;
  };

  function collected(media: MediaInfo[]): CollectedProject {
    return {
      data: {
        project,
        sceneNodes: [],
        scenes: [],
        battlemaps: [],
        actions: [],
        sheetNodes: [],
        sheets: [],
        libraryNodes: [],
      },
      media,
    };
  }

  async function open(media: MediaInfo[] = [image, video, largeVideo]): Promise<void> {
    exporter.collect.mockResolvedValue(collected(media));
    fixture = TestBed.createComponent(ExportProjectDialog);
    await fixture.whenStable();
  }

  beforeEach(() => {
    close = vi.fn();
    exporter = {
      streamsToDisk: true,
      inMemoryWarning: vi.fn(() => false),
      collect: vi.fn(),
      pickDestination: vi.fn(() => Promise.resolve({ kind: 'download', fileName: 'x.zip' })),
      write: vi.fn(() => Promise.resolve()),
    };
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: { project } },
        { provide: ProjectExport, useValue: exporter },
      ],
    });
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const checkboxes = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
  ];
  const button = (label: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    )!;

  async function toggle(input: HTMLInputElement): Promise<void> {
    input.click();
    await fixture.whenStable();
  }

  it('relit le projet et affiche le poids de l’export, sans les vidéos de plus de 500 Mo', async () => {
    await open();
    expect(exporter.collect).toHaveBeenCalledWith('p1');
    expect(text()).toContain('La crypte');
    expect(text()).toContain('Poids de l’export : 3 Ko');
    const [videos, large] = checkboxes();
    expect(videos.checked).toBe(true);
    expect(large.checked).toBe(false);
    expect(text()).toContain('2 vidéos · ');
    expect(text()).toContain('1 vidéo de plus de 500 Mo');
    expect(text()).toContain('1 vidéo sera exportée sans son fichier');
  });

  it('ajoute les vidéos de plus de 500 Mo sur demande', async () => {
    await open();
    await toggle(checkboxes()[1]);
    expect(text()).toContain('Poids de l’export : 500 Mo');
    expect(text()).not.toContain('sans son fichier');
  });

  it('sans « Inclure les vidéos », exclut toutes les vidéos', async () => {
    await open();
    await toggle(checkboxes()[0]);
    expect(text()).toContain('Poids de l’export : 1 Ko');
    expect(checkboxes()[1].disabled).toBe(true);
    expect(text()).toContain('2 vidéos seront exportées sans leur fichier');
  });

  it('ne montre pas les cases des vidéos si le projet n’en a pas', async () => {
    await open([image]);
    expect(checkboxes()).toHaveLength(0);
    expect(text()).toContain('Poids de l’export : 1 Ko');
  });

  it('avertit au-delà de 2 Go quand le zip est construit en mémoire (Firefox)', async () => {
    exporter.inMemoryWarning.mockReturnValue(true);
    await open();
    expect(text()).toContain('au-delà de 2 Go');
  });

  it('choisit le fichier, écrit le zip selon les choix et se ferme', async () => {
    await open();
    exporter.write.mockImplementation(async (_d, _a, options) => {
      options?.onProgress?.({ writtenBytes: 50, totalBytes: 100 });
      await fixture.whenStable();
      expect(text()).toContain('Export en cours');
      const bar = (fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]');
      expect(bar?.getAttribute('aria-valuenow')).toBe('50');
    });

    button('Exporter').click();
    await fixture.whenStable();

    expect(exporter.pickDestination).toHaveBeenCalledWith('La crypte.zip');
    const archive = exporter.write.mock.calls[0][1];
    expect(archive.media.map((m) => m.included)).toEqual([true, true, false]);
    await vi.waitFor(() => expect(close).toHaveBeenCalledWith(true));
  });

  it('ne fait rien si le MJ ferme la fenêtre d’enregistrement', async () => {
    exporter.pickDestination.mockResolvedValue(null);
    await open();
    button('Exporter').click();
    await fixture.whenStable();
    expect(exporter.write).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('arrête l’export avec « Annuler » et se ferme', async () => {
    await open();
    let signal: AbortSignal | undefined;
    exporter.write.mockImplementation(
      (_d, _a, options) =>
        new Promise((_, reject) => {
          signal = options?.signal;
          signal?.addEventListener('abort', () => reject(signal?.reason));
        }),
    );
    button('Exporter').click();
    await fixture.whenStable();
    expect(button('Exporter')).toBeUndefined();

    button('Annuler').click();
    await fixture.whenStable();
    expect(signal?.aborted).toBe(true);
    expect(close).toHaveBeenCalledWith(false);
    expect(
      TestBed.inject(Notifications)
        .notifications()
        .map((n) => n.message),
    ).toContain('Export annulé.');
  });

  it('signale un échec et revient aux choix', async () => {
    await open();
    exporter.write.mockRejectedValue(new DataError('media-not-found', 'disparu'));
    button('Exporter').click();
    await fixture.whenStable();
    expect(close).not.toHaveBeenCalled();
    expect(text()).toContain('Poids de l’export');
    expect(
      TestBed.inject(Notifications)
        .notifications()
        .map((n) => n.message),
    ).toContain('Fichier introuvable : il a peut-être été supprimé.');
  });

  it('« Annuler » ferme la fenêtre avant l’export', async () => {
    await open();
    button('Annuler').click();
    expect(close).toHaveBeenCalledWith(false);
  });
});
