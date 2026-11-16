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
  Sheet,
  SheetNode,
  LibraryId,
  LibraryNode,
} from '../models';

/**
 * Contrat d'accès aux données (TEC-21, TRD §4.1).
 *
 * C'est le seul point d'entrée vers le stockage : V1 = IndexedDB, plus tard une API.
 * Toutes les méthodes sont asynchrones (TEC-24). Les médias sont exposés sous forme d'URL,
 * jamais de `Blob` (TEC-32), sauf pour l'export d'un projet (`getMediaBlob`, lot 16).
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
   * actions, fiches, bibliothèque de sons du projet, partie sauvegardée et médias devenus
   * inutilisés.
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
  /** Scènes d'un projet (ex. pour lire toutes les « scènes suivantes »). */
  listScenes(projectId: Id): Promise<Scene[]>;
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

  // ── Fiches du MJ (lot 15, TEC-54) ──────────────────────────────────────
  /** Nœuds de l'arborescence des fiches d'un projet, triés par `order`. */
  listSheetNodes(projectId: Id): Promise<SheetNode[]>;
  /** Crée ou remplace plusieurs nœuds en une transaction (déplacement, réordonnancement). */
  saveSheetNodes(nodes: SheetNode[]): Promise<void>;
  /**
   * Supprime un nœud, ses descendants et leurs `Sheet` en une transaction. Les éléments
   * `show-sheet` qui les visent ne sont pas modifiés : ils sont signalés à l'affichage (PRS-07).
   */
  deleteSheetNode(id: Id): Promise<void>;
  /** Textes de toutes les fiches d'un projet (recherche, Présentation). */
  listSheets(projectId: Id): Promise<Sheet[]>;
  getSheet(id: Id): Promise<Sheet | undefined>;
  saveSheet(sheet: Sheet): Promise<void>;
  /**
   * Nombre d'actions du projet qui affichent chaque fiche, par id de `SheetNode` ; une fiche
   * absente du résultat n'est pas utilisée (« Utilisée dans », FCH-07).
   */
  countSheetUsages(projectId: Id): Promise<Record<Id, number>>;

  // ── Bibliothèques (sons et vidéos) ─────────────────────────────────────
  /** Nœuds d'une bibliothèque (`'global'` ou id du projet), triés par `order`. */
  listLibraryNodes(libraryId: LibraryId): Promise<LibraryNode[]>;
  saveLibraryNodes(nodes: LibraryNode[]): Promise<void>;
  /** Supprime un nœud et ses descendants, ainsi que les fichiers son ou vidéo devenus inutilisés. */
  deleteLibraryNode(id: Id): Promise<void>;
  /**
   * Nombre d'actions (tous projets confondus) qui lancent ou arrêtent chaque son, ou lancent
   * chaque vidéo, par id de `LibraryNode` ; un nœud absent du résultat n'est pas utilisé
   * (« Utilisé dans », SON-03, VID-05).
   */
  countLibraryUsages(): Promise<Record<Id, number>>;

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
  /**
   * Contenu d'un média, pour l'export d'un projet (lot 16). Réservé à l'export : un composant
   * passe par `MediaUrls` (TEC-32).
   * @throws DataError `media-not-found`.
   */
  getMediaBlob(id: Id): Promise<Blob>;
  /**
   * Copie le fichier dans le stockage **sous l'identifiant donné** (import d'un projet, fichier
   * d'une vidéo importée sans fichier, lot 16). Un média déjà présent n'est pas remplacé : un média
   * ne change jamais après son import.
   * @returns `true` si le fichier a été enregistré, `false` si le média existait déjà.
   * @throws DataError `unsupported-media-type` (format refusé, TEC-34) ou `quota-exceeded`.
   */
  importMedia(id: Id, file: File, details?: MediaDetails): Promise<boolean>;
  /**
   * Médias référencés par une battlemap ou un élément de bibliothèque, mais absents du stockage
   * (vidéo exportée sans son fichier, VID-13), tous projets confondus.
   */
  listMissingMedia(): Promise<Id[]>;

  // ── Import d'un projet (lot 16, PRJ-05) ────────────────────────────────
  /**
   * Écrit les objets d'un projet **avec leurs identifiants**, en une transaction : un objet de
   * même `id` est remplacé, les objets locaux absents de `data` sont conservés, la partie
   * sauvegardée n'est pas touchée. Les médias s'importent avant, avec `importMedia`.
   *
   * Bibliothèque : un nœud dont l'`id` existe déjà dans **une autre** bibliothèque (ex. resté dans
   * la bibliothèque globale du navigateur d'origine) est conservé tel quel et n'est pas écrit ; un
   * nœud dont le parent n'est ni dans `data`, ni dans sa bibliothèque, est rattaché à la racine.
   *
   * Les données doivent avoir été validées avant (format d'export, 16.2).
   */
  importProjectData(data: ProjectData): Promise<void>;

  // ── Partie sauvegardée ─────────────────────────────────────────────────
  getPlaySession(projectId: Id): Promise<PlaySession | undefined>;
  savePlaySession(session: PlaySession): Promise<void>;
  deletePlaySession(projectId: Id): Promise<void>;
}

/** Nombre de fichiers et place occupée (octets) d'une catégorie de médias. */
export interface MediaUsage {
  count: number;
  bytes: number;
}

/** Place occupée par les médias, par catégorie (NF-14 ; vidéos comptées à part, TEC-36). */
export interface StorageUsage {
  images: MediaUsage;
  sounds: MediaUsage;
  videos: MediaUsage;
}

/** Action contenant des éléments « Changer de scène » : sa scène et les scènes visées. */
export interface SceneLink {
  actionId: Id;
  sceneId: Id;
  targetIds: Id[];
}

/** Objets d'un projet, hors médias et partie sauvegardée (export / import, lot 16). */
export interface ProjectData {
  project: Project;
  sceneNodes: SceneNode[];
  scenes: Scene[];
  battlemaps: Battlemap[];
  actions: Action[];
  sheetNodes: SheetNode[];
  sheets: Sheet[];
  /** Nœuds de bibliothèque (dossiers, sons, vidéos), écrits avec leur `libraryId`. */
  libraryNodes: LibraryNode[];
}

/** Informations lues sur le fichier avant l'import. */
export interface MediaDetails {
  durationMs?: number;
}

/** Jeton d'injection du dépôt ; l'implémentation est choisie dans `app.config.ts` (TEC-22). */
export const DATA_REPOSITORY = new InjectionToken<DataRepository>('DataRepository');
