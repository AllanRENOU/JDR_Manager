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
npm run format              # Prettier ; format:check pour vérifier
```

**Avant de cocher une sous-tâche**, ces commandes doivent passer : `ng build`, `ng test --watch=false`, `ng lint`, `npm run lint:styles` et `npm run format:check`.

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

| Élément                                | Emplacement                                      | Usage                                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appButton`                            | `shared/ui/button`                               | `<button appButton="primary                                                                                                                                                                               | secondary                                             | filled                                                                                                                      | quiet | add | danger | danger-strong | icon" size="sm | md  | header | lg  | touch">` |
| `app-pill`                             | `shared/ui/pill`                                 | Pastille ; `tone` = type d'élément (`ELEMENT_TONES`), `neutral`, `accent` ou `active` (« en cours »), `removable`, `variant="badge"`                                                                      |
| `appInput`, `app-field`                | `shared/ui/input`, `shared/ui/field`             | Champ + libellé (`#f` puis `[id]="f.controlId"`), `required`, `hint`, `error`, `hiddenLabel` ; `.app-check` pour case / radio                                                                             |
| `app-segmented-control`                | `shared/ui/segmented-control`                    | Groupe radio, modèle `value` (compatible Signal Forms)                                                                                                                                                    |
| `app-collapsible-section`              | `shared/ui/collapsible-section`                  | `title`, `summary`, `preferenceKey` (état mémorisé), emplacement `sectionAction`                                                                                                                          |
| `Modals` + `app-modal`                 | `shared/ui/modal`                                | `modals.open(Cmp, { data, size: 'sm'                                                                                                                                                                      | 'md'                                                  | 'lg' })`; mise en page`<app-modal title subtitle>`avec`modalFooterStart`/`modalFooterEnd`; focus initial :`cdkFocusInitial` |
| `Modals.confirm()`                     | `shared/ui/confirm-dialog`                       | `await confirm({ title, message, confirmLabel, destructive })` → `boolean`                                                                                                                                |
| `app-alert`, `Notifications`           | `shared/ui/alert`, `shared/ui/notification-host` | Message dans la page ; notifications `error()`, `info()`, `fromError()` (zone dans `app.html`)                                                                                                            |
| `appMenu`, `appMenuItem`               | `shared/ui/menu`                                 | Sur CDK Menu ; `[cdkMenuTriggerFor]`, `(triggered)`, `tone="danger"`, `selected`                                                                                                                          |
| `app-placeholder`                      | `shared/ui/placeholder`                          | Visuel quadrillé (`variant="alt"`, `grid="fine"`)                                                                                                                                                         |
| `app-tree`                             | `shared/tree`                                    | Arborescence générique, détaillée ci-dessous                                                                                                                                                              |
| `Selections`                           | `shared/selection-dialog`                        | `await select({ title, nodes, mode: 'single'                                                                                                                                                              | 'multiple', checkedIds, disabledIds, labels })`→`Id[] | null`                                                                                                                       |
| `appFileDrop`, `app-file-drop-overlay` | `shared/file-drop`                               | Dépôt de fichiers depuis le disque. Directive : `#drop="appFileDrop"`, `[appFileDropKinds]`, `(filesDropped)`. Calque : `@if (drop.active()) { <app-file-drop-overlay [fileCount] [kinds] destination> }` |

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
- **Moteur** : `ActionRunner.run(action, context, signal)`. Le moteur fournit un `ActionContext` (aujourd'hui `addText`) et un `AbortController` par scène ; `PresentationEngine.textOf(item)` relit le texte dans l'action (`null` = supprimé).
- Dates : `provideFrenchLocale()` (`core/i18n/locale.ts`), à ajouter aussi dans les tests qui affichent des dates.

## Accueil et paramètres (lot 5)

- Accueil : `ProjectsPage` charge un `ProjectSummary` par projet (`loadProjectSummary()`, `features/projects/project-summary.ts`) et affiche des `ProjectCard`. La carte n'écrit rien : son menu « ⋯ » émet `rename` / `remove`, la page ouvre la fenêtre, confirme, enregistre et recharge (`projects.reload()`).
- La fenêtre `CreateProjectDialog` sert aussi au renommage : `modals.open(CreateProjectDialog, { data: { name } })`.
- Pluriels : `pluralKey('project.stats.scenes', n)` choisit `.one` / `.other` (règle française : 0 et 1 au singulier).
- Paramètres : route `/settings` (`features/settings/settings-page`), ouverte par l'icône réglages de l'accueil. Thèmes présentés par `ThemePreview` (`data-theme` sur l'hôte) dans un groupe radio (clic ou flèches → `Theme.setTheme`).

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
scripts/            check-themes.mjs
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
- Question encore ouverte (voir « Points ouverts » d'`avancement.md`) : Présentation sur tablette en V1.
