# CLAUDE.md — JDR Manager

Contexte de travail pour Claude. À lire avant tout développement dans ce dépôt.

## Le projet

**JDR Manager** aide un Maître du Jeu (MJ) à **préparer** (mode Édition) puis **animer** (mode Présentation) une partie de jeu de rôle :

- projets, arborescence de scènes, battlemaps, actions composées d'éléments ;
- bibliothèques de sons ;
- fil d'actualité ;
- fenêtre joueurs.

Application web Angular, données dans le navigateur (IndexedDB), en français, PC (Chrome, Edge, Firefox).

## Documents de référence (dossier parent `../`)

| Document                 | Contenu                                                                                                          | Quand le lire                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `avancement.md`          | Découpage en lots / sous-tâches, cases à cocher, notes                                                           | **Toujours** : il dit quoi faire et ce qui est fait |
| `TRD.md`                 | Exigences techniques (TEC-xx), architecture, modèle, contrat d'accès aux données, moteur, thèmes                 | Avant toute tâche technique                         |
| `PRD.md`                 | Exigences fonctionnelles (SCN-, ACT-, PRS-, FIL-, CTL-, NF-…)                                                    | Pour le comportement attendu                        |
| `Brief_UI_UX.md`         | Jetons de couleurs (§2), typo (§3), composants (§6), écrans (§7), accessibilité (§8), valeurs des thèmes (§11.3) | Avant toute tâche d'interface                       |
| `Plan_implementation.md` | Lots, jalons, ordre                                                                                              | Vue d'ensemble                                      |
| `specifications.md`      | Idées et règles de départ                                                                                        | Si un comportement n'est pas clair                  |

Les références entre crochets dans `avancement.md` (ex. `[TEC-35]`, `[Brief §6.13]`) renvoient à ces documents.

## Façon de travailler

1. **Suivre `avancement.md`**, une sous-tâche à la fois, dans l'ordre.
2. Après **chaque** sous-tâche :
   - cocher `- [ ]` → `- [x]` ;
   - remplir `Note :` avec `ℹ️ Info`, `⚠️ Alerte` (écart, contournement, risque) ou `❓ Question` ;
   - mettre à jour le tableau **Synthèse** : le nombre de sous-tâches terminées du lot, son état (`À faire` / `En cours` / `Terminé`) et le **Total**.
3. En fin de lot, ajouter sous le « Critère de fin » une ligne `> ✅ Lot N validé : …` : commandes passées, actions à faire par Allan (ex. `npm install`), écarts au TRD.
4. **Poser des questions** en cas de doute ou de problème plutôt que de deviner. Noter la décision d'Allan dans la note de la sous-tâche (`✅ Décision (Allan) : …`) et dans les documents concernés.
5. Tout écart au TRD / Brief se note dans `avancement.md`. Si l'écart est durable, mettre aussi à jour le document de référence.
6. Allan s'occupe lui-même de Git (pas de commit sans demande).

## Stack

- **Angular 22** (CLI 22) : standalone, **zoneless**, signals, `inject()`, control flow natif, Signal Forms. Node 22, TypeScript 6.
- **OnPush par défaut** depuis Angular 22 : ne pas le déclarer, ne jamais utiliser `ChangeDetectionStrategy.Eager` / `Default` (règle ESLint).
- **Services** : décorateur `@Service()` d'Angular 22. Nom **sans suffixe** `Service`, comme le génère la CLI : `Theme`, `UiPreferences`, `MediaUrls`, `Modals`, `Selections`, `Notifications` (TEC-19). Si le nom court masque un objet global du navigateur, prendre un nom plus précis (`AudioPlayer`, pas `Audio`).
- **Composants** : nommés aussi sans suffixe (`Tree`, `Modal`, `ProjectsPage`).
- Angular Material 22 (M3, branché sur nos jetons) + **CDK** : Dialog, Menu, Drag & Drop, Overlay.
- **Icônes** : `@lucide/angular`, une directive par icône (`<svg lucidePencil aria-hidden="true">`). Ne pas utiliser `lucide-angular`, incompatible avec Angular 22.
- **i18n** : Transloco (`@jsverse/transloco`), `public/i18n/fr.json`.
- **Données** : IndexedDB via `idb`.
- **Polices** : `@fontsource` (Cinzel titres, Inter interface, Lora narration), auto-hébergées.
- **Tests** : Vitest + jsdom (`ng test`), `fake-indexeddb`.

## Commandes

```bash
npm install                 # après tout changement de package.json
ng serve                    # http://localhost:4200 (ou npx ng serve)
ng build
ng test --watch=false       # tests unitaires
npm run test:coverage
ng lint                     # ESLint (TS + templates)
npm run lint:styles         # Stylelint (SCSS)
npm run check:themes        # jetons de thème complets + chaque thème branché (styles.scss, THEMES, fr.json)
npm run check:i18n          # aucun texte en dur (templates, aria-label/title/placeholder/alt, chaînes du TS) ; clés présentes dans fr.json
npm run format              # Prettier ; format:check pour vérifier
```

