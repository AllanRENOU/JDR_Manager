import { TestBed } from '@angular/core/testing';
import { BlobWriter, TextReader, ZipWriter, BlobReader } from '@zip.js/zip.js';

import { isDataError } from '../../core/data/data-error';
import { DATA_REPOSITORY, DataRepository } from '../../core/data/data-repository';
import { StoragePersistence } from '../../core/data/storage-persistence';
import { GLOBAL_LIBRARY } from '../../core/models';
import {
  aBattlemap,
  aPlaySession,
  aProject,
  aScene,
  aSceneNode,
  aSheet,
  aSheetNode,
  aSoundNode,
  anAction,
} from '../../../testing/data-builders';
import { useNodeBlob } from '../../../testing/node-blob';
import { useTestRepository } from '../../../testing/test-repository';
import { ArchiveError } from './archive-validation';
import { collectProject } from './collect-project';
import { ExportOptions, ProjectArchive, archiveMediaPath, buildArchive } from './project-archive';
import { ProjectImport } from './project-import';
import { writeProjectZip } from './zip-writer';

describe('ProjectImport', () => {
  useNodeBlob();
  let repository: DataRepository;
  let importer: ProjectImport;
  let estimate: ReturnType<typeof vi.fn<StoragePersistence['estimate']>>;

  beforeEach(() => {
    estimate = vi.fn(() => Promise.resolve(null));
    TestBed.configureTestingModule({
      providers: [...useTestRepository(), { provide: StoragePersistence, useValue: { estimate } }],
    });
    repository = TestBed.inject(DATA_REPOSITORY);
    importer = TestBed.inject(ProjectImport);
  });

  const file = (content: string, name: string, type: string) => new File([content], name, { type });

  /** Projet « La crypte » : scène, battlemap, action, fiche, son du projet, son global, vidéo. */
  async function seed(): Promise<void> {
    await repository.importMedia('m-illustration', file('crypte', 'crypte.webp', 'image/webp'));
    await repository.saveProject(
      aProject({ id: 'p1', name: 'La crypte', firstSceneId: 's1', imageMediaId: 'm-illustration' }),
    );
    await repository.saveSceneNodes([aSceneNode('p1', { id: 's1' })]);
    await repository.saveScene(aScene('p1', 's1'));
    await repository.importMedia('m-carte', file('carte', 'carte.png', 'image/png'));
    await repository.saveBattlemap(aBattlemap('s1', 'm-carte', { id: 'b1' }));
    await repository.saveSheetNodes([aSheetNode('p1', { id: 'f1' })]);
    await repository.saveSheet(aSheet('p1', 'f1', { text: 'Le gardien' }));
    await repository.importMedia('m-taverne', file('taverne', 'taverne.mp3', 'audio/mpeg'), {
      durationMs: 1500,
    });
    await repository.importMedia('m-intro', file('vidéo', 'intro.mp4', 'video/mp4'));
    await repository.importMedia('m-pluie', file('pluie', 'pluie.ogg', 'audio/ogg'));
    await repository.saveLibraryNodes([
      aSoundNode('p1', { id: 'taverne', mediaId: 'm-taverne' }),
      aSoundNode('p1', { id: 'intro', mediaId: 'm-intro', mediaKind: 'video' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'meteo', kind: 'folder' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'pluie', parentId: 'meteo', mediaId: 'm-pluie' }),
    ]);
    await repository.saveAction(
      anAction('s1', {
        id: 'a1',
        elements: [
          {
            id: 'e1',
            type: 'play-sound',
            soundId: 'pluie',
            volume: 1,
            loop: false,
            fadeInMs: 0,
            fadeOutMs: 0,
          },
          { id: 'e2', type: 'play-video', videoId: 'intro', volume: 1 },
        ],
      }),
    );
  }

  async function exportZip(
    options: ExportOptions = { includeVideos: true, includeLargeVideos: false },
  ): Promise<{ zip: Blob; archive: ProjectArchive }> {
    const archive = buildArchive(await collectProject(repository, 'p1'), options);
    const zip = await writeProjectZip<Blob>(new BlobWriter('application/zip'), archive, (id) =>
      repository.getMediaBlob(id),
    );
    return { zip, archive };
  }

  /** Vide ce navigateur, comme une installation neuve (tablette). */
  async function forgetEverything(): Promise<void> {
    await repository.deleteProject('p1');
    await repository.deleteLibraryNode('meteo');
  }

  const text = async (id: string) => (await repository.getMediaBlob(id)).text();

  it('réimporte à l’identique dans un navigateur vierge, sons et vidéos dans le projet', async () => {
    await seed();
    const before = await collectProject(repository, 'p1');
    const { zip } = await exportZip();
    await forgetEverything();
    expect(await repository.listMissingMedia()).toEqual([]);

    const plan = await importer.prepare(zip);
    expect(plan.existing).toBeNull();
    expect(plan.toImport.map((m) => m.id).sort()).toEqual([
      'm-carte',
      'm-illustration',
      'm-intro',
      'm-pluie',
      'm-taverne',
    ]);
    expect(plan.alreadyPresent).toBe(0);
    expect(plan.withoutFile).toBe(0);
    expect(await importer.run(plan)).toBe('p1');

    const after = await collectProject(repository, 'p1');
    expect(after.data.project).toEqual(before.data.project);
    expect(after.data.scenes).toEqual(before.data.scenes);
    expect(after.data.actions).toEqual(before.data.actions);
    expect(after.data.battlemaps).toEqual(before.data.battlemaps);
    expect(after.data.sheets).toEqual(before.data.sheets);
    // Tout est dans la bibliothèque du projet, dossier global compris, avec les mêmes identifiants.
    const library = await repository.listLibraryNodes('p1');
    expect(library.map((n) => n.id).sort()).toEqual(['intro', 'meteo', 'pluie', 'taverne']);
    expect(library.find((n) => n.id === 'pluie')?.parentId).toBe('meteo');
    expect(await repository.listLibraryNodes(GLOBAL_LIBRARY)).toEqual([]);
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect(after.media.sort(byId)).toEqual(before.media.sort(byId));
    expect(await text('m-pluie')).toBe('pluie');
    expect(await text('m-intro')).toBe('vidéo');
    expect(await text('m-illustration')).toBe('crypte');
  });

  it('réimporte sur le navigateur d’origine sans dupliquer les médias', async () => {
    await seed();
    const { zip } = await exportZip();
    // Modifications locales après l'export : une scène ajoutée, une partie en cours.
    await repository.saveSceneNodes([aSceneNode('p1', { id: 's-local' })]);
    await repository.savePlaySession(aPlaySession('p1', 's1'));
    await repository.saveProject({
      ...(await repository.getProject('p1'))!,
      name: 'Renommée ici',
    });
    const importMedia = vi.spyOn(repository, 'importMedia');

    const plan = await importer.prepare(zip);
    expect(plan.existing?.name).toBe('Renommée ici');
    expect(plan.toImport).toEqual([]);
    expect(plan.bytes).toBe(0);
    expect(plan.alreadyPresent).toBe(5);
    await importer.run(plan);

    expect(importMedia).not.toHaveBeenCalled();
    expect((await repository.getProject('p1'))?.name).toBe('La crypte');
    expect((await repository.listSceneNodes('p1')).map((n) => n.id).sort()).toEqual([
      's-local',
      's1',
    ]);
    expect(await repository.getPlaySession('p1')).toBeDefined();
    // Le son global reste dans la bibliothèque globale (pas de doublon dans le projet).
    expect((await repository.listLibraryNodes(GLOBAL_LIBRARY)).map((n) => n.id).sort()).toEqual([
      'meteo',
      'pluie',
    ]);
    expect((await repository.listLibraryNodes('p1')).map((n) => n.id).sort()).toEqual([
      'intro',
      'taverne',
    ]);
  });

  it('crée sans fichier une vidéo exportée sans son fichier (VID-13)', async () => {
    await seed();
    const { zip } = await exportZip({ includeVideos: false, includeLargeVideos: false });
    await forgetEverything();

    const plan = await importer.prepare(zip);
    expect(plan.toImport.map((m) => m.id)).not.toContain('m-intro');
    expect(plan.withoutFile).toBe(1);
    await importer.run(plan);

    const intro = (await repository.listLibraryNodes('p1')).find((n) => n.id === 'intro');
    expect(intro).toMatchObject({ mediaId: 'm-intro', mediaKind: 'video' });
    expect(await repository.listMissingMedia()).toEqual(['m-intro']);
  });

  it('refuse un fichier qui n’est pas un zip, ou un zip sans projet.json', async () => {
    await expect(importer.prepare(new Blob(['pas un zip']))).rejects.toSatisfy(
      (e: unknown) => e instanceof ArchiveError && e.code === 'not-an-archive',
    );
    const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
    await writer.add('autre.txt', new TextReader('bonjour'));
    await expect(importer.prepare(await writer.close())).rejects.toSatisfy(
      (e: unknown) => e instanceof ArchiveError && e.code === 'not-an-archive',
    );
  });

  it('refuse un projet.json qui n’est pas du JSON valide', async () => {
    const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
    await writer.add('projet.json', new TextReader('{ abîmé'));
    await expect(importer.prepare(await writer.close())).rejects.toSatisfy(
      (e: unknown) => e instanceof ArchiveError && e.code === 'invalid-data',
    );
  });

  /** Zip refait par un autre outil : médias compressés, éventuellement abîmés. */
  async function rezip(archive: ProjectArchive, contents: Record<string, string>): Promise<Blob> {
    const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
    await writer.add('projet.json', new TextReader(JSON.stringify(archive)));
    for (const media of archive.media) {
      if (contents[media.id] !== undefined) {
        await writer.add(archiveMediaPath(media), new BlobReader(new Blob([contents[media.id]])), {
          level: 9,
        });
      }
    }
    return writer.close();
  }

  it('lit aussi des médias compressés', async () => {
    await seed();
    const { archive } = await exportZip();
    await forgetEverything();
    const contents = {
      'm-carte': 'carte',
      'm-taverne': 'taverne',
      'm-intro': 'vidéo',
      'm-pluie': 'pluie',
    };

    await importer.run(await importer.prepare(await rezip(archive, contents)));
    expect(await text('m-taverne')).toBe('taverne');
  });

  it('compte comme sans fichier un média annoncé mais absent du zip', async () => {
    await seed();
    const { archive } = await exportZip();
    await forgetEverything();
    const plan = await importer.prepare(
      await rezip(archive, {
        'm-carte': 'carte',
        'm-illustration': 'crypte',
        'm-taverne': 'taverne',
        'm-pluie': 'pluie',
      }),
    );
    expect(plan.withoutFile).toBe(1);
    await importer.run(plan);
    expect(await repository.listMissingMedia()).toEqual(['m-intro']);
  });

  it('refuse un média dont la taille ne correspond pas et n’écrit rien', async () => {
    await seed();
    const { archive } = await exportZip();
    await forgetEverything();
    const contents = {
      'm-carte': 'carte',
      'm-taverne': 'taverne abîmée',
      'm-intro': 'vidéo',
      'm-pluie': 'pluie',
    };
    const plan = await importer.prepare(await rezip(archive, contents));

    await expect(importer.run(plan)).rejects.toSatisfy(
      (e: unknown) => e instanceof ArchiveError && e.code === 'invalid-data',
    );
    expect(await repository.getProject('p1')).toBeUndefined();
    expect(await repository.getMediaInfo(['m-carte', 'm-taverne', 'm-intro', 'm-pluie'])).toEqual(
      [],
    );
  });

  it('supprime les médias déjà écrits si l’écriture des données échoue', async () => {
    await seed();
    const { zip } = await exportZip();
    await forgetEverything();
    const plan = await importer.prepare(zip);
    const failure = new Error('écriture impossible');
    vi.spyOn(repository, 'importProjectData').mockRejectedValue(failure);

    await expect(importer.run(plan)).rejects.toBe(failure);
    expect(await repository.getMediaInfo(['m-carte', 'm-taverne', 'm-intro', 'm-pluie'])).toEqual(
      [],
    );
    expect(await repository.getProject('p1')).toBeUndefined();
  });

  it('s’arrête quand le MJ annule et n’écrit rien', async () => {
    await seed();
    const { zip } = await exportZip();
    await forgetEverything();
    const plan = await importer.prepare(zip);
    const controller = new AbortController();

    const run = importer.run(plan, {
      signal: controller.signal,
      onProgress: (p) => {
        if (p.importedBytes > 0) {
          controller.abort();
        }
      },
    });
    await expect(run).rejects.toMatchObject({ name: 'AbortError' });
    expect(await repository.getProject('p1')).toBeUndefined();
    expect(await repository.getMediaInfo(['m-carte', 'm-taverne', 'm-intro', 'm-pluie'])).toEqual(
      [],
    );
  });

  it('signale une place insuffisante d’après l’estimation du navigateur', async () => {
    await seed();
    const { zip } = await exportZip();
    await forgetEverything();
    estimate.mockResolvedValue({ usage: 990, quota: 1000 });

    const plan = await importer.prepare(zip);
    expect(plan.insufficientSpace).toEqual({ needed: plan.bytes, available: 10 });
    await plan.zip.close();
  });

  it('transmet un dépassement de quota du dépôt', async () => {
    await seed();
    const { zip } = await exportZip();
    await forgetEverything();
    const plan = await importer.prepare(zip);
    const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(() => {
      throw new DOMException('Quota dépassé', 'QuotaExceededError');
    });
    await expect(importer.run(plan)).rejects.toSatisfy((e: unknown) =>
      isDataError(e, 'quota-exceeded'),
    );
    spy.mockRestore();
    expect(await repository.getProject('p1')).toBeUndefined();
  });
});
