# JDR Manager — Technical Requirements Document (TRD)

| | |
|---|---|
| **Produit** | JDR Manager |
| **Auteur** | Allan Renou |
| **Version du document** | 1.0 — 5 novembre 2026 |
| **Statut** | Brouillon, à valider avant le début du développement |
| **Documents liés** | [`PRD.md`](./PRD.md) (exigences produit) · [`specifications.md`](./specifications.md) (détail fonctionnel) · [Maquettes](https://claude.ai/artifact/6okmitt29oTdimnuJDEaqk) (écrans de référence) · [`Brief_UI_UX.md`](./Brief_UI_UX.md) (charte graphique) · [`Plan_implementation.md`](./Plan_implementation.md) (plan de réalisation) |

Ce document décrit **comment** l'application est construite : choix techniques, architecture, modèle de données, moteurs internes et exigences techniques. Le **quoi** et le **pourquoi** sont dans le PRD ; les identifiants `PRJ-`, `ACT-`, `PRS-`… y renvoient.

---

## 1. Exigences techniques

**Priorités (MoSCoW)** : **M** = Must · **S** = Should · **C** = Could · **W** = Won't (version future).

### 1.1 Stack et conventions

| ID | Exigence | Priorité |
|---|---|---|
| TEC-01 | Application **Angular**, dernière version stable (**v22** à date ; Angular passe à une version majeure par an). | M |
| TEC-02 | Composants **standalone** uniquement (aucun `NgModule`). | M |
| TEC-03 | État géré avec les **signals** (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) ; `input()`, `output()`, `model()` pour les composants. | M |
| TEC-04 | Application **zoneless** (sans Zone.js) ; stratégie de détection `OnPush` sur tous les composants (stratégie par défaut depuis Angular 22 : ne pas la déclarer, et ne jamais utiliser `Eager`). | M |
| TEC-05 | Templates avec le **control flow** natif (`@if`, `@for`, `@switch`, `@defer`, `@let`). | M |
| TEC-06 | Formulaires d'édition avec **Signal Forms**. | M |
| TEC-07 | Injection avec `inject()` (pas d'injection par constructeur). | M |
| TEC-08 | Composants UI : **Angular Material** et **Angular CDK** (Drag & Drop, Overlay, Dialog). | M |
| TEC-09 | TypeScript en mode `strict` ; lint avec **angular-eslint** ; formatage avec **Prettier**. | M |
| TEC-10 | Routage avec chargement paresseux (`loadComponent`) des modes Édition et Présentation. | S |
| TEC-18 | Utiliser **Angular CLI** autant que possible pendant l'implémentation, plutôt que de créer ou modifier les fichiers à la main (cf. §2.4). | M |
| TEC-19 | Nommage des services : décorateur `@Service()` d'Angular 22 et noms **sans suffixe** `Service`, comme les génère `ng g service` (ex. `Theme`, `UiPreferences`). Si le nom court masque un objet global du navigateur, choisir un nom plus précis (ex. `AudioPlayer` et non `Audio`, `MediaUrls`). Les noms de services cités dans ce document suivent cette règle. | S |

### 1.1 bis Styles et thèmes

| ID | Exigence | Priorité |
|---|---|---|
| TEC-11 | Tous les styles sont écrits en **SCSS** (styles globaux et styles de composants, `inlineStyleLanguage: scss`). | M |
| TEC-12 | Chaque thème est défini dans **un seul fichier** `src/styles/themes/_<theme>.scss`, sous forme de map SCSS contenant **tous** les jetons du Brief UI/UX (§2). Une map incomplète fait échouer la compilation (contrôle par une fonction SCSS). | M |
| TEC-13 | Les maps de thème sont converties en **variables CSS** (`--bg-app`, `--accent`…) sous un sélecteur `[data-theme="<theme>"]` ; le thème par défaut est aussi appliqué à `:root`. Changer de thème = changer l'attribut `data-theme` de `<html>`, sans rechargement. | M |
| TEC-14 | Les composants n'utilisent que des jetons : variables CSS via des fonctions SCSS (`color(accent)`, `space(4)`, `radius(md)`…). Aucune valeur en dur (couleur, taille, rayon, ombre) dans un fichier de composant ; une règle **Stylelint** le vérifie. | M |
| TEC-15 | Le thème **Angular Material** (M3, `mat.theme()` et surcharges `mat.*-overrides`) est branché sur les mêmes variables CSS, pour que les composants Material suivent le thème. | M |
| TEC-16 | Un service `Theme` (signal `theme`) applique le thème, le mémorise via le service `UiPreferences` (TEC-62) et l'applique au démarrage avant le premier affichage (pas de flash de l'ancien thème). La fenêtre joueurs reçoit le thème courant via `BroadcastChannel`. | M |
| TEC-17 | Deux thèmes en V1 : **Nuit dorée** (par défaut) et **Automne** (Brief UI/UX §11). | M |

### 1.2 Persistance

| ID | Exigence | Priorité |
|---|---|---|
| TEC-20 | Données stockées dans **IndexedDB**, via la librairie **`idb`**. | M |
| TEC-21 | Toutes les lectures / écritures passent par une **couche d'accès dédiée** : une interface (contrat) + une implémentation IndexedDB, remplaçable par une implémentation API **sans modifier le reste de l'application** (cf. §4). | M |
| TEC-22 | Le choix de l'implémentation se fait à **un seul endroit** (fournisseur Angular via un `InjectionToken`). | M |
| TEC-23 | Aucun composant ni service métier n'importe `idb` ou n'accède directement à IndexedDB. | M |
| TEC-24 | Toutes les méthodes de la couche d'accès sont **asynchrones** (`Promise`), y compris en V1. | M |
| TEC-25 | Le schéma IndexedDB est **versionné**, avec des migrations écrites dans le callback `upgrade` de `idb`. | M |
| TEC-26 | Au démarrage, l'application demande un stockage persistant (`navigator.storage.persist()`). | M |
| TEC-27 | Implémentation **API** de la couche d'accès. | W |

### 1.3 Médias (images, sons)

| ID | Exigence | Priorité |
|---|---|---|
| TEC-30 | Les fichiers importés sont **copiés** en `Blob` natif (pas de base64, pas de chemin vers le fichier d'origine). | M |
| TEC-31 | Les `Blob` sont rangés dans un store dédié `media`, indexé par identifiant ; les autres entités ne contiennent que l'**identifiant** du média. | M |
| TEC-32 | La couche d'accès expose des **URL de médias** (`blob:` en V1, `https:` avec l'API), jamais des `Blob`, aux composants. | M |
| TEC-33 | Les URL `blob:` sont libérées (`URL.revokeObjectURL`) quand le média n'est plus utilisé. | M |
| TEC-34 | Formats acceptés à l'import : images `png`, `jpg`/`jpeg`, `webp` ; sons `mp3`, `ogg`, `wav`, `m4a`. Un format refusé ou un quota dépassé affiche un message clair. | M |
| TEC-35 | Import par **glisser-déposer depuis le disque** via une directive réutilisable (`appFileDrop`) posée sur l'écran de la bibliothèque de sons et sur l'éditeur de scène : écoute de `dragenter` / `dragover` / `dragleave` / `drop` au niveau de la fenêtre, calque plein écran affiché seulement si `dataTransfer.types` contient `Files` (pour ne pas réagir aux glisser-déposer internes du CDK), compteur d'entrées / sorties pour éviter le clignotement, filtrage des types MIME (TEC-34), puis appel de `uploadMedia` pour chaque fichier. La destination (dossier ouvert ou scène ouverte) est fournie par l'écran hôte. | M |

### 1.4 Audio

| ID | Exigence | Priorité |
|---|---|---|
| TEC-40 | Lecture via un élément `<audio>` par son, relié à l'**API Web Audio** (`MediaElementAudioSourceNode` → `GainNode` → sortie). | M |
| TEC-41 | Les sons ne sont **jamais entièrement décodés** en mémoire (`decodeAudioData` interdit pour la lecture). | M |
| TEC-42 | Volume, boucle, fondus (entrée / sortie), **pause / reprise** par son et **réglage du volume en direct** gérés par un **service audio unique**, avec `GainNode.gain.linearRampToValueAtTime`. | M |
| TEC-43 | L'`AudioContext` est créé ou repris (`resume()`) sur le premier clic de l'utilisateur, pour respecter les règles de lecture automatique des navigateurs. | M |

### 1.5 Présentation

| ID | Exigence | Priorité |
|---|---|---|
| TEC-50 | Un **moteur d'exécution des actions** indépendant de l'interface exécute les éléments en séquence, de façon asynchrone (cf. §6). | M |
| TEC-51 | Chaque exécution d'action est **annulable** (`AbortController`) : changement de scène, attente, clic en attente. | M |
| TEC-52 | L'état de la partie est **sauvegardé à chaque événement** (élément exécuté, battlemap changée, son lancé / arrêté, clic validé). | M |
| TEC-53 | Fenêtre joueurs : ouverte avec `window.open` sur une route dédiée, synchronisée avec l'écran du MJ par **`BroadcastChannel`**. | S |

### 1.6 Composants partagés

| ID | Exigence | Priorité |
|---|---|---|
| TEC-60 | Un **composant d'arborescence générique** unique (`TreeComponent<T>`) sert pour les scènes, les bibliothèques de sons, la navigation libre et les fenêtres de sélection (scènes suivantes, cible de « Changer de scène », choix d'un son) (cf. §8). | M |
| TEC-61 | Le composant d'arborescence ne connaît que « dossier » et « élément » : libellés (`labels`), entrées de menu spécifiques (`extraMenuItems`), affichage d'une ligne (`itemTemplate`) et mode de sélection (`selectionMode`, `disabledIds`) sont fournis par le composant parent. | M |
| TEC-62 | Les **préférences d'affichage** (parties repliées du panneau de Présentation, etc.) sont gérées par un service `UiPreferences` et stockées dans le `localStorage` (lecture / écriture dans un `try/catch`). Elles ne font pas partie des données de projet ni de la partie sauvegardée, et ne passent donc pas par `DataRepository`. | S |

