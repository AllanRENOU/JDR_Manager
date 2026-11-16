import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataError } from '../../../core/data/data-error';
import { provideFrenchLocale } from '../../../core/i18n/locale';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { aProject, aSceneNode, aSheetNode, aSoundNode } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ArchiveError } from '../archive-validation';
import { ARCHIVE_FORMAT, ARCHIVE_VERSION } from '../project-archive';
import { ImportPlan, ProjectImport, RunImportOptions } from '../project-import';
import { ImportProjectDialog } from './import-project-dialog';

describe('ImportProjectDialog', () => {
  let fixture: ComponentFixture<ImportProjectDialog>;
  let close: ReturnType<typeof vi.fn>;
  let zipClose: ReturnType<typeof vi.fn<() => Promise<void>>>;
  let importer: {
    prepare: ReturnType<typeof vi.fn<(file: Blob) => Promise<ImportPlan>>>;
    run: ReturnType<typeof vi.fn<(plan: ImportPlan, o?: RunImportOptions) => Promise<string>>>;
  };

  function aPlan(overrides: Partial<ImportPlan> = {}): ImportPlan {
    const project = aProject({
      id: 'p1',
      name: 'La crypte',
      updatedAt: '2026-11-10T14:30:00.000Z',
    });
    const data = {
      project,
      sceneNodes: [aSceneNode('p1'), aSceneNode('p1', { kind: 'folder' })],
      scenes: [],
      battlemaps: [],
      actions: [],
      sheetNodes: [aSheetNode('p1')],
      sheets: [],
      libraryNodes: [aSoundNode('p1'), aSoundNode('p1')],
    };
    return {
      archive: {
        format: ARCHIVE_FORMAT,
        version: ARCHIVE_VERSION,
        exportedAt: '',
        data,
        media: [],
      },
      data,
      existing: null,
      toImport: [
        { id: 'm1', mimeType: 'audio/ogg', size: 2048, fileName: 'a.ogg', included: true },
      ],
      bytes: 2048,
      alreadyPresent: 0,
      withoutFile: 0,
      insufficientSpace: null,
      zip: { archive: null!, hasMediaFile: () => true, mediaFile: vi.fn(), close: zipClose },
      ...overrides,
    };
  }

  beforeEach(() => {
    close = vi.fn();
    zipClose = vi.fn<() => Promise<void>>(() => Promise.resolve());
    importer = { prepare: vi.fn(), run: vi.fn(() => Promise.resolve('p1')) };
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideFrenchLocale(),
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: { file: new File(['zip'], 'La crypte.zip') } },
        { provide: ProjectImport, useValue: importer },
      ],
    });
  });

  /** Ouvre la fenêtre ; une erreur est rejetée seulement quand la fenêtre lit le fichier. */
  async function open(plan: ImportPlan | Error): Promise<void> {
    if (plan instanceof Error) {
      importer.prepare.mockRejectedValue(plan);
    } else {
      importer.prepare.mockResolvedValue(plan);
    }
    fixture = TestBed.createComponent(ImportProjectDialog);
    await fixture.whenStable();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const button = (label: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    );
  const messages = () =>
    TestBed.inject(Notifications)
      .notifications()
      .map((n) => n.message);

  it('résume le projet et ce qui sera importé', async () => {
    await open(aPlan({ alreadyPresent: 3, withoutFile: 1 }));
    expect(text()).toContain('La crypte.zip');
    expect(text()).toContain('La crypte');
    expect(text()).toContain('1 scène · 1 fiche · 2 sons et vidéos');
    expect(text()).toContain('1 fichier à importer · 2 Ko');
    expect(text()).toContain('3 fichiers déjà présents sur ce navigateur');
    expect(text()).toContain('1 fichier n’est pas dans l’export');
    expect(button('Importer')?.disabled).toBe(false);
  });

  it('dit qu’aucun fichier n’est à importer quand tous sont déjà présents', async () => {
    await open(aPlan({ toImport: [], bytes: 0, alreadyPresent: 3 }));
    expect(text()).toContain('Aucun nouveau fichier à importer.');
    expect(text()).not.toContain('0 fichier à importer');
  });

  it('prévient que le projet existant sera remplacé, avec les deux dates', async () => {
    const existing = aProject({
      id: 'p1',
      name: 'La crypte (PC)',
      updatedAt: '2026-11-15T09:05:00.000Z',
    });
    await open(aPlan({ existing }));
    expect(text()).toContain('Le projet « La crypte (PC) » existe déjà');
    expect(text()).toMatch(/Modifié ici le 15 novembre 2026, \d\d:05/);
    expect(text()).toMatch(/dans le fichier le 10 novembre 2026, \d\d:30/);
    expect(button('Remplacer')).toBeDefined();
    expect(text()).not.toContain('Aucun nouveau fichier');
    expect(button('Importer')).toBeUndefined();
  });

  it('bloque l’import si la place estimée est insuffisante', async () => {
    await open(aPlan({ insufficientSpace: { needed: 2048, available: 1024 } }));
    expect(text()).toContain('il faut 2 Ko, il reste environ 1 Ko');
    expect(button('Importer')?.disabled).toBe(true);
  });

  it('explique pourquoi un fichier est refusé', async () => {
    await open(new ArchiveError('newer-version', 'v2'));
    expect(text()).toContain('version plus récente de JDR Manager');
    expect(button('Importer')).toBeUndefined();
    button('Fermer')!.click();
    expect(close).toHaveBeenCalledWith();
  });

  it('importe et renvoie le projet importé', async () => {
    const plan = aPlan({ withoutFile: 2 });
    await open(plan);
    importer.run.mockImplementation(async (_p, options) => {
      options?.onProgress?.({ importedBytes: 1024, totalBytes: 2048 });
      await fixture.whenStable();
      expect(text()).toContain('Import en cours');
      expect(text()).toContain('1 Ko sur 2 Ko');
      return 'p1';
    });

    button('Importer')!.click();
    await vi.waitFor(() =>
      expect(close).toHaveBeenCalledWith({ projectId: 'p1', name: 'La crypte', withoutFile: 2 }),
    );
    expect(importer.run.mock.calls[0][0]).toBe(plan);
  });

  it('« Annuler » pendant l’import arrête tout et prévient que rien n’est gardé', async () => {
    await open(aPlan());
    let signal: AbortSignal | undefined;
    importer.run.mockImplementation(
      (_p, options) =>
        new Promise((_, reject) => {
          signal = options?.signal;
          signal?.addEventListener('abort', () => reject(signal?.reason));
        }),
    );
    button('Importer')!.click();
    await fixture.whenStable();
    button('Annuler')!.click();
    await vi.waitFor(() => expect(close).toHaveBeenCalledWith());
    expect(signal?.aborted).toBe(true);
    expect(messages()).toContain('Import annulé : rien n’a été enregistré.');
  });

  it('signale un échec (quota) et se ferme', async () => {
    await open(aPlan());
    importer.run.mockRejectedValue(new DataError('quota-exceeded', 'plein'));
    button('Importer')!.click();
    await vi.waitFor(() => expect(close).toHaveBeenCalledWith());
    expect(messages()[0]).toContain('Espace de stockage du navigateur insuffisant');
  });

  it('referme le fichier si le MJ renonce', async () => {
    await open(aPlan());
    button('Annuler')!.click();
    expect(close).toHaveBeenCalledWith();
    fixture.destroy();
    expect(zipClose).toHaveBeenCalled();
  });
});
