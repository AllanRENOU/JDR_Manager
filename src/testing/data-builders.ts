import {
  Action,
  Battlemap,
  Id,
  Media,
  PlaySession,
  Project,
  Scene,
  SceneNode,
  SoundLibraryId,
  SoundNode,
  newId,
} from '../app/core/models';

/** Fabriques d'entités pour les tests : valeurs par défaut valides, surchargeables. */
export function aProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: 'La crypte',
    firstSceneId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function aSceneNode(projectId: Id, overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: newId(),
    projectId,
    parentId: null,
    order: 0,
    kind: 'item',
    name: 'Scène',
    ...overrides,
  };
}

export function aScene(projectId: Id, id: Id = newId(), overrides: Partial<Scene> = {}): Scene {
  return {
    id,
    projectId,
    defaultBattlemapId: null,
    nextSceneIds: [],
    sceneTextActionId: null,
    ...overrides,
  };
}

export function aBattlemap(
  sceneId: Id,
  mediaId: Id,
  overrides: Partial<Battlemap> = {},
): Battlemap {
  return { id: newId(), sceneId, name: 'Carte', mediaId, order: 0, ...overrides };
}

export function anAction(sceneId: Id, overrides: Partial<Action> = {}): Action {
  return {
    id: newId(),
    sceneId,
    name: 'Action',
    trigger: 'manual',
    order: 0,
    isSceneText: false,
    elements: [{ id: newId(), type: 'add-text', text: 'Bonjour' }],
    ...overrides,
  };
}

export function aSoundNode(
  libraryId: SoundLibraryId,
  overrides: Partial<SoundNode> = {},
): SoundNode {
  return {
    id: newId(),
    libraryId,
    parentId: null,
    order: 0,
    kind: 'item',
    name: 'Son',
    ...overrides,
  };
}

export function aMedia(overrides: Partial<Media> = {}): Media {
  const blob = new Blob(['données'], { type: 'image/png' });
  return {
    id: newId(),
    blob,
    mimeType: 'image/png',
    size: blob.size,
    fileName: 'carte.png',
    ...overrides,
  };
}

export function aPlaySession(
  projectId: Id,
  currentSceneId: Id,
  overrides: Partial<PlaySession> = {},
): PlaySession {
  return {
    projectId,
    currentSceneId,
    scenes: {
      [currentSceneId]: {
        visited: true,
        doneActionIds: [],
        currentBattlemapId: null,
        playingSounds: [],
        feed: [],
      },
    },
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