### 1.7 Internationalisation

| ID | Exigence | Priorité |
|---|---|---|
| TEC-70 | Traductions avec **Transloco** ; langue par défaut `fr`, fichier `i18n/fr.json`. | M |
| TEC-71 | Aucun texte d'interface en dur dans les templates ou les composants. | M |
| TEC-72 | Les clés de traduction sont organisées par domaine (`common.*`, `project.*`, `scene.*`, `action.*`, `presentation.*`, `sound.*`, `error.*`). | S |
| TEC-73 | Ajout d'autres langues (`en.json`…) et sélecteur de langue. | W |

### 1.8 Qualité et tests

| ID | Exigence | Priorité |
|---|---|---|
| TEC-80 | Tests **unitaires** avec **Vitest** (lanceur par défaut d'Angular). | M |
| TEC-81 | Couverture obligatoire : moteur d'exécution des actions, gestion de l'état de partie, couche d'accès IndexedDB (avec `fake-indexeddb`), service audio (Web Audio simulé). | M |
| TEC-82 | Les composants d'interface sont testés si leur logique le justifie (arborescence générique notamment). | S |
| TEC-83 | Tests de bout en bout (Playwright). | W |

### 1.9 Compatibilité et performance

| ID | Exigence | Priorité |
|---|---|---|
| TEC-90 | Cibles : dernières versions de **Chrome**, **Edge** et **Firefox** sur PC. Aucune API réservée à Chromium (ex. *File System Access API*). | M |
| TEC-91 | Lors de la création d'URL `blob:`, seuls les médias de la scène courante sont chargés ; les autres sont chargés à la demande. | M |
| TEC-92 | Le fil d'actualité affiche les battlemaps en miniature (image redimensionnée en CSS, `loading="lazy"`). | S |
| TEC-93 | Les grilles de cartes (ex. liste des projets) adaptent leur nombre de colonnes à la largeur de l'écran, en CSS : `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`. Avec peu d'éléments, les cartes gardent leur largeur et restent alignées à gauche (`auto-fill`, pas `auto-fit`). | M |

---

## 2. Architecture générale

### 2.1 Couches

```
┌─────────────────────────────────────────────────────────────┐
│  Interface (composants standalone)                          │
│  Projets · Édition · Présentation · Fenêtre joueurs          │
├─────────────────────────────────────────────────────────────┤
│  Services métier (signals)                                   │
│  ProjectStore · SceneEditor · PresentationEngine ·          │
│  ActionRunner · AudioPlayer · PlayerWindowSync              │
├─────────────────────────────────────────────────────────────┤
│  Couche d'accès aux données (interface DataRepository)       │
│      ├── IndexedDbRepository  (V1, librairie idb)            │
│      └── ApiRepository        (future)                       │
└─────────────────────────────────────────────────────────────┘
```

Règle : une couche n'appelle que la couche juste en dessous. Les composants n'appellent jamais `DataRepository` directement, ils passent par les services métier.

### 2.2 Organisation du code

```
src/app/
├── core/
│   ├── data/                  # DataRepository (interface), token, IndexedDbRepository
│   ├── models/                # Types du modèle de données
│   ├── media/                 # MediaUrls (création / libération des URL blob:)
│   └── i18n/                  # Configuration Transloco
├── shared/
│   ├── tree/                  # TreeComponent<T> générique
│   └── ui/                    # Petits composants réutilisables (confirmations, messages d'erreur…)
├── features/
│   ├── projects/              # Liste et gestion des projets
│   ├── sound-library/         # Bibliothèques de sons (globale + projet)
│   ├── editor/                # Mode Édition : scènes, battlemaps, actions
│   └── presentation/
│       ├── engine/            # PresentationEngine, ActionRunner, état de partie
│       ├── audio/             # AudioPlayer
│       ├── gm-screen/         # Écran du MJ (fil d'actualité, contrôles)
│       └── player-screen/     # Fenêtre joueurs
└── app.routes.ts
public/i18n/fr.json
```

### 2.3 Routes

| Route | Écran |
|---|---|
| `/projects` | Liste des projets |
| `/sounds` | Bibliothèque globale de sons (ouverte depuis l'accueil) |
| `/projects/:projectId/sounds` | Mode Édition — sons du projet et bibliothèque globale (onglet « Sons ») |
| `/settings` | Paramètres (Apparence) |
| `/projects/:projectId/edit` | Mode Édition |
| `/projects/:projectId/play` | Mode Présentation — écran du MJ. `?demo=1&scene=<id>` : mode démo (PRS-09), partie en mémoire seulement, à partir de `scene` (sinon la dernière scène ouverte dans l’éditeur) |
| `/projects/:projectId/player` | Mode Présentation — fenêtre joueurs |


### 2.4 Utilisation d'Angular CLI

Toute opération que la CLI sait faire passe par elle : le code généré respecte ainsi les conventions du framework, met à jour les bons fichiers et reste cohérent d'un développeur (ou d'une session) à l'autre.

| Besoin | Commande |
|---|---|
| Créer le projet | `ng new jdr-manager --style=scss --routing --ssr=false` (standalone et zoneless par défaut) |
| Composants, services, directives, pipes, guards, interfaces, enums | `ng generate component …`, `ng generate service …`, `ng generate directive …`, `ng g pipe …`, `ng g guard …`, `ng g interface …`, `ng g enum …` |
| Ajouter une librairie qui fournit un schematic | `ng add @angular/material`, `ng add @jsverse/transloco`, `ng add @angular-eslint/schematics` |
| Environnements | `ng generate environments` |
| Mettre à jour Angular et les librairies | `ng update @angular/core @angular/cli`, puis `ng update` pour les autres paquets |
| Migrations proposées par Angular | `ng generate @angular/core:<migration>` (ex. control flow, signal inputs, `inject()`) |
| Lancer, tester, construire | `ng serve`, `ng test` (Vitest), `ng build`, `ng lint` |

Règles :

- Les valeurs par défaut des schematics sont fixées dans `angular.json` pour que chaque `ng generate` produise directement le bon code : `style: scss`, `changeDetection: OnPush`, `skipTests: false`, préfixe `app`.
- Les fichiers sont générés dans le bon dossier de l'arborescence (§2.2) avec l'option `--path` ou en indiquant le chemin dans le nom (`ng g c features/editor/scene-panel`).
- On n'écrit à la main que ce que la CLI ne sait pas générer (contenu métier, styles, fichiers de thème…).
- Une librairie sans schematic est installée avec `npm install`, puis configurée à la main ; la raison est notée dans le code ou dans ce document.
---

## 3. Modèle de données

Tous les identifiants sont des UUID (`crypto.randomUUID()`).

```ts
type Id = string;

interface Project {
  id: Id;
  name: string;
  firstSceneId: Id | null;
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

/** Nœud d'arborescence commun aux scènes et aux sons */
interface TreeNode {
  id: Id;
  parentId: Id | null;          // null = racine
  order: number;                // position parmi les frères
  kind: 'folder' | 'item';
  name: string;
}

interface SceneNode extends TreeNode {
  projectId: Id;
}

interface Scene {
  id: Id;                       // = id du SceneNode de type 'item'
  projectId: Id;
  defaultBattlemapId: Id | null;
  nextSceneIds: Id[];
  sceneTextActionId: Id | null; // action « Texte de scène »
}

interface Battlemap {
  id: Id;
  sceneId: Id;
  name: string;
  mediaId: Id;
  order: number;
}

interface SoundNode extends TreeNode {
  libraryId: 'global' | Id;     // 'global' ou id du projet
  mediaId?: Id;                 // présent si kind = 'item'
}

interface Media {
  id: Id;
  blob: Blob;
  mimeType: string;
  size: number;
  fileName: string;             // nom du fichier d'origine (nom par défaut d'un son, export)
  durationMs?: number;          // durée d'un son, lue à l'import (absente si illisible)
}

type Trigger = 'scene-open' | 'manual';

interface Action {
  id: Id;
  sceneId: Id;
  name: string;
  trigger: Trigger;
  order: number;
  isSceneText: boolean;         // true = action « Texte de scène » (non supprimable)
  elements: ActionElement[];
}

type ActionElement =
  | { id: Id; type: 'show-battlemap'; battlemapId: Id }
  | { id: Id; type: 'play-sound'; soundId: Id; volume: number; loop: boolean; fadeInMs: number; fadeOutMs: number }
  | { id: Id; type: 'stop-sound'; soundId: Id }
  | { id: Id; type: 'stop-all-sounds' }
  | { id: Id; type: 'add-text'; text: string }
  | { id: Id; type: 'change-scene'; sceneId: Id }
  | { id: Id; type: 'wait'; seconds: number }
  | { id: Id; type: 'user-click'; text: string };

/** Partie sauvegardée (une par projet en V1) */
interface PlaySession {
  projectId: Id;                // clé
  currentSceneId: Id;
  scenes: Record<Id, SceneState>;
  updatedAt: string;
}

interface SceneState {
  visited: boolean;
  doneActionIds: Id[];
  currentBattlemapId: Id | null;
  playingSounds: { soundId: Id; elementId: Id | null; paused: boolean; volume: number }[];  // elementId → paramètres de lecture ; volume = réglage en direct
  feed: FeedItem[];
}

type FeedItem =
  | { id: Id; type: 'text'; actionId: Id; elementId: Id }
  | { id: Id; type: 'battlemap'; battlemapId: Id }
  | { id: Id; type: 'user-click'; actionId: Id; elementId: Id; validated: boolean };
```

Notes :

- Le fil d'actualité ne stocke que des **références** (`elementId`, `battlemapId`) : le texte affiché est toujours lu dans l'action. Une action ou une battlemap supprimée est donc détectée à l'affichage (PRD PRS-07).
- Le paramétrage audio (volume, boucle, fondus) est porté par l'élément `play-sound`, pas par le son (cf. spécifications §3).

---

## 4. Couche d'accès aux données

### 4.1 Contrat

```ts
export interface DataRepository {
  // Projets
  listProjects(): Promise<Project[]>;
  getProject(id: Id): Promise<Project | undefined>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: Id): Promise<void>;        // supprime aussi scènes, actions, médias, partie

  // Arborescence des scènes, scènes, battlemaps, actions
  listSceneNodes(projectId: Id): Promise<SceneNode[]>;
  saveSceneNodes(nodes: SceneNode[]): Promise<void>;
  deleteSceneNode(id: Id): Promise<void>;
  getScene(id: Id): Promise<Scene | undefined>;
  saveScene(scene: Scene): Promise<void>;
  listBattlemaps(sceneId: Id): Promise<Battlemap[]>;
  saveBattlemap(battlemap: Battlemap): Promise<void>;
  deleteBattlemap(id: Id): Promise<void>;
  listActions(sceneId: Id): Promise<Action[]>;
  saveAction(action: Action): Promise<void>;
  deleteAction(id: Id): Promise<void>;
  listSceneLinks(projectId: Id): Promise<SceneLink[]>; // actions « Changer de scène » : { actionId, sceneId, targetIds }

  // Bibliothèques de sons
  listSoundNodes(libraryId: 'global' | Id): Promise<SoundNode[]>;
  saveSoundNodes(nodes: SoundNode[]): Promise<void>;
  deleteSoundNode(id: Id): Promise<void>;
  countSoundUsages(): Promise<Record<Id, number>>;   // nb d'actions qui lancent / arrêtent chaque son

  // Médias
  uploadMedia(file: File, details?: { durationMs?: number }): Promise<Id>;
  getMediaInfo(ids: Id[]): Promise<Omit<Media, 'blob'>[]>;   // infos sans le contenu (tableau des sons)
  getMediaUrl(mediaId: Id): Promise<string>;   // blob: en V1, https: avec l'API
  deleteMedia(id: Id): Promise<void>;
  getStorageUsage(): Promise<StorageUsage>;   // { images, sounds } : { count, bytes } (Paramètres › Stockage, NF-14)

  // Partie sauvegardée
  getPlaySession(projectId: Id): Promise<PlaySession | undefined>;
  savePlaySession(session: PlaySession): Promise<void>;
  deletePlaySession(projectId: Id): Promise<void>;
}

export const DATA_REPOSITORY = new InjectionToken<DataRepository>('DataRepository');
```

Fournisseur unique, dans `app.config.ts` :

```ts
{ provide: DATA_REPOSITORY, useExisting: IndexedDbRepository }
```

`useExisting` garantit une seule instance du dépôt, donc une seule connexion à la base.

Les erreurs métier sont des `DataError` (`core/data/data-error.ts`) avec un `code` (`unsupported-media-type`, `quota-exceeded`, `media-not-found`) et une clé de traduction `error.data.<code>` : les écrans affichent un message clair sans rien savoir du stockage.

### 4.2 Schéma IndexedDB (version 1)

| Store | Clé | Index |
|---|---|---|
| `projects` | `id` | — |
| `sceneNodes` | `id` | `projectId` |
| `scenes` | `id` | `projectId` |
| `battlemaps` | `id` | `sceneId`, `mediaId` |
| `actions` | `id` | `sceneId` |
| `soundNodes` | `id` | `libraryId`, `mediaId` |
| `media` | `id` | — |
| `playSessions` | `projectId` | — |

- Les suppressions en cascade (projet → scènes → actions → médias) se font dans **une seule transaction**.
- Un média n'est supprimé que s'il n'est plus référencé : les index `mediaId` permettent de le vérifier sans parcourir tous les stores.
- Supprimer une scène retire aussi les références vers elle (`Project.firstSceneId`, `Scene.nextSceneIds`) ; supprimer une battlemap vide `Scene.defaultBattlemapId`. Les éléments d'action qui visent un objet supprimé (battlemap, son, scène cible d'un `change-scene`) ne sont **pas** modifiés : ils sont signalés à l'écran, dans l'éditeur comme en Présentation (PRS-07, décision d'Allan).
- Seuls les fichiers de `core/data` importent `idb` ou utilisent `indexedDB` : règle ESLint (TEC-23).

---

## 5. Gestion des médias

- `uploadMedia(file)` vérifie le type MIME (TEC-34), copie le `File` en `Blob` dans le store `media` et renvoie son identifiant. Le type est déterminé par `resolveMediaType()` (`core/media/media-types.ts`) : type MIME du navigateur, sinon extension, avec normalisation des variantes (`audio/x-wav` → `audio/wav`…).
- `MediaUrls` tient un cache `mediaId → URL blob:` avec un **compteur de références** : l'URL est créée au premier usage et libérée (`revokeObjectURL`) quand plus aucun composant ne l'utilise. API : `acquire(id)` / `release(id)` ; dans un composant, `track(() => id)` renvoie les signals `url` et `missing` et libère automatiquement à la destruction.
- En cas de `QuotaExceededError`, l'import échoue proprement (`DataError('quota-exceeded')`) et un message est affiché.
- Avec l'API, `getMediaUrl` renverra une URL distante et `MediaUrls` n'aura plus rien à libérer : aucun composant ne change.

---

## 6. Moteur de présentation

### 6.1 Composants du moteur

| Service | Rôle |
|---|---|
| `PresentationEngine` | Charge la partie, ouvre / quitte les scènes, expose l'état courant sous forme de signals (scène, fil, battlemap, sons, actions disponibles). |
| `ActionRunner` | Exécute les éléments d'une action en séquence ; gère l'attente, le clic utilisateur et l'annulation. |
| `PlaySessionStore` | Applique chaque événement à l'état `PlaySession` et le sauvegarde immédiatement (TEC-52). |
| `AudioPlayer` | Lecture, volume, boucle, fondus, arrêt d'un son ou de tous (cf. §7). |

### 6.2 Exécution d'une action

```ts
async run(action: Action, context: ActionContext, signal: AbortSignal): Promise<RunOutcome> {
  for (const element of action.elements) {
    signal.throwIfAborted();
    switch (element.type) {
      case 'wait':            await context.wait(element, signal); break;
      case 'user-click':      await context.waitForUserClick(action, element, signal); break;
      case 'add-text':        context.addText(action, element); break;   // ou revient au texte s'il existe déjà
      case 'show-battlemap':  context.showBattlemap(element); break;
      case 'play-sound':      context.playSound(element); break;
      case 'stop-sound':      context.stopSound(element); break;
      case 'stop-all-sounds': context.stopAllSounds(); break;
      case 'change-scene':
        context.markDone(action);
        return context.canChangeScene(element) ? { kind: 'change-scene', sceneId: element.sceneId } : { kind: 'done' };
    }
  }
  context.markDone(action);
  return { kind: 'done' };
}
```

- L'`ActionContext` est fourni par `PresentationEngine` pour la scène de l'action : chaque méthode applique l'événement à la partie et l'enregistre (TEC-52). Le runner **renvoie** la scène cible d'un « Changer de scène » ; c'est le moteur qui l'ouvre (une action n'annule pas son propre signal).
- Chaque scène possède un `AbortController` ; quitter la scène appelle `abort()`, ce qui interrompt toutes ses actions en cours (attente, clic en attente). Une action interrompue n'est pas marquée effectuée.
- `wait` attend `delay(element.seconds * 1000, signal)` et publie l'attente dans le signal `waits` du moteur pendant sa durée (ligne du fil avec le temps restant, ACT-10) ; elle n'est pas enregistrée dans la partie.
- `waitForUserClick` ajoute le bloc au fil et renvoie une `Promise` résolue au clic sur « Continuer » (`engine.continueClick(itemId)`) ou rejetée à l'annulation ; un bloc créé par une action interrompue est retiré du fil.
- Relance d'une action (PRD CTL-03) : un texte ou un bloc de clic déjà présent dans le fil n'est pas ajouté une deuxième fois ; le fil revient sur lui (signal `focus`).
- Les actions d'ouverture s'exécutent **dans l'ordre**, en commençant par l'action « Texte de scène » (`isSceneText`).
- Afficher la battlemap déjà affichée n'ajoute pas de miniature ; la battlemap par défaut d'une scène n'est pas ajoutée au fil.