**Avant de cocher une sous-tâche**, ces commandes doivent passer : `ng build`, `ng test --watch=false`, `ng lint`, `npm run lint:styles`, `npm run format:check`, `npm run check:themes` et `npm run check:i18n`.

Pages de démonstration temporaires (à supprimer avant la V1) :

- `/dev/themes` : thèmes ;
- `/dev/components` : tous les composants partagés avec des données de test. Y ajouter chaque nouveau composant partagé.

## Règles impératives

### Angular CLI d'abord (TEC-18)

Générer avec la CLI : `ng g c`, `ng g s`, `ng g directive`, `ng g interface`, `ng add`. On n'écrit à la main que ce que la CLI ne sait pas générer. Pièges de nommage :

- `ng g c shared/ui/pill` crée `shared/ui/pill/pill.ts` (bon) ; `ng g c shared/ui/pill/pill` crée un dossier de trop.
- `ng g directive shared/ui/button/button` crée `shared/ui/button/button.ts` (une directive ne crée pas de dossier).
- `ng g c … --type=page` donne `*.page.ts` : ne pas l'utiliser. Le projet nomme les écrans `xxx-page` (`projects-page.ts`, classe `ProjectsPage`).

### Styles : SCSS + jetons uniquement

- Aucune valeur en dur : couleurs, espacements, rayons, tailles de texte, ombres. Stylelint l'interdit hors des fichiers de jetons et de thèmes.
- Dans un composant : `@use 'functions' as *;` puis `color(accent)`, `space(16)`, `radius(md)`, `font-size(body)`, `font-weight(semibold)`, `font-family(title)`, `line-height(input)`, `control-height(lg)`, `layout(sidebar-left)`, `shadow(popover)`, `duration(fast)`, `easing(out)`, `transition(prop…)`. Chaque fonction renvoie un `var(--…)` ; une clé inconnue fait échouer la compilation.
- Fichiers :
  - `src/styles/_tokens.scss` : jetons communs. Clés d'espacement = valeur en px. Rayons `sm md lg xl xxl xxxl pill` : pas de `2xl`, que Stylelint prend pour une unité.
  - `_functions.scss`, `_theme-engine.scss` ;
  - `themes/_nuit-doree.scss` (défaut, sombre) et `themes/_automne.scss` (clair) ;
  - `components/_*.scss` : styles globaux des directives (bouton, formulaire, overlay CDK, menu).
- Ajouter un jeton de couleur :
  1. le déclarer dans `$required-tokens` (`_theme-engine.scss`) ;
  2. lui donner une valeur dans **chaque** thème ;
  3. le documenter dans le Brief §2 / §11.3.
- Ajouter un thème :
  1. créer le fichier `themes/_<id>.scss` ;
  2. faire le `@include engine.theme(...)` dans `styles.scss` ;
  3. l'ajouter au type `ThemeId` et à `THEMES` dans `core/theme/theme.ts` ;
  4. traduire son nom (`settings.themes.<clé>` dans `fr.json`) ;
  5. `npm run check:themes` dit ce qui manque. Les écrans (Paramètres › Apparence) n'ont rien à changer.
- `data-theme="<id>"` sur **n'importe quel élément** redéfinit les variables du thème pour son sous-arbre (c'est ainsi que fonctionne `ThemePreview`).
- Penser à vérifier le rendu dans les **deux thèmes**.

### Couche de données (TEC-21 à TEC-26)

