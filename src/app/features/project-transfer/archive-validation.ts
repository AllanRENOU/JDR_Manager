import { ProjectData } from '../../core/data/data-repository';
import { mediaKindOfMime } from '../../core/media/media-types';
import {
  Action,
  ActionElement,
  Battlemap,
  GLOBAL_LIBRARY,
  Id,
  LibraryNode,
  Project,
  Scene,
  SceneNode,
  Sheet,
  SheetNode,
  TreeNode,
} from '../../core/models';
import { ARCHIVE_FORMAT, ARCHIVE_VERSION, ArchiveMedia, ProjectArchive } from './project-archive';

/** Raison du refus d'un fichier d'export. */
export type ArchiveErrorCode = 'not-an-archive' | 'newer-version' | 'invalid-data';

/**
 * Fichier d'export refusé à l'import. `messageKey` est la clé de traduction à afficher ; le
 * message (pour le développeur) donne le champ en cause et un code, ex.
 * `data.actions[2].name : string`.
 */
export class ArchiveError extends Error {
  readonly messageKey: string;

  constructor(
    readonly code: ArchiveErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ArchiveError';
    this.messageKey = `error.archive.${code}`;
  }
}

/** Limites de taille : un fichier abîmé ou malveillant ne doit pas saturer la mémoire. */
const MAX_ITEMS = 100_000;
const MAX_NAME_LENGTH = 1_000;
const MAX_TEXT_LENGTH = 1_000_000;
/** Identifiants : UUID en pratique ; jamais de `/` ni de `.`, car ils servent aux chemins du zip. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Valide le contenu de `projet.json` (déjà lu par `JSON.parse`) avant toute écriture (PRJ-05).
 * Renvoie de **nouveaux** objets qui ne gardent que les champs connus, et vérifie les liens entre
 * eux (projet, scènes).
 * @throws ArchiveError
 */
export function parseProjectArchive(value: unknown): ProjectArchive {
  if (!isRecord(value) || value['format'] !== ARCHIVE_FORMAT) {
    throw new ArchiveError('not-an-archive', 'format');
  }
  const version = value['version'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new ArchiveError('invalid-data', `version : ${String(version)}`);
  }
  if (version > ARCHIVE_VERSION) {
    throw new ArchiveError('newer-version', `Version ${version} > ${ARCHIVE_VERSION}`);
  }
  const root = new Fields(value, '');
  const data = root.record('data');
  const project = parseProject(data.record('project'));
  const projectId = project.id;

  const sceneNodes = data.list('sceneNodes', (f) => ({
    ...treeNode(f),
    projectId: f.equal('projectId', projectId),
  })) satisfies SceneNode[];
  const scenes = data.list('scenes', (f) => parseScene(f, projectId));
  const sceneIds = new Set(scenes.map((s) => s.id));
  const battlemaps = data.list('battlemaps', (f) => parseBattlemap(f, sceneIds));
  const actions = data.list('actions', (f) => parseAction(f, sceneIds));
  const sheetNodes = data.list('sheetNodes', (f) => ({
    ...treeNode(f),
    projectId: f.equal('projectId', projectId),
  })) satisfies SheetNode[];
  const sheets = data.list('sheets', (f): Sheet => ({
    id: f.id('id'),
    projectId: f.equal('projectId', projectId),
    text: f.text('text'),
  }));
  const libraryNodes = data.list('libraryNodes', (f) => parseLibraryNode(f, projectId));

  const archive: ProjectArchive = {
    format: ARCHIVE_FORMAT,
    version,
    exportedAt: root.string('exportedAt'),
    data: { project, sceneNodes, scenes, battlemaps, actions, sheetNodes, sheets, libraryNodes },
    media: root.list('media', parseMedia),
  };
  checkUniqueIds(archive.data, archive.media);
  return archive;
}

function parseProject(f: Fields): Project {
  // Image du projet : absente des exports antérieurs, `null` si retirée.
  const imageMediaId = f.has('imageMediaId') ? f.nullableId('imageMediaId') : undefined;
  return {
    id: f.id('id'),
    name: f.name('name'),
    firstSceneId: f.nullableId('firstSceneId'),
    ...(imageMediaId !== undefined && { imageMediaId }),
    createdAt: f.string('createdAt'),
    updatedAt: f.string('updatedAt'),
  };
}

