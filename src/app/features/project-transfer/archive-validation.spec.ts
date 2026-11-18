import { GLOBAL_LIBRARY } from '../../core/models';
import {
  aBattlemap,
  aProject,
  aScene,
  aSceneNode,
  aSheet,
  aSheetNode,
  aSoundNode,
  anAction,
} from '../../../testing/data-builders';
import { ArchiveError, ArchiveErrorCode, parseProjectArchive } from './archive-validation';
import { ARCHIVE_VERSION, ProjectArchive, buildArchive } from './project-archive';

/** Export complet : un élément de chaque type, champs facultatifs compris. */
function anArchive(): ProjectArchive {
  return buildArchive(
    {
      data: {
        project: aProject({ id: 'p1', firstSceneId: 's1', imageMediaId: 'm-illustration' }),
        sceneNodes: [
          aSceneNode('p1', { id: 'dossier', kind: 'folder' }),
          aSceneNode('p1', { id: 's1', parentId: 'dossier' }),
          aSceneNode('p1', { id: 's2', order: 1 }),
        ],
        scenes: [
          aScene('p1', 's1', {
            defaultBattlemapId: 'b1',
            nextSceneIds: ['s2'],
            sceneTextActionId: 'a0',
          }),
          aScene('p1', 's2'),
        ],
        battlemaps: [aBattlemap('s1', 'm-carte', { id: 'b1' })],
        actions: [
          anAction('s1', { id: 'a0', trigger: 'scene-open', isSceneText: true }),
          anAction('s1', {
            id: 'a1',
            order: 1,
            hidden: true,
            elements: [
              { id: 'e1', type: 'show-battlemap', battlemapId: 'b1' },
              {
                id: 'e2',
                type: 'play-sound',
                soundId: 'pluie',
                volume: 0.5,
                loop: true,
                fadeInMs: 1000,
                fadeOutMs: 2000,
              },
              { id: 'e3', type: 'stop-sound', soundId: 'pluie' },
              { id: 'e4', type: 'stop-all-sounds' },
              { id: 'e5', type: 'play-video', videoId: 'intro', volume: 1 },
              { id: 'e6', type: 'stop-video' },
              { id: 'e7', type: 'add-text', text: '**Bienvenue**' },
              { id: 'e8', type: 'change-scene', sceneId: 's2' },
              { id: 'e9', type: 'wait', seconds: 3, text: 'Le pont s’effondre' },
              { id: 'e10', type: 'wait', seconds: 1 },
              { id: 'e11', type: 'user-click', text: 'Continuer' },
              { id: 'e12', type: 'show-action', actionIds: ['a2'] },
              { id: 'e13', type: 'hide-action', actionIds: [], all: true },
              { id: 'e14', type: 'show-sheet', sheetId: 'f1' },
            ],
          }),
          anAction('s1', { id: 'a2', order: 2 }),
        ],
        sheetNodes: [aSheetNode('p1', { id: 'f1' })],
        sheets: [aSheet('p1', 'f1', { text: '# Le gardien' })],
        libraryNodes: [
          aSoundNode('p1', { id: 'intro', mediaId: 'm-intro', mediaKind: 'video' }),
          aSoundNode(GLOBAL_LIBRARY, { id: 'meteo', kind: 'folder' }),
          aSoundNode(GLOBAL_LIBRARY, { id: 'pluie', parentId: 'meteo', mediaId: 'm-pluie' }),
        ],
      },
      media: [
        { id: 'm-carte', mimeType: 'image/png', size: 10, fileName: 'carte.png' },
        { id: 'm-pluie', mimeType: 'audio/ogg', size: 20, fileName: 'pluie.ogg', durationMs: 1500 },
        { id: 'm-intro', mimeType: 'video/mp4', size: 30, fileName: 'intro.mp4' },
      ],
    },
    { includeVideos: false, includeLargeVideos: false },
  );
}