- Tout passe par `inject(DATA_REPOSITORY)` (contrat `core/data/data-repository.ts`). Implémentation : `IndexedDbRepository`, fournie dans `app.config.ts` avec `useExisting`.
- **Seuls `src/app/core/data/**` et `src/testing/**` peuvent importer `idb` ou utiliser `indexedDB`.** Règle ESLint TEC-23.
- Toutes les méthodes sont `async`. Les erreurs métier sont des `DataError` (`code` + `messageKey` `error.data.<code>`) ; à l'écran : `inject(Notifications).fromError(e)`.
- Schéma versionné (`core/data/jdr-db.ts`) : toute modification incrémente `DB_VERSION` et ajoute un bloc `if (oldVersion < N)` dans `upgrade`.
- Suppressions en cascade dans **une seule transaction** (helpers de `jdr-db-cascade.ts`) ; un média n'est supprimé que s'il n'est plus utilisé.
- Les références vers des objets supprimés dans les **éléments d'action** (battlemap, son, scène cible de « Changer de scène ») ne sont **pas** modifiées : elles sont **signalées à l'écran** (PRS-07, décision d'Allan). `Project.firstSceneId`, `Scene.nextSceneIds` et `Scene.defaultBattlemapId` sont, eux, nettoyés.
- Médias :
  - jamais de `Blob` dans un composant. Passer par `MediaUrls` : `track(() => id)` renvoie `url` / `missing` et libère automatiquement ;
  - formats acceptés : `resolveMediaType()` / `FORMAT_LABELS` dans `core/media/media-types.ts`.
- Préférences d'affichage (hors données de projet) : `UiPreferences` (localStorage, clés préfixées `jdr-manager:`).

### Modèle

`core/models/` : un fichier par interface. Import groupé : `import { Project, Scene } from '../models';` (chemin relatif). Identifiants : `newId()` (UUID).

### Internationalisation

- Aucun texte d'interface en dur : clés dans `public/i18n/fr.json`, rangées par domaine (`common`, `project`, `scene`, `action`, `presentation`, `sound`, `error`, `settings`, `tree`, `selection`, `fileDrop`…).
- Templates : `*transloco="let t"` ou pipe `transloco` ; code : `TranslocoService.translate`.
- Les composants partagés reçoivent des **clés** (ex. `labels` de l'arborescence) ou des textes **déjà traduits** : c'est précisé dans leur JSDoc.
- Exception : les pages `features/dev/*` (démonstration) ont des textes en dur.

### Accessibilité (Brief §8)

- Vrais `<button>` / `<a>` / `<input>`, `aria-label` sur les boutons icône, focus visible, navigation clavier complète, `prefers-reduced-motion` respecté.
- Le lint des templates (`templateAccessibility`) est actif.

## Composants partagés disponibles (lot 3)

| Élément                                | Emplacement                                      | Usage                                                                                                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appButton`                            | `shared/ui/button`                               | `<button appButton="primary                                                                                                                                                                                                       | secondary                                             | filled | quiet | add | danger | danger-strong | icon" size="sm | md  | header | lg  | touch">` |
| `app-pill`                             | `shared/ui/pill`                                 | Pastille ; `tone` = type d'élément (`ELEMENT_TONES`), `neutral`, `accent` ou `active` (« en cours »), `removable`, `variant="badge"`                                                                                              |
| `appInput`, `app-field`                | `shared/ui/input`, `shared/ui/field`             | Champ + libellé (`#f` puis `[id]="f.controlId"`), `required`, `hint`, `error`, `hiddenLabel` ; `.app-check` pour case / radio                                                                                                     |
| `app-segmented-control`                | `shared/ui/segmented-control`                    | Groupe radio, modèle `value` (compatible Signal Forms)                                                                                                                                                                            |
| `app-collapsible-section`              | `shared/ui/collapsible-section`                  | `title`, `summary`, `preferenceKey` (état mémorisé), emplacement `sectionAction`                                                                                                                                                  |
| `Modals` + `app-modal`                 | `shared/ui/modal`                                | `modals.open(Cmp, { data, size })`, `size` : `sm`, `md`, `lg` ou `xl` ; mise en page `<app-modal title subtitle>` avec `modalFooterStart` / `modalFooterEnd` ; focus initial : `cdkFocusInitial`                                  |
| `Modals.confirm()`                     | `shared/ui/confirm-dialog`                       | `await confirm({ title, message, confirmLabel, destructive })` → `boolean`                                                                                                                                                        |
| `app-alert`, `Notifications`           | `shared/ui/alert`, `shared/ui/notification-host` | Message dans la page ; notifications `error()`, `info()`, `fromError()` (zone dans `app.html`)                                                                                                                                    |
| `appMenu`, `appMenuItem`               | `shared/ui/menu`                                 | Sur CDK Menu ; `[cdkMenuTriggerFor]`, `(triggered)`, `tone="danger"`, `selected`                                                                                                                                                  |
| `appCapitalize`                        | `shared/ui/capitalize`                           | Sur un `<input>` de nom (projet, dossier, scène, son, action, battlemap) : première lettre en majuscule pendant la saisie, avant les autres gestionnaires `input` (compatible `[formField]`). Fonction pure : `capitalizeFirst()` |
| `app-placeholder`                      | `shared/ui/placeholder`                          | Visuel quadrillé (`variant="alt"`, `grid="fine"`)                                                                                                                                                                                 |
| `app-tree`                             | `shared/tree`                                    | Arborescence générique, détaillée ci-dessous                                                                                                                                                                                      |
| `Selections`                           | `shared/selection-dialog`                        | `await select({ title, nodes, mode: 'single'                                                                                                                                                                                      | 'multiple', checkedIds, disabledIds, labels })`→`Id[] | null`  |
| `appFileDrop`, `app-file-drop-overlay` | `shared/file-drop`                               | Dépôt de fichiers depuis le disque. Directive : `#drop="appFileDrop"`, `[appFileDropKinds]`, `(filesDropped)`. Calque : `@if (drop.active()) { <app-file-drop-overlay [fileCount] [kinds] destination> }`                         |
| `appMarkdownEditor`, pipe `markdown` | `shared/markdown` | Texte Markdown. `<textarea appInput appMarkdownEditor>` dans un `app-field` : barre d'outils automatique, masquée hors focus et flottant au-dessus du champ (gras, italique, titre, listes, citation ; Ctrl + B / I) ; texte du champ transparent, `app-field` dessine par-dessus le rendu mis en page (hors focus) ou le source coloré (`highlightMarkdown`, au focus : ne jamais y changer la largeur des caractères), chaque mise en forme émet un `input` natif (compatible `(input)` et `[formField]`). Rendu : `<div class="app-markdown" [innerHTML]="text \| markdown">` (`marked`, assaini par Angular ; jamais `bypassSecurityTrust…`). Fonctions pures : `applyMarkdownFormat()`, `renderMarkdown()` |

**Arborescence `app-tree`.** Elle ne sauvegarde rien : l'écran reçoit les événements et enregistre.

- Entrées :
  - `nodes` (liste plate) ;
  - `[(selectedId)]`, `[(collapsedIds)]`, `[(checkedIds)]` ;
  - `editable`, `selectionMode`, `disabledIds` ;
  - `labels` (clés), `extraMenuItems` (`{ label, appliesTo, run, hidden? }`), `ariaLabel` ;
  - modèle d'élément `<ng-template #item let-node let-row="row">`.
- Sorties : `create` (puis appeler `tree.startRename(id)`), `rename`, `remove` (déjà confirmée), `move`.
- Pour un `move` : `applyMove(nodes, move)` dans `tree-model.ts` renvoie les nœuds à enregistrer (`saveSceneNodes` / `saveSoundNodes`).
- `tree-model.ts` fournit aussi `pathTo()` (chemin « A › B › C »), `descendantIds()` et `filterNodes()`.

## Écrans et services de fonctionnalité (lot 4)

- Les écrans reçoivent les paramètres de route comme inputs (`withComponentInputBinding`) : `readonly projectId = input.required<Id>()`.
- **État d'un écran** : service `@Injectable()` **sans** `providedIn`, fourni dans `providers` du composant, une instance par écran. C'est une exception voulue à `@Service()`, qui est global. Exemples :
  - `EditorStore` (`features/editor`) : projet, arborescence, scène ouverte, texte de scène, enregistrement automatique ;
  - `PresentationEngine` et `ActionRunner` (`features/presentation/engine`).
- **Enregistrement automatique** : `DebouncedTask` (`shared/util`), 500 ms, plus `flush()` à la sortie du champ, au changement de scène, à la destruction de l'écran et sur `beforeunload`. Un champ édité ne se lie **pas** à la valeur enregistrée, mais à une valeur initiale posée à l'ouverture (`initialSceneText`) : un enregistrement en retard ne doit jamais écraser la saisie.
- **Écritures concurrentes** : les enchaîner (`this.writes = this.writes.then(...)`), sinon deux frappes rapides peuvent créer deux objets.
- **Moteur** : voir « Moteur de présentation (lot 9) ».
- Dates : `provideFrenchLocale()` (`core/i18n/locale.ts`), à ajouter aussi dans les tests qui affichent des dates.

## Accueil et paramètres (lot 5)

- Accueil : `ProjectsPage` charge un `ProjectSummary` par projet (`loadProjectSummary()`, `features/projects/project-summary.ts`) et affiche des `ProjectCard`. La carte n'écrit rien : son menu « ⋯ » émet `rename` / `remove`, la page ouvre la fenêtre, confirme, enregistre et recharge (`projects.reload()`).
- La fenêtre `CreateProjectDialog` sert aussi au renommage : `modals.open(CreateProjectDialog, { data: { name } })`.
- Pluriels : `pluralKey('project.stats.scenes', n)` choisit `.one` / `.other` (règle française : 0 et 1 au singulier).
- Paramètres : route `/settings` (`features/settings/settings-page`), ouverte par l'icône réglages de l'accueil. Thèmes présentés par `ThemePreview` (`data-theme` sur l'hôte) dans un groupe radio (clic ou flèches → `Theme.setTheme`).
- Le contenu des paramètres (Apparence, Stockage) est dans `SettingsContent`, partagé par la page et par la fenêtre `SettingsDialog`.
- Depuis les modes Édition et Présentation, les paramètres s'ouvrent dans une **fenêtre** pour ne pas quitter l'écran (scène ouverte, sons, fenêtre joueurs). On utilise `<app-settings-button headerEnd />` (`features/settings/settings-button`) dans l'en-tête ; il est déjà dans l'éditeur, la Présentation et la bibliothèque de sons (décision d'Allan).

## Fenêtre joueurs (lot 11)

- Contrat des messages : `PlayerMessage` (`features/presentation/player-screen/player-channel.ts`), canal `jdr-manager:<projectId>` via `PLAYER_CHANNEL_FACTORY`. MJ → joueurs : `show-battlemap` (`sceneId`, `battlemapId`), `clear`, `theme`, `hello` ; joueurs → MJ : `ping` (demande l'état), `bye`.
- Côté MJ : `PlayerWindow` (`gm-screen/player-window.ts`, fourni par l'écran) : `connect(projectId)` après `load()`, `openWindow()` **dans un gestionnaire de clic** (rappel `onLaunch` de `LaunchDialog`), signal `open` ; envoie la battlemap et le thème par `effect`, `clear` à la sortie (`DestroyRef` et `pagehide`).
- Côté joueurs : `PlayerScreenPage` résout l'image elle-même (`listBattlemaps(sceneId)` + `MediaUrls`), fond `color(player-bg)` noir dans tous les thèmes, double-clic = plein écran.
- Tests : `useFakePlayerChannel()` (`src/testing/fake-player-channel.ts`, inclus dans `usePresentation()`) : `bus.open(projectId)` donne un canal « de l'autre fenêtre », `bus.received(canal)` ses messages ; les messages arrivent en microtâche (attendre un `setTimeout`). Le thème peut déjà valoir `automne` (localStorage partagé entre tests) : choisir « l'autre » thème dans un test.

## Écran de Présentation (lot 10)

- `GmScreenPage` (`features/presentation/gm-screen`) : `load()` puis `LaunchDialog` (fenêtre `md`, Continuer / Recommencer avec confirmation destructive / Commencer, choix d'affichage `DisplayMode`) ; le clic de lancement appelle `AudioPlayer.unlock()` **dans le gestionnaire du clic** (TEC-43). Fermée sans choix → retour aux projets.
- Composants, tous branchés sur le `PresentationEngine` de l'écran (injection) : `Feed` (fil, défilement vers `engine.focus`, estompage, « N éléments précédents », « Revenir au dernier élément » ; en bas, une `FeedWait` par attente en cours de `engine.waits()`, compte à rebours non enregistré, retiré à la fin), `FeedBattlemap` (miniature ou erreur, ouvre `BattlemapViewer` en taille `xl`), `NextSceneButton`, `BattlemapSection`, `ActionsSection`, `SoundsSection` + `SoundCard`.
- `sound-choice.ts` est dans `shared/selection-dialog` (éditeur d'action et Présentation).
- Tests : `usePresentation()` / `seedPresentation()` / `startPresentation()` (`src/testing/presentation-harness.ts`) : vrai moteur et dépôt, Web Audio simulé, projet « La crypte » (scènes A, B, C ; battlemaps b1, b2 ; sons « Taverne » et « Pluie »). Le faux `MediaUrls` de `useFakeAudio()` gère aussi `track()`.
- jsdom ne calcule pas les positions : le défilement du fil se vérifie dans Chromium.

## Moteur de présentation (lot 9)

- Fichiers : `features/presentation/engine` (`ActionRunner`, `PresentationEngine`, `PlaySessionStore`) et `features/presentation/audio` (`AudioPlayer`). L'écran fournit `PresentationEngine`, `ActionRunner` et `PlaySessionStore` dans ses `providers` ; `AudioPlayer` est global (`@Service()`, un seul `AudioContext`).
- `ActionRunner.run(action, context, signal)` → `RunOutcome` (`done` / `change-scene`). Le moteur fournit l'`ActionContext` de la scène : chaque méthode applique l'événement **et l'enregistre** (TEC-52). Avant chaque élément affiché (texte, battlemap, clic) : `context.beforeDisplay(signal)`, pause de `DISPLAY_GAP_MS` (1 s, toutes actions de la scène confondues ; `{ provide: DISPLAY_GAP_MS, useValue: 0 }` dans les tests, déjà dans `usePresentation()`). Attente : `context.wait(element, signal)`, que le moteur implémente avec `delay(ms, signal)` (`shared/util/delay.ts`) en publiant l'attente dans `waits` (rien d'enregistré).
- `PresentationEngine` : `load(projectId)` s'arrête au statut `choose` (`savedSession` = partie à continuer ou `null`), puis l'écran appelle `continueSession()` / `restart()` ; `start(projectId)` (tests) enchaîne sans question. Commandes : `openScene`, `runAction`, `continueClick`, `showBattlemap`, `playLibrarySound`, `pauseSound` / `resumeSound`, `setVolume`, `togglePlayback`, `stop`. Signals : `feed` (sans les textes d'actions supprimées), `focus` (premier élément montré d'une salve : `startBurst()` à l'ouverture de scène, au lancement manuel, après « Continuer » et après une attente ; les suivants ne le déplacent pas), `shownBattlemap` (`battlemap: null` = supprimée), `manualActions`, `nextScenes`, `sounds`, `anyPlaying`…
- Démarrer le moteur depuis un `effect` : **dans `untracked()`**, sinon l'effet suit les signals lus par le moteur et le relance à chaque enregistrement.
- `PlaySessionStore` : `updateScene(sceneId, fn)` / `setCurrentScene` enregistrent tout de suite (écritures enchaînées, erreur → notification).
- Ressource supprimée (son, scène cible) : notification `presentation.errors.*`, la partie continue (NF-25).
- Tests : `useFakeAudio()` (`src/testing/fake-audio.ts`) fournit un faux `AudioContext` (rampes journalisées), un faux `MediaUrls` (médias `absent*` introuvables) et espionne `play` / `pause` ; à mettre dans tout test qui démarre le moteur. Lire les espions **au moment du test** (`vi.mocked(HTMLMediaElement.prototype.play)` dans une fonction), pas au chargement du fichier.
- Prototype Web Audio autonome : `../prototypes/prototype-web-audio.html`.

## Éditeur d'action (lot 8)

- `ActionEditor` (`features/editor/action-editor`) : fenêtre `Modals.open(ActionEditor, { size: 'lg', closable: false, data })`, ouverte depuis `ActionsPanel.edit()`. Elle travaille sur une **copie** (`draft`) et **renvoie** `{ kind: 'save', draft }` ou `{ kind: 'delete' }` ; c'est le panneau qui enregistre (`EditorStore.saveAction` / `deleteAction`).
- Signal Forms (TEC-06) : `form(draft, schema)`, `[formField]="form.name"` ; validation dans le schéma (`validate`, `maxLength`, `disabled`) ; **pas d'attribut `maxlength`** sur un champ `[formField]` (NG8022) ; messages = clés de traduction ; poser `aria-invalid` soi-même ; erreurs après `markAsTouched()`.
- Éléments : `ElementCard` (carte dépliable, poignée `cdkDragHandle`, formulaire projeté), `element-types.ts` (`ELEMENT_TYPE_INFOS` : libellé, icône Lucide pour `[lucideIcon]`, couleur ; `newElement(type)`), `describeElement` (résumé replié).
- Formulaires d'éléments : `ElementForm` (`features/editor/element-form`), un `@switch` par type ; entrée `element`, sortie `elementChange` (élément complet). Champs saisis dans un `linkedSignal` (`toFields`) + `form()` ; un `effect` reporte les champs dans l'élément (`applyFields` : volume % → 0–1, secondes → ms ; une valeur invalide n'est **pas** reportée). Cibles choisies hors formulaire : miniatures radio (battlemap), `Selections.select({ mode: 'single' })` (son : `soundChoiceNodes` / `soundPath` de `sound-choice.ts`, deux racines « Ce projet » / « Bibliothèque globale » ; scène : `disabledIds: [sceneId]`). Cible supprimée : bouton `.choice--missing` (PRS-07).
- Validation globale (8.4.1) : `elementProblem(element)` (`features/editor/element-validation.ts`) + `ElementForm.invalid()` ; à « Enregistrer », `revealErrors()` sur chaque formulaire (`viewChildren`), cartes à corriger dépliées (`ElementCard` `[invalid]`), focus sur la première erreur. Une cible **supprimée** ne bloque pas (PRS-07). Renvoyer une copie `structuredClone` du brouillon : Signal Forms pose une clé `Symbol` sur les objets des listes.
- Fenêtre ouverte depuis une autre : seul le premier fond est opaque (`_overlay.scss`) ; la première fenêtre reste visible.

## Éditeur de scène (lot 7)

- `EditorStore` porte tout l'état de l'éditeur : `sceneNodes` (création `createNode`, `renameNode`, `removeNode`, `moveNode`, `duplicateScene`, `setFirstScene`), scène ouverte (`scene`, `actions` triées par `sortActions`, `battlemaps`, `soundNames`), textes (`sceneText`, `actionTexts`, `editSceneText` / `editActionText` avec une seule temporisation et `flush()`), actions (`reorderAction`), battlemaps (`importBattlemaps`, `setDefaultBattlemap`, `renameBattlemap`, `deleteBattlemap`, `battlemapUsage`), enchaînement (`setNextScenes`).
- Volet droit : un composant par partie (`ActionsPanel`, `BattlemapsPanel`, `SequencePanel`) qui injecte l'`EditorStore` de l'écran et contient sa propre `app-collapsible-section` (avec `preferenceKey` `editor.*`).
- Résumé d'une action et cibles supprimées : `summarizeElement` / `hasMissingTarget` (`features/editor/action-summary.ts`). Toute cible supprimée (son, battlemap, scène) est **signalée** en rouge (PRS-07) ; toute suppression d'un objet utilisé par des actions **avertit**.
- Champs à enregistrement automatique : lier `[value]` à une valeur **figée à l'ouverture** (`initialSceneText`, `initialTexts`), jamais à la valeur enregistrée.
- Budget du bundle initial : 600 ko (les icônes Lucide utilisées partout sont regroupées dans le bundle principal).

## Bibliothèques de sons (lot 6)

- Écran `SoundLibraryPage` sur `/projects/:projectId/sounds` (projet + globale) et `/sounds` (globale seule). Navigation Scènes / Sons : `app-project-nav` (`shared/project-nav`) dans l'en-tête.
- État : `SoundLibraryStore` (`features/sound-library`), même modèle que `EditorStore`. Les arborescences ne montrent que les dossiers (`store.trees()`), le dossier ouvert est `store.opened()` (`folderId: null` = racine). `store.rows()` = sons du dossier ouvert, ou résultats de `store.query()`.
- Import : `store.importFiles(files)` (bouton et `appFileDrop`) lit la durée avec `AudioDuration` (`core/media`) puis `uploadMedia(file, { durationMs })` ; une erreur de quota est renvoyée dans `failure`, pas levée.
- Pré-écoute : `SoundPreview` (fourni par l'écran, un seul `<audio>`, URL via `MediaUrls`) et `app-listen-button`. Le lecteur de Présentation (Web Audio) est un autre service, lot 9.
- Dépôt : `countSoundUsages()` (« Utilisé dans », avertissement à la suppression), `getMediaInfo(ids)` (infos d'un média sans le `Blob`).
- `app-tree` : `[canCreateItems]="false"` masque « Nouvel élément » ; `folderTone="global"` colore les dossiers de la bibliothèque globale ; `[deleteMessage]` (fonction stable `node => message | null`) remplace le message de confirmation de suppression (ex. dossier contenant des sons utilisés).
- Règle d'Allan : **toute suppression d'un son utilisé par des actions doit avertir** (son seul ou dossier). Idem pour une scène (ou un dossier de scènes) visée par un « Changer de scène » : `listSceneLinks(projectId)` + `EditorStore.sceneTargetCount()`.
- Utilitaires : `formatDuration(ms)` (`shared/util/duration.ts`), `formatLabel(mimeType)` (`core/media/media-types.ts`).
- `resource()` : `hasValue()` est `false` quand le chargeur renvoie `undefined` ; tester « introuvable » avec `status() === 'resolved' && !value()`.
- **Budget de styles** : 4 ko par composant (avertissement de `ng build`, à surveiller : `grep WARN`). Au-delà, sortir un sous-composant (ex. `ListenButton`).
- Tests audio : jsdom ne lit pas l'audio. Fournir un faux `AudioDuration`, et espionner `HTMLMediaElement.prototype.play` / `pause`.
- Vérification dans Chromium : un script peut remplir IndexedDB (`jdr-manager`) une fois l'accueil chargé (la base doit d'abord être créée par l'application) ; `Storage.overrideQuotaForOrigin` (CDP) simule un petit quota. `navigator.storage.estimate()` sous-estime les `Blob`.

## Robustesse, performance, accessibilité (lot 13)

- Paramètres › Stockage : `StorageUsage` (`features/settings/storage-usage`), dépôt `getStorageUsage()`, `StoragePersistence.estimate()`, `formatFileSize()` (`shared/util/file-size.ts`).
- Images de miniatures : `loading="lazy" decoding="async"`.
- `app-modal` : en-tête et pied sont des `<div class="modal__header">` / `<div class="modal__footer">` (pas de repères `<header>` / `<footer>` en double) ; dans les tests, chercher `.modal__footer button`. `Modals.isOpen()` dit si une fenêtre est ouverte.
- Raccourcis de la Présentation : liste `PRESENTATION_SHORTCUTS` (`gm-screen/shortcuts-dialog/shortcuts.ts`, affichée par `ShortcutsDialog`), traitement dans `GmScreenPage.onShortcut` (ignorés pendant une saisie, avec Ctrl / Alt / Cmd ou si une fenêtre est ouverte) ; poser `aria-keyshortcuts` sur le bouton concerné. Un nouveau raccourci = une entrée de la liste + une branche dans `onShortcut`.
- Mesures (Chromium) : changement de scène < 20 ms, action < 15 ms, trois ambiances de 20 min sans coupure, URL de médias libérées (pas de fuite).

## Arborescence du code

```
src/app/
  core/
    data/           contrat DataRepository, IndexedDbRepository, schéma idb, cascades, DataError, StoragePersistence
    media/          types de médias acceptés, MediaUrls
    models/         interfaces du modèle (TRD §3)
    preferences/    UiPreferences
    theme/          Theme
    i18n/           chargeur Transloco
  shared/
    ui/             composants d'interface de base
    tree/           arborescence générique
    selection-dialog/
    file-drop/
  features/
    projects/  settings/  sound-library/  editor/  presentation/{gm-screen,player-screen,engine,audio}
    dev/            pages de démonstration temporaires
  app.config.ts  app.routes.ts (routes paresseuses)  app.html
src/styles/         jetons, fonctions, moteur de thèmes, thèmes, styles globaux des directives
src/testing/        utilitaires de test (exclus de tsconfig.app.json)
scripts/            check-themes.mjs, check-i18n.mjs
public/i18n/fr.json
```

## Tests : bonnes pratiques et pièges connus

- Un `*.spec.ts` à côté de chaque fichier ; une description par comportement, en français.
- Composant qui utilise Transloco : `imports: [getTranslocoTestingModule()]` (`src/testing/transloco-testing.ts`, traductions françaises réelles).
- Données de test : fabriques `aProject()`, `aScene()`, `aMedia()`… dans `src/testing/data-builders.ts`.
- **Tests d'écrans** : `providers: [...useTestRepository()]` (`src/testing/test-repository.ts`) donne un vrai dépôt IndexedDB sur une base neuve, et `TestBed.inject(DATA_REPOSITORY)` permet de préparer les données. Input de route : `fixture.componentRef.setInput('projectId', id)`. Chargement asynchrone : `await vi.waitFor(...)`.
- IndexedDB :
  - `import 'fake-indexeddb/auto'` ;
  - une base neuve par test via le jeton `INDEXED_DB_NAME` ;
  - `repository.close()` et `deleteDB()` en fin de test.
- **Blob / File** : fake-indexeddb ne sait pas copier ceux de jsdom. Appeler `useNodeBlob()` (`src/testing/node-blob.ts`) dans le bloc de tests.
- **URL d'objets** : `stubObjectUrls()` (`src/testing/object-url.ts`) simule `URL.createObjectURL` / `revokeObjectURL`.
- jsdom n'a pas `document.elementFromPoint` ni de vrai glisser-déposer : tester la logique pure (ex. `computeMove`). Pour le composant, appeler directement les gestionnaires avec un pointeur simulé (voir `tree.spec.ts`).
- Zoneless :
  - `await fixture.whenStable()` après une action ;
  - `TestBed.tick()` pour les fenêtres CDK ;
  - avec `vi.useFakeTimers()`, utiliser `fixture.detectChanges()`, car `whenStable()` ne se termine pas.
- Dans les templates de test, attention aux **noms de variables de modèle** (`#xxx`) qui masquent une propriété du composant du même nom.
- Focus clavier : `TestBed.createComponent` n'attache pas l'élément au document ; faire `document.body.appendChild(fixture.nativeElement)` avant de tester `focus()` / `document.activeElement`.
- Les notifications s'affichent dans `app.html`, absent d'un test d'écran : vérifier `TestBed.inject(Notifications).notifications()`.
- Menus CDK dans un test : cliquer le déclencheur, `TestBed.tick()`, puis chercher les options dans `document` (`.app-menu button`), pas dans le composant.

## Pièges et décisions déjà rencontrés

- **Classes CSS d'un écran et éléments enfants** : un sélecteur d'un composant (ex. `.play`) s'applique aussi à l'élément hôte d'un composant enfant qui porte la même classe. Nommer les classes de façon spécifique (`.stage`, `.app-header--play`).
- **Projection dans un emplacement** (`headerEnd`…) : un `@if` qui contient plusieurs nœuds empêche la projection dans l'emplacement nommé (erreur NG8011). Mettre l'élément projeté dans son propre `@if`.

- `ng add @jsverse/transloco` échoue sur l'option `--ssr` : utiliser `ng g @jsverse/transloco:ng-add --langs=fr --ssr=false`.
- Directive : un alias d'entrée doit être `préfixeDuSélecteur + NomDeLaPropriété` (`appFileDropKinds` pour `kinds`), sinon ESLint refuse (`no-input-rename`).
- `navigator.storage.persist()` est demandé au démarrage. Firefox affiche alors une demande d'autorisation : on pourra la déplacer au premier import si c'est gênant.
- Le Brief et les maquettes : artifact de maquettes Claude (lien dans les échanges) ; les retours d'Allan y sont intégrés au Brief.
- Tablette Android en V1, hors ligne et lancée depuis un fichier HTML (lot 12 bis, conception 12b.1 à valider). Le build actuel **ne démarre pas en `file://`** (modules JS bloqués, traductions chargées par requête).
