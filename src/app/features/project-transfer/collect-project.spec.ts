import { TestBed } from '@angular/core/testing';

import { isDataError } from '../../core/data/data-error';
import { DATA_REPOSITORY, DataRepository } from '../../core/data/data-repository';
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
import { collectProject } from './collect-project';

describe('collectProject', () => {
  useNodeBlob();
  let repository: DataRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...useTestRepository()] });
    repository = TestBed.inject(DATA_REPOSITORY);
  });

  const file = (name: string, type: string) => new File(['contenu'], name, { type });

  /** Projet « La crypte » : une scène, une battlemap, des sons du projet et de la bibliothèque globale. */
  async function seed(): Promise<void> {
    await repository.saveProject(aProject({ id: 'p1', name: 'La crypte', firstSceneId: 's1' }));
    await repository.saveSceneNodes([aSceneNode('p1', { id: 's1' })]);
    await repository.saveScene(aScene('p1', 's1'));
    await repository.importMedia('m-carte', file('carte.png', 'image/png'));
    await repository.saveBattlemap(aBattlemap('s1', 'm-carte', { id: 'b1' }));
    await repository.saveSheetNodes([aSheetNode('p1', { id: 'f1' })]);
    await repository.saveSheet(aSheet('p1', 'f1', { text: 'Le gardien' }));

    // Bibliothèque du projet : tout est exporté, même ce qui n'est pas utilisé.
    await repository.importMedia('m-taverne', file('taverne.mp3', 'audio/mpeg'));
    await repository.importMedia('m-intro', file('intro.mp4', 'video/mp4'));
    await repository.saveLibraryNodes([
      aSoundNode('p1', { id: 'taverne', mediaId: 'm-taverne' }),
      aSoundNode('p1', { id: 'intro', mediaId: 'm-intro', mediaKind: 'video' }),
    ]);

    // Bibliothèque globale : seuls les éléments utilisés, avec leurs dossiers.
    await repository.importMedia('m-pluie', file('pluie.ogg', 'audio/ogg'));
    await repository.importMedia('m-vent', file('vent.ogg', 'audio/ogg'));
    await repository.saveLibraryNodes([
      aSoundNode(GLOBAL_LIBRARY, { id: 'meteo', kind: 'folder', name: 'Météo' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'orages', kind: 'folder', parentId: 'meteo' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'pluie', parentId: 'orages', mediaId: 'm-pluie' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'vent', parentId: 'orages', mediaId: 'm-vent' }),
      aSoundNode(GLOBAL_LIBRARY, { id: 'autre', kind: 'folder' }),
    ]);
    await repository.saveAction(
      anAction('s1', {
        id: 'a1',
        elements: [
          { id: 'e1', type: 'show-battlemap', battlemapId: 'b1' },
          {
            id: 'e2',
            type: 'play-sound',
            soundId: 'pluie',
            volume: 1,
            loop: true,
            fadeInMs: 0,
            fadeOutMs: 0,
          },
          { id: 'e3', type: 'play-video', videoId: 'intro', volume: 1 },
        ],
      }),
    );
    await repository.savePlaySession(aPlaySession('p1', 's1'));
  }

  it('relit le projet, ses scènes, battlemaps, actions et fiches', async () => {
    await seed();
    const { data } = await collectProject(repository, 'p1');

    expect(data.project.name).toBe('La crypte');
    expect(data.sceneNodes.map((n) => n.id)).toEqual(['s1']);
    expect(data.scenes.map((s) => s.id)).toEqual(['s1']);
    expect(data.battlemaps.map((b) => b.id)).toEqual(['b1']);
    expect(data.actions.map((a) => a.id)).toEqual(['a1']);
    expect(data.sheetNodes.map((n) => n.id)).toEqual(['f1']);
    expect(data.sheets[0].text).toBe('Le gardien');
  });

  it('exporte toute la bibliothèque du projet et, de la globale, les éléments utilisés avec leurs dossiers', async () => {
    await seed();
    const { data } = await collectProject(repository, 'p1');

    expect(data.libraryNodes.map((n) => n.id).sort()).toEqual(
      ['intro', 'meteo', 'orages', 'pluie', 'taverne'].sort(),
    );
    // Les nœuds gardent leur bibliothèque d'origine : l'import les range dans le projet.
    expect(data.libraryNodes.find((n) => n.id === 'pluie')?.libraryId).toBe(GLOBAL_LIBRARY);
  });

  it('décrit les médias présents utilisés, sans leur contenu', async () => {
    await seed();
    const { media } = await collectProject(repository, 'p1');

    expect(media.map((m) => m.id).sort()).toEqual(['m-carte', 'm-intro', 'm-pluie', 'm-taverne']);
    expect(media.find((m) => m.id === 'm-intro')).toMatchObject({
      mimeType: 'video/mp4',
      fileName: 'intro.mp4',
    });
    expect(media[0]).not.toHaveProperty('blob');
  });

  it('ignore un média absent (vidéo importée sans fichier) sans échouer', async () => {
    await seed();
    await repository.saveLibraryNodes([
      aSoundNode('p1', { id: 'sans-fichier', mediaId: 'm-absent', mediaKind: 'video' }),
    ]);
    const { data, media } = await collectProject(repository, 'p1');

    expect(data.libraryNodes.map((n) => n.id)).toContain('sans-fichier');
    expect(media.map((m) => m.id)).not.toContain('m-absent');
  });

  it('signale un projet introuvable', async () => {
    await expect(collectProject(repository, 'inconnu')).rejects.toSatisfy((e: unknown) =>
      isDataError(e, 'project-not-found'),
    );
  });
});