/**
 * Export passé par JSON (comme lu dans le zip), modifiable avant validation : non typé, pour
 * pouvoir y écrire des valeurs invalides.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonOf(archive: ProjectArchive = anArchive()): Record<string, any> {
  return JSON.parse(JSON.stringify(archive));
}

function expectRefused(value: unknown, code: ArchiveErrorCode, detail?: string): void {
  try {
    parseProjectArchive(value);
  } catch (error) {
    expect(error).toBeInstanceOf(ArchiveError);
    expect((error as ArchiveError).code).toBe(code);
    expect((error as ArchiveError).messageKey).toBe(`error.archive.${code}`);
    if (detail) {
      expect((error as ArchiveError).message).toContain(detail);
    }
    return;
  }
  throw new Error('export accepté à tort');
}

describe('parseProjectArchive', () => {
  it('relit à l’identique un export passé par JSON', () => {
    const archive = anArchive();
    expect(parseProjectArchive(jsonOf(archive))).toEqual(archive);
  });

  it('accepte une image de projet absente (export antérieur) ou retirée (null) (5.3)', () => {
    const absent = jsonOf();
    delete absent['data'].project.imageMediaId;
    expect(parseProjectArchive(absent).data.project).not.toHaveProperty('imageMediaId');

    const removed = jsonOf();
    removed['data'].project.imageMediaId = null;
    expect(parseProjectArchive(removed).data.project.imageMediaId).toBeNull();

    const wrong = jsonOf();
    wrong['data'].project.imageMediaId = '../x';
    expect(() => parseProjectArchive(wrong)).toThrow(ArchiveError);
  });

  it('ne garde que les champs connus', () => {
    const json = jsonOf();
    json['extra'] = 1;
    json['data'].project.secret = 'x';
    json['data'].actions[1].elements[0].injected = true;
    const archive = parseProjectArchive(json);
    expect(archive).not.toHaveProperty('extra');
    expect(archive.data.project).not.toHaveProperty('secret');
    expect(archive.data.actions[1].elements[0]).not.toHaveProperty('injected');
  });

  it('refuse un fichier qui n’est pas un export de JDR Manager', () => {
    expectRefused(null, 'not-an-archive');
    expectRefused([], 'not-an-archive');
    expectRefused({ format: 'autre', version: 1 }, 'not-an-archive');
  });

  it('refuse un export d’une version plus récente', () => {
    expectRefused({ ...jsonOf(), version: ARCHIVE_VERSION + 1 }, 'newer-version');
  });

  it('refuse une version illisible', () => {
    expectRefused({ ...jsonOf(), version: '1' }, 'invalid-data', 'version');
    expectRefused({ ...jsonOf(), version: 0 }, 'invalid-data', 'version');
  });

  it('indique le champ en cause d’une donnée de mauvais type', () => {
    const json = jsonOf();
    json['data'].actions[1].name = 42;
    expectRefused(json, 'invalid-data', 'data.actions[1].name');
  });

  it('refuse une liste absente ou un élément de liste qui n’est pas un objet', () => {
    const missing = jsonOf();
    delete missing['data'].sheets;
    expectRefused(missing, 'invalid-data', 'data.sheets');
    const notObject = jsonOf();
    notObject['data'].scenes[0] = 'scène';
    expectRefused(notObject, 'invalid-data', 'data.scenes[0]');
  });

  it('refuse un type d’élément inconnu et un volume hors limites', () => {
    const unknown = jsonOf();
    unknown['data'].actions[1].elements[0].type = 'explode';
    expectRefused(unknown, 'invalid-data', 'unknown-element-type');
    const volume = jsonOf();
    volume['data'].actions[1].elements[1].volume = 2;
    expectRefused(volume, 'invalid-data', 'elements[1].volume');
  });

  it('refuse un identifiant qui pourrait servir de chemin de fichier', () => {
    const json = jsonOf();
    json['media'][0].id = '../../evil';
    expectRefused(json, 'invalid-data', 'media[0].id');
  });

  it('refuse un format de média non pris en charge', () => {
    const json = jsonOf();
    json['media'][0].mimeType = 'text/html';
    expectRefused(json, 'invalid-data', 'unsupported-mime-type');
  });

  it('refuse un objet d’un autre projet ou une action sans sa scène', () => {
    const foreign = jsonOf();
    foreign['data'].sheets[0].projectId = 'p2';
    expectRefused(foreign, 'invalid-data', 'foreign-project');
    const library = jsonOf();
    library['data'].libraryNodes[0].libraryId = 'p2';
    expectRefused(library, 'invalid-data', 'foreign-library');
    const orphan = jsonOf();
    orphan['data'].actions[0].sceneId = 's9';
    expectRefused(orphan, 'invalid-data', 'missing-scene');
  });

  it('refuse un identifiant en double dans une liste', () => {
    const json = jsonOf();
    json['data'].sheetNodes.push(json['data'].sheetNodes[0]);
    expectRefused(json, 'invalid-data', 'duplicate-id');
  });

  it('ne se laisse pas tromper par une propriété héritée', () => {
    const json = JSON.parse('{"__proto__": {"format": "jdr-manager-project"}}');
    expectRefused(json, 'not-an-archive');
  });
});