function treeNode(f: Fields): TreeNode {
  return {
    id: f.id('id'),
    parentId: f.nullableId('parentId'),
    order: f.number('order'),
    kind: f.oneOf('kind', ['folder', 'item'] as const),
    name: f.name('name'),
  };
}

function parseScene(f: Fields, projectId: Id): Scene {
  return {
    id: f.id('id'),
    projectId: f.equal('projectId', projectId),
    defaultBattlemapId: f.nullableId('defaultBattlemapId'),
    nextSceneIds: f.list('nextSceneIds', (_, value, path) => checkId(value, path)),
    sceneTextActionId: f.nullableId('sceneTextActionId'),
  };
}

function parseBattlemap(f: Fields, sceneIds: ReadonlySet<Id>): Battlemap {
  return {
    id: f.id('id'),
    sceneId: f.member('sceneId', sceneIds),
    name: f.name('name'),
    mediaId: f.id('mediaId'),
    order: f.number('order'),
  };
}

function parseAction(f: Fields, sceneIds: ReadonlySet<Id>): Action {
  const hidden = f.optionalBoolean('hidden');
  return {
    id: f.id('id'),
    sceneId: f.member('sceneId', sceneIds),
    name: f.name('name'),
    trigger: f.oneOf('trigger', ['scene-open', 'manual'] as const),
    order: f.number('order'),
    isSceneText: f.boolean('isSceneText'),
    ...(hidden !== undefined && { hidden }),
    elements: f.list('elements', parseElement),
  };
}

function parseElement(f: Fields): ActionElement {
  const id = f.id('id');
  const type = f.string('type');
  switch (type) {
    case 'show-battlemap':
      return { id, type, battlemapId: f.id('battlemapId') };
    case 'play-sound':
      return {
        id,
        type,
        soundId: f.id('soundId'),
        volume: f.number('volume', 0, 1),
        loop: f.boolean('loop'),
        fadeInMs: f.number('fadeInMs'),
        fadeOutMs: f.number('fadeOutMs'),
      };
    case 'stop-sound':
      return { id, type, soundId: f.id('soundId') };
    case 'stop-all-sounds':
    case 'stop-video':
      return { id, type };
    case 'play-video':
      return { id, type, videoId: f.id('videoId'), volume: f.number('volume', 0, 1) };
    case 'add-text':
    case 'user-click':
      return { id, type, text: f.text('text') };
    case 'change-scene':
      return { id, type, sceneId: f.id('sceneId') };
    case 'wait': {
      const text = f.optionalText('text');
      return { id, type, seconds: f.number('seconds'), ...(text !== undefined && { text }) };
    }
    case 'show-action':
      return { id, type, actionIds: f.list('actionIds', (_, v, path) => checkId(v, path)) };
    case 'hide-action': {
      const all = f.optionalBoolean('all');
      return {
        id,
        type,
        actionIds: f.list('actionIds', (_, v, path) => checkId(v, path)),
        ...(all !== undefined && { all }),
      };
    }
    case 'show-sheet':
      return { id, type, sheetId: f.id('sheetId') };
    default:
      return invalid(`${f.path}type`, `unknown-element-type ${type}`);
  }
}

function parseLibraryNode(f: Fields, projectId: Id): LibraryNode {
  const node = treeNode(f);
  const libraryId = f.string('libraryId');
  if (libraryId !== GLOBAL_LIBRARY && libraryId !== projectId) {
    invalid(`${f.path}libraryId`, 'foreign-library');
  }
  const mediaId = f.optionalId('mediaId');
  const mediaKind = f.optionalOneOf('mediaKind', ['sound', 'video'] as const);
  return {
    ...node,
    libraryId,
    ...(mediaId !== undefined && { mediaId }),
    ...(mediaKind !== undefined && { mediaKind }),
  };
}

function parseMedia(f: Fields): ArchiveMedia {
  const mimeType = f.string('mimeType');
  if (mediaKindOfMime(mimeType) === null) {
    invalid(`${f.path}mimeType`, `unsupported-mime-type ${mimeType}`);
  }
  const durationMs = f.optionalNumber('durationMs');
  return {
    id: f.id('id'),
    mimeType,
    size: f.number('size'),
    fileName: f.name('fileName'),
    ...(durationMs !== undefined && { durationMs }),
    included: f.boolean('included'),
  };
}

