import { InjectionToken } from '@angular/core';

import {
  Action,
  Battlemap,
  Id,
  MediaInfo,
  PlaySession,
  Project,
  Scene,
  SceneNode,
  SoundLibraryId,
  SoundNode,
} from '../models';

/**
 * Contrat d'accès aux données (TEC-21, TRD §4.1).
 *
 * C'est le seul point d'entrée vers le stockage : V1 = IndexedDB, plus tard une API.
 * Toutes les méthodes sont asynchrones (TEC-24). Les médias sont exposés sous forme d'URL,
 * jamais de `Blob` (TEC-32).
 */
export interface DataRepository {
  // ── Projets ────────────────────────────────────────────────────────────
  /** Projets triés du plus récemment modifié au plus ancien. */
  listProjects(): Promise<Project[]>;
  getProject(id: Id): Promise<Project | undefined>;
  /** Crée ou remplace le projet. */
  saveProject(project: Project): Promise<void>;
  /**
   * Supprime le projet et tout son contenu dans une seule transaction : scènes, battlemaps,
   * actions, bibliothèque de sons du projet, partie sauvegardée et médias devenus inutilisés.
   */
  deleteProject(id: Id): Promise<void>;

  // ── Arborescence des scènes, scènes, battlemaps, actions ───────────────
  /** Nœuds de l'arborescence des scènes d'un projet, triés par `order`. */
  listSceneNodes(projectId: Id): Promise<SceneNode[]>;
  /** Crée ou remplace plusieurs nœuds en une transaction (déplacement, réordonnancement). */
  saveSceneNodes(nodes: SceneNode[]): Promise<void>;
  /**
   * Supprime un nœud et ses descendants ; pour chaque scène supprimée : la scène, ses battlemaps,
   * ses actions et les médias devenus inutilisés. Les références vers ces scènes sont retirées
   * (`Project.firstSceneId`, `Scene.nextSceneIds`) ; celles des éléments `change-scene` sont
   * signalées à l'affichage (PRS-07).
   */
  deleteSceneNode(id: Id): Promise<void>;
  getScene(id: Id): Promise<Scene | undefined>;
  saveScene(scene: Scene): Promise<void>;
  /** Battlemaps d'une scène, triées par `order`. */
  listBattlemaps(sceneId: Id): Promise<Battlemap[]>;
  saveBattlemap(battlemap: Battlemap): Promise<void>;
  /** Supprime la battlemap, son image si elle n'est plus utilisée, et la retire de `Scene.defaultBattlemapId`. */
  deleteBattlemap(id: Id): Promise<void>;
  /** Actions d'une scène, triées par `order`. */
  listActions(sceneId: Id): Promise<Action[]>;
  saveAction(action: Action): Promise<void>;
  deleteAction(id: Id): Promise<void>;
  /**
   * Liens « Changer de scène » du projet : pour chaque action qui en contient, sa scène et les
   * scènes visées (avertissement à la suppression d'une scène, PRS-07).
   */
  listSceneLinks(projectId: Id): Promise<SceneLink[]>;

  // ── Bibliothèques de sons ──────────────────────────────────────────────
  /** Nœuds d'une bibliothèque (`'global'` ou id du projet), triés par `order`. */
  listSoundNodes(libraryId: SoundLibraryId): Promise<SoundNode[]>;
  saveSoundNodes(nodes: SoundNode[]): Promise<void>;
  /** Supprime un nœud et ses descendants, ainsi que les fichiers son devenus inutilisés. */
  deleteSoundNode(id: Id): Promise<void>;
  /**
   * Nombre d'actions (tous projets confondus) qui lancent ou arrêtent chaque son, par id de
   * `SoundNode` ; un son absent du résultat n'est pas utilisé (« Utilisé dans », SON-03).
   */
  countSoundUsages(): Promise<Record<Id, number>>;

  // ── Médias ─────────────────────────────────────────────────────────────
  /**
   * Copie le fichier dans le stockage et renvoie l'id du média, avec les informations déjà lues
   * (ex. durée d'un son, 6.7).
   * @throws DataError `unsupported-media-type` (format refusé, TEC-34) ou `quota-exceeded`.
   */
  uploadMedia(file: File, details?: MediaDetails): Promise<Id>;
  /** Informations des médias demandés (sans leur contenu) ; les médias introuvables sont ignorés. */
  getMediaInfo(ids: readonly Id[]): Promise<MediaInfo[]>;
  /**
   * URL utilisable dans `src` (`blob:` en V1, `https:` avec l'API). Ne pas appeler directement
   * depuis un composant : passer par `MediaUrls`, qui partage et libère les URL (TEC-33).
   * @throws DataError `media-not-found`.
   */
  getMediaUrl(mediaId: Id): Promise<string>;
  /** Nombre et taille des médias enregistrés, par type (place utilisée, NF-14). */
  getStorageUsage(): Promise<StorageUsage>;
  /** Supprime le média, seulement s'il n'est plus référencé par une battlemap ou un son. */
  deleteMedia(id: Id): Promise<void>;

  // ── Partie sauvegardée ─────────────────────────────────────────────────
  getPlaySession(projectId: Id): Promise<PlaySession | undefined>;
  savePlaySession(session: PlaySession): Promise<void>;
  deletePlaySession(projectId: Id): Promise<void>;
}

/** Place occupée par les médias (images et sons), en octets. */
export interface StorageUsage {
  images: { count: number; bytes: number };
  sounds: { count: number; bytes: number };
}

/** Action contenant des éléments « Changer de scène » : sa scène et les scènes visées. */
export interface SceneLink {
  actionId: Id;
  sceneId: Id;
  targetIds: Id[];
}

/** Informations lues sur le fichier avant l'import. */
export interface MediaDetails {
  durationMs?: number;
}

/** Jeton d'injection du dépôt ; l'implémentation est choisie dans `app.config.ts` (TEC-22). */
export const DATA_REPOSITORY = new InjectionToken<DataRepository>('DataRepository');