### 6.3 Changement de scène

1. `abort()` sur le contrôleur de la scène quittée.
2. `AudioPlayer.stopAll()` (chaque son avec son fondu de sortie).
3. Sauvegarde de l'état de la scène quittée et de `currentSceneId`.
4. Scène jamais visitée → battlemap par défaut, puis actions d'ouverture. Scène déjà visitée → restauration de son `SceneState` ; les sons de `playingSounds` sont relancés depuis le début, avec leur volume, et restent en pause s'ils l'étaient.

### 6.4 Reprise d'une partie

- À l'ouverture de `/play`, si `getPlaySession(projectId)` renvoie une partie, une boîte de dialogue propose **Continuer** / **Recommencer** (avec avertissement et confirmation).
- Ce clic sert aussi à débloquer l'audio (TEC-43).
- Références vers des éléments supprimés : action ignorée, battlemap remplacée par un message d'erreur, son non lancé avec message d'erreur (PRD PRS-07).

---

## 7. Moteur audio

- Un `AudioContext` unique pour l'application.
- Pour chaque son lancé : un `HTMLAudioElement` (`src` = URL du média, `loop` selon l'élément) → `MediaElementAudioSourceNode` → `GainNode` → `destination`.
- Fondu en entrée : gain à 0, puis rampe jusqu'au volume en `fadeInMs`.
- Fondu en sortie (arrêt) : rampe du gain jusqu'à 0 en `fadeOutMs`, puis `pause()` et libération des nœuds.
- Arrêt au changement de scène : fondu en sortie de chaque son avec sa propre durée (ou une durée par défaut si le son a été lancé à la main).
- Pause d'un son (contrôle manuel du MJ) : courte rampe du gain vers 0, puis `pause()` ; la reprise fait `play()` puis remonte le gain au volume courant. Il n'y a **pas d'arrêt manuel** : un son ne s'arrête que par un élément d'action (« Arrêter un son », « Arrêter tous les sons ») ou au changement de scène.
- Bouton global : `pauseAll()` si au moins un son joue, sinon `resumeAll()` ; un signal `computed` `anyPlaying` détermine l'icône affichée.
- Volume en direct : `setVolume(soundId, value)` ajuste le `GainNode` et met à jour `playingSounds`.
- Un même son ne joue qu'une fois à la fois : le relancer remplace la lecture en cours.
- L'état exposé (signal `sounds`, et `onChange()` pour la sauvegarde) alimente les contrôles de l'écran du MJ et `PlaySessionStore`.
- API (`AudioPlayer`, service global) : `unlock()`, `play(request, { paused, volume })` (renvoie `false` si le fichier est introuvable), `stop(soundId)`, `stopAll()`, `pause` / `resume`, `setVolume`, `pauseAll` / `resumeAll`, signals `sounds` et `anyPlaying`. L'`AudioContext` vient de la fabrique `AUDIO_CONTEXT_FACTORY` (remplaçable dans les tests).

---

## 8. Composant d'arborescence générique

```ts
@Component({ selector: 'app-tree', ... })
export class TreeComponent<T extends TreeNode> {
  nodes = input.required<T[]>();
  selectedId = model<Id | null>(null);
  editable = input(true);                 // false en navigation libre et dans les fenêtres de sélection
  labels = input<TreeLabels>();            // clés de traduction : « nouvel élément », confirmation de suppression…
  selectionMode = input<'none' | 'single' | 'multiple'>('none');  // cases à cocher / boutons radio
  disabledIds = input<Id[]>([]);           // ex. la scène actuelle dans la sélection des scènes suivantes

  itemTemplate = contentChild<TemplateRef<{ $implicit: T }>>('item');

  /** Entrées supplémentaires du menu contextuel, fournies par le parent
      (ex. « Définir comme première scène », « Dupliquer ») */
  extraMenuItems = input<TreeMenuItem<T>[]>([]);

  create = output<{ parentId: Id | null; kind: 'folder' | 'item' }>();
  rename = output<{ id: Id; name: string }>();
  remove = output<Id>();
  move = output<{ id: Id; parentId: Id | null; order: number }>();
}

interface TreeMenuItem<T> {
  label: string;                          // clé de traduction Transloco
  appliesTo: 'folder' | 'item' | 'both';
  run: (node: T) => void;
}
```

- Construit l'arbre à partir d'une liste plate (`parentId`, `order`) avec un `computed`.
- Plier / déplier, sélection, glisser-déposer (CDK Drag & Drop), création, renommage, suppression avec confirmation.
- **Menu contextuel** par ligne (CDK Menu) : ouvert par un bouton « ⋯ » visible au survol / au focus clavier, ou par un clic droit (`contextmenu`). Entrées communes : nouvel élément, nouveau sous-dossier (dossiers), renommer, supprimer ; entrées spécifiques via `extraMenuItems`.
- Le message de confirmation de suppression d'un dossier précise que son contenu sera supprimé.
- Ne connaît pas le type des éléments : leur affichage est fourni par le parent via `itemTemplate`, et les modifications sont remontées par des `output` (le composant ne sauvegarde rien lui-même).

---

## 9. Fenêtre joueurs

- Ouverte par `window.open('/projects/:id/player', 'jdr-manager-player-<id>', 'popup')` depuis l'écran du MJ, **dans le gestionnaire du clic** de lancement (sinon le navigateur la bloque) ; bouton « Ouvrir la fenêtre joueurs » dans l'en-tête si elle a été bloquée ou fermée.
- Communication par `BroadcastChannel('jdr-manager:<projectId>')` (`player-screen/player-channel.ts`) :
  - MJ → joueurs : `{ type: 'show-battlemap', sceneId, battlemapId }`, `{ type: 'clear' }`, `{ type: 'theme', theme }` (TEC-16), `{ type: 'hello' }` (l'écran du MJ démarre) ;
  - joueurs → MJ : `{ type: 'ping' }` (ouverture, rechargement, réponse à `hello` : demande l'état courant), `{ type: 'bye' }` (fermeture).
- Les messages transportent des **identifiants**, pas des URL : la fenêtre joueurs résout elle-même l'image via la couche d'accès (`listBattlemaps(sceneId)` puis `MediaUrls`) ; une URL `blob:` n'est pas garantie d'une fenêtre à l'autre.
- À son ouverture, la fenêtre joueurs demande l'état courant (`ping`) pour afficher tout de suite la bonne battlemap.
- Fermeture : `bye` à `pagehide`, et l'écran du MJ vérifie chaque seconde `window.closed`. L'écran du MJ quitté (navigation ou onglet fermé) envoie `clear` : la fenêtre joueurs devient noire.
- Côté MJ : service `PlayerWindow` (`gm-screen/player-window.ts`), fourni par l'écran ; signal `open` (pastille « Fenêtre joueurs ouverte »).

## 10. Thèmes et styles

### 10.1 Organisation des fichiers

```
src/styles/
├── _tokens.scss          # jetons communs : espacements, rayons, ombres, tailles de texte
├── _functions.scss       # color(), space(), radius(), shadow(), font() → var(--…)
├── _theme-engine.scss    # liste des jetons obligatoires, contrôle des maps, mixin de génération
├── themes/
│   ├── _nuit-doree.scss  # map $theme-nuit-doree
│   └── _automne.scss     # map $theme-automne
├── _material.scss        # thème Angular Material branché sur les variables
└── styles.scss           # point d'entrée : génère tous les thèmes
```

### 10.2 Un thème = une map

```scss
// themes/_automne.scss
$theme-automne: (
  bg-app: #F6EEE3,
  bg-panel: #EFE3D2,
  bg-card: #FFFAF2,
  text-primary: #2E1F14,
  accent: #A84A14,
  // … tous les jetons du Brief UI/UX §2
  font-title: ('Cinzel', serif),
);
```

### 10.3 Génération des variables CSS

```scss
// _theme-engine.scss
@use 'sass:map';

$required-tokens: (bg-app, bg-panel, bg-card, text-primary, accent /* … */);

@mixin theme($name, $tokens, $default: false) {
  @each $key in $required-tokens {
    @if not map.has-key($tokens, $key) {
      @error "Thème #{$name} : jeton manquant « #{$key} »";
    }
  }
  $selector: if($default, ':root, [data-theme="#{$name}"]', '[data-theme="#{$name}"]');
  #{$selector} {
    @each $key, $value in $tokens {
      --#{$key}: #{$value};
    }
  }
}

// styles.scss
@include theme('nuit-doree', $theme-nuit-doree, $default: true);
@include theme('automne', $theme-automne);
```

### 10.4 Utilisation dans un composant

```scss
@use 'functions' as *;

.feed-text {
  background: color(bg-card);          // → var(--bg-card)
  border-radius: radius(xl);
  padding: space(6) space(6);
  font: font(narrative);
}
```

### 10.5 Changement de thème

- `Theme.setTheme('automne')` → `document.documentElement.dataset.theme = 'automne'`, mémorisation dans `UiPreferences`.
- Au démarrage, un petit script dans `index.html` lit la préférence et pose `data-theme` avant le chargement d'Angular, pour éviter un flash du thème par défaut.
- Export `.zip` (version future) : le thème courant est inclus dans le lecteur autonome.

### 10.6 Alternatives étudiées

| Approche | Principe | Avantages | Inconvénients |
|---|---|---|---|
| **Maps SCSS → variables CSS + `data-theme`** (retenue) | SCSS génère un bloc de variables CSS par thème ; changement par attribut | Changement à la volée ; un fichier par thème ; contrôle à la compilation ; compatible Angular Material | Petite couche de fonctions SCSS à maintenir |
| Variables SCSS seules | `$accent` compilé dans chaque règle | Très simple | Thème figé à la compilation : un build par thème, pas de changement à la volée |
| Une feuille CSS par thème chargée à la demande | Chaque thème compilé en bundle séparé (`inject: false`), échange du `<link>` | Seul le thème actif est chargé | Rechargement de feuille au changement (flash possible), configuration de build plus lourde |
| Angular Material seul (`mat.theme()` par classe) | Palettes M3 générées par thème | Natif pour les composants Material | Ne couvre pas nos jetons propres (types d'éléments, états, dossiers) ; palettes M3 moins précises que nos couleurs exactes |
| Jetons en JSON + générateur (Style Dictionary) | Source unique JSON → SCSS / CSS / TS | Une source pour plusieurs plateformes, utile si l'API ou un autre client arrive | Outil de build en plus, surdimensionné pour 2 thèmes |
| Tailwind CSS + variables | Classes utilitaires branchées sur des variables CSS | Productif pour les maquettes | Changement de paradigme de styles, en concurrence avec SCSS et Material |

## 11. Internationalisation

- Transloco configuré dans `core/i18n`, chargement de `public/i18n/<lang>.json` par HTTP.
- Langue `fr` par défaut et seule disponible en V1.
- Dans les templates : directive `*transloco` ou pipe `transloco` ; dans le code : `TranslocoService.translate`.
- Le contenu saisi par l'utilisateur (noms de scènes, textes…) n'est pas traduit.

---

## 12. Évolutions techniques prévues

| Évolution | Impact technique |
|---|---|
| Stockage via API (TEC-27) | Nouvelle classe `ApiRepository` implémentant `DataRepository` ; changement du fournisseur dans `app.config.ts`. Médias envoyés en `multipart/form-data`. |
| Export `.zip` autonome (PRD PRJ-04) | Build séparé du lecteur de Présentation (sans Édition), données sérialisées en JSON et médias en fichiers ; génération du zip côté navigateur (ex. JSZip). Aucune dépendance réseau dans le zip. |
| Sauvegarde / restauration (PRD PRJ-05) | Conception à faire ; réutilisera la sérialisation de l'export. |
| Plusieurs parties par projet (PRD PRS-08) | Clé de `playSessions` à passer de `projectId` à un identifiant de partie ; migration de schéma. |
| Tests de bout en bout (TEC-83) | Playwright sur les parcours clés du PRD. |

---

## 13. Décisions techniques

| # | Décision | Alternatives écartées | Raison |
|---|---|---|---|
| D1 | Angular 22, standalone, signals, zoneless | Versions antérieures, NgModules, Zone.js | Approches recommandées par le framework, code plus simple et plus performant. |
| D2 | IndexedDB via `idb` | Dexie.js, API native | Surcouche très légère basée sur les Promises, proche de l'API native. |
| D3 | Médias copiés en `Blob` dans IndexedDB | Chemins de fichiers, File System Access API, base64 | Seule solution fiable sur tous les navigateurs ciblés ; projet autonome ; base64 plus lourd. |
| D4 | Couche d'accès derrière une interface + `InjectionToken` | Accès direct à IndexedDB | Migration vers l'API sans toucher au reste de l'application. |
| D5 | `<audio>` + Web Audio | `decodeAudioData`, `<audio>` seul | Fondus précis sans charger les fichiers entiers en mémoire. |
| D6 | Transloco | `@angular/localize`, ngx-translate | Changement de langue à la volée, fichiers JSON, bien maintenu. |
| D7 | Tests unitaires Vitest uniquement en V1 | Unitaires + E2E | Effort concentré sur la logique critique (moteur, persistance, audio). |
| D8 | `BroadcastChannel` pour la fenêtre joueurs | `postMessage` via `window.opener`, `localStorage` events | API simple, même origine, supportée par Chrome, Edge et Firefox. |
| D9 | Thèmes en SCSS : maps → variables CSS + attribut `data-theme` | Variables SCSS seules, feuilles CSS par thème, Material seul, Style Dictionary, Tailwind (cf. §10.6) | Changement à la volée, un fichier par thème, contrôle des jetons à la compilation. |