/** Un même identifiant ne peut apparaître deux fois dans une même liste. */
function checkUniqueIds(data: ProjectData, media: ArchiveMedia[]): void {
  const lists: [string, { id: Id }[]][] = [
    ['sceneNodes', data.sceneNodes],
    ['scenes', data.scenes],
    ['battlemaps', data.battlemaps],
    ['actions', data.actions],
    ['sheetNodes', data.sheetNodes],
    ['sheets', data.sheets],
    ['libraryNodes', data.libraryNodes],
    ['media', media],
  ];
  for (const [name, items] of lists) {
    const seen = new Set<Id>();
    for (const { id } of items) {
      if (seen.has(id)) {
        invalid(name, `duplicate-id ${id}`);
      }
      seen.add(id);
    }
  }
}

// ── Lecture typée d'un objet JSON ────────────────────────────────────────

function invalid(path: string, reason: string): never {
  throw new ArchiveError('invalid-data', `${path} : ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkId(value: unknown, path: string): Id {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    invalid(path, 'id');
  }
  return value;
}

/** Champs d'un objet JSON, lus avec leur type ; `path` sert aux messages d'erreur. */
class Fields {
  constructor(
    private readonly value: Record<string, unknown>,
    /** Chemin de l'objet, terminé par un point (ex. `data.actions[2].`). */
    readonly path: string,
  ) {}

  private get(key: string): unknown {
    return Object.hasOwn(this.value, key) ? this.value[key] : undefined;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  record(key: string): Fields {
    const value = this.get(key);
    if (!isRecord(value)) {
      invalid(this.path + key, 'object');
    }
    return new Fields(value, `${this.path}${key}.`);
  }

  list<T>(key: string, item: (fields: Fields, value: unknown, path: string) => T): T[] {
    const value = this.get(key);
    if (!Array.isArray(value)) {
      invalid(this.path + key, 'list');
    }
    if (value.length > MAX_ITEMS) {
      invalid(this.path + key, 'list-too-long');
    }
    return value.map((v, i) => {
      const path = `${this.path}${key}[${i}]`;
      return item(isRecord(v) ? new Fields(v, `${path}.`) : emptyFields(path), v, path);
    });
  }

  string(key: string, maxLength = MAX_NAME_LENGTH): string {
    const value = this.get(key);
    if (typeof value !== 'string' || value.length > maxLength) {
      invalid(this.path + key, 'string');
    }
    return value;
  }

  name(key: string): string {
    return this.string(key, MAX_NAME_LENGTH);
  }

  text(key: string): string {
    return this.string(key, MAX_TEXT_LENGTH);
  }

  optionalText(key: string): string | undefined {
    return this.has(key) ? this.text(key) : undefined;
  }

  id(key: string): Id {
    return checkId(this.get(key), this.path + key);
  }

  optionalId(key: string): Id | undefined {
    return this.has(key) ? this.id(key) : undefined;
  }

  nullableId(key: string): Id | null {
    return this.get(key) === null ? null : this.id(key);
  }

  /** Identifiant qui doit valoir `expected` (ex. projet de chaque objet). */
  equal(key: string, expected: Id): Id {
    if (this.id(key) !== expected) {
      invalid(this.path + key, 'foreign-project');
    }
    return expected;
  }

  /** Identifiant qui doit faire partie de `ids` (ex. scène d'une action). */
  member(key: string, ids: ReadonlySet<Id>): Id {
    const id = this.id(key);
    if (!ids.has(id)) {
      invalid(this.path + key, 'missing-scene');
    }
    return id;
  }

  number(key: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const value = this.get(key);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      invalid(this.path + key, 'number');
    }
    return value;
  }

  optionalNumber(key: string): number | undefined {
    return this.has(key) ? this.number(key) : undefined;
  }

  boolean(key: string): boolean {
    const value = this.get(key);
    if (typeof value !== 'boolean') {
      invalid(this.path + key, 'boolean');
    }
    return value;
  }

  optionalBoolean(key: string): boolean | undefined {
    return this.has(key) ? this.boolean(key) : undefined;
  }

  oneOf<T extends string>(key: string, values: readonly T[]): T {
    const value = this.get(key);
    if (!values.includes(value as T)) {
      invalid(this.path + key, `one-of ${values.join('|')}`);
    }
    return value as T;
  }

  optionalOneOf<T extends string>(key: string, values: readonly T[]): T | undefined {
    return this.has(key) ? this.oneOf(key, values) : undefined;
  }
}

/** Élément de liste qui n'est pas un objet : toute lecture de champ échoue avec son chemin. */
function emptyFields(path: string): Fields {
  return new Fields({}, `${path}.`);
}
