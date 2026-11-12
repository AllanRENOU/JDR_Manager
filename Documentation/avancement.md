# JDR Manager — Avancement de l'implémentation (V1)

Suivi détaillé du [plan d'implémentation](./Plan_implementation.md). Chaque tâche du plan est découpée en sous-tâches vérifiables.

## Mode d'emploi

- Une sous-tâche terminée est cochée : `- [ ]` → `- [x]`.
- La ligne **Note** reste à `—` tant qu'il n'y a rien à signaler. Sinon, on y écrit une information, une remarque ou une alerte, préfixée si besoin par :
  - `ℹ️ Info :` choix d'implémentation, précision utile pour la suite ;
  - `⚠️ Alerte :` écart avec les documents, problème, risque, dette technique ;
  - `❓ Question :` décision à prendre par le porteur du projet.
- Une note qui modifie un comportement décrit dans le PRD, le TRD ou le brief doit aussi être reportée dans le document concerné.
- Les références entre crochets renvoient aux exigences (PRD / TRD) ou aux sections des documents.
- Le tableau de synthèse est mis à jour à la fin de chaque lot.

## Synthèse

| Lot | Intitulé | Sous-tâches | Terminées | État |
|---|---|---|---|---|
| 0 | Initialisation du projet | 12 | 12 | Terminé |
| 1 | Styles, thèmes et internationalisation | 17 | 17 | Terminé |
| 2 | Couche de données et médias | 17 | 17 | Terminé |
| 3 | Composants partagés | 22 | 22 | Terminé |
| 4 | Tranche verticale | 9 | 9 | Terminé |
| 5 | Projets et paramètres | 9 | 9 | Terminé |
| 6 | Bibliothèques de sons | 11 | 11 | Terminé |
| 7 | Éditeur de scène | 17 | 17 | Terminé |
| 8 | Éditeur d'action | 18 | 18 | Terminé |
| 9 | Moteur de présentation et audio | 27 | 27 | Terminé |
| 10 | Écran de Présentation (PC) | 21 | 21 | Terminé |
| 11 | Fenêtre joueurs | 7 | 7 | Terminé |
| 12 | Reprise et cohérence des données | 6 | 6 | Terminé |
| 12 bis | Hors ligne et tablette | 8 | 0 | À faire |
| 13 | Robustesse, performance, accessibilité | 16 | 15 | En cours |
| 14 | Recette V1 | 6 | 0 | À faire |
| **Total** | | **223** | **208** | |

---

## Lot 0 — Initialisation du projet

### 0.1 Création du projet

- [x] **0.1.1** Créer le projet avec `ng new jdr-manager --style=scss --routing --ssr=false` et vérifier la version d'Angular (dernière stable). [TEC-01, TEC-11, TEC-18]
  - Note : ℹ️ Info : Angular CLI 22.2.6 / Angular 22.2.4, Node 22, TypeScript 6.0. Projet créé directement à la racine du dossier `Source`.
- [x] **0.1.2** Vérifier les réglages standalone et zoneless (`provideZonelessChangeDetection`), retirer Zone.js s'il est présent. [TEC-02, TEC-04]
  - Note : ℹ️ Info : le projet est zoneless par défaut (pas de dépendance `zone.js`). En Angular 22, la détection **OnPush est la stratégie par défaut** : les composants n'ont pas besoin de la déclarer ; ESLint interdit `ChangeDetectionStrategy.Eager` / `Default`.
- [x] **0.1.3** Fixer les valeurs par défaut des schematics dans `angular.json` : `style: scss`, `changeDetection: OnPush`, `skipTests: false`, préfixe `app`. [TEC-18]
  - Note : ℹ️ Info : réglages posés avec `ng config`. Le schematic de composant ignore `changeDetection: OnPush` puisque c'est désormais la valeur par défaut.
- [x] **0.1.4** Initialiser le dépôt Git (`.gitignore`, premier commit).
  - Note : ℹ️ Info : dépôt Git initialisé par Allan dans `Source` (`git init`). Le `.gitignore` généré par le CLI exclut `node_modules`, `dist` et `.angular`.

### 0.2 Qualité du code

- [x] **0.2.1** Activer TypeScript `strict` et les options strictes des templates. [TEC-09]
  - Note : ℹ️ Info : `strict`, `noUnusedLocals`, `noUnusedParameters`, `strictTemplates`, diagnostics étendus en erreur.
- [x] **0.2.2** `ng add @angular-eslint/schematics` et configurer les règles du projet. [TEC-09]
  - Note : ℹ️ Info : règles ajoutées : signals (`prefer-signals`), `inject()` (`prefer-inject`), control flow natif, pas de `any`, accessibilité des templates, interdiction de sortir d'OnPush.
- [x] **0.2.3** Installer et configurer Prettier (intégration ESLint). [TEC-09]
  - Note : ℹ️ Info : Prettier était fourni par `ng new` ; ajout de `eslint-config-prettier`, `.prettierignore` et des scripts `format` / `format:check`.
- [x] **0.2.4** Installer Stylelint pour SCSS, avec une règle interdisant les couleurs, tailles et ombres en dur hors des fichiers de jetons et de thèmes. [TEC-14]
  - Note : ℹ️ Info : `npm run lint:styles`. Interdit hex, couleurs nommées, `rgb()/rgba()/hsl()`, unités en dur (px/rem/em) pour marges, espacements, tailles de police, rayons et positions, et les couleurs dans `box-shadow`, sauf dans les fichiers de jetons, de fonctions et de thèmes. Vérifié sur un fichier de test.

### 0.3 Tests

- [x] **0.3.1** Vérifier la configuration Vitest de `ng test` et écrire un test d'exemple. [TEC-80]
  - Note : ℹ️ Info : Vitest 5 (builder `@angular/build:unit-test`, jsdom). `ng test --watch=false` : 7 fichiers, 8 tests OK.
- [x] **0.3.2** Installer `fake-indexeddb` pour les tests de la couche de données. [TEC-81]
  - Note : ℹ️ Info : test d'exemple `src/testing/fake-indexeddb.spec.ts` (ouverture d'une base, création d'un store).

### 0.4 Structure

- [x] **0.4.1** Créer l'arborescence `core/`, `shared/`, `features/` et `src/styles/`. [TRD §2.2]
  - Note : ℹ️ Info : dossiers vides conservés par des fichiers `.gitkeep`.
- [x] **0.4.2** Déclarer les routes (`/projects`, `/sounds`, `/projects/:id/edit`, `/play`, `/player`) avec chargement paresseux de composants vides ; README de démarrage (commandes `ng serve`, `ng test`, `ng lint`, `ng build`). [TEC-10, TRD §2.3]
  - Note : ℹ️ Info : 5 pages générées avec `ng g c` et chargées à la demande ; `''` et routes inconnues redirigent vers `/projects`. README avec prérequis, commandes et règles. ⚠️ Alerte : le dossier `.vscode` (recommandations d'extensions, tâches) n'a pas pu être copié sur ton PC (écriture interdite par l'outil) ; sans impact sur le projet.

**Critère de fin** : `ng serve`, `ng lint`, `ng test` et `ng build` passent sur le projet vide.

> ✅ Vérifié le 6 novembre 2026 : `ng lint`, `npm run lint:styles`, `ng test --watch=false`, `ng build` et `prettier --check` passent. Après récupération, lancer `npm install` dans `Source` avant toute commande.

---

## Lot 1 — Styles, thèmes et internationalisation

### 1.1 Jetons et fonctions SCSS

- [x] **1.1.1** Créer `_tokens.scss` : espacements, rayons, tailles et graisses de texte. [Brief §3, §4]
  - Note : ℹ️ Info : maps `$spacing` (clés = valeur en px : `space(16)`), `$radius`, `$font-size`, `$font-weight`, `$line-height`, `$letter-spacing`, `$control-height`, `$duration`, `$easing`, `$layout` (largeurs des panneaux, hauteur des en-têtes). Exposées en variables CSS `--space-16`, `--radius-md`… sur `:root`.
- [x] **1.1.2** Créer `_functions.scss` : `color()`, `space()`, `radius()`, `shadow()`, `font()` qui renvoient des `var(--…)`. [TRD §10.4]
  - Note : ℹ️ Info : fonctions `color()`, `space()`, `radius()`, `shadow()`, `font-family()`, `font-size()`, `font-weight()`, `line-height()`, `letter-spacing()`, `control-height()`, `duration()`, `easing()`, `layout()`, `transition()`. Chacune renvoie un `var(--…)` et fait échouer la compilation si la clé est inconnue. `font()` a été découpée en `font-family()` / `font-size()` / `font-weight()`, plus lisibles. Import dans un composant : `@use 'functions' as *;` (`src/styles` est dans `includePaths`).
- [x] **1.1.3** Créer les styles de base globaux (reset, `body`, typographie par défaut, focus visible). [Brief §8]
  - Note : ℹ️ Info : `_base.scss` : `box-sizing`, `body` (fond, couleur, police d'interface), titres en Cinzel, liens, focus visible (contour 2 px couleur d'accent), `::selection`, et `prefers-reduced-motion` qui neutralise animations et transitions.

### 1.2 Moteur de thèmes

- [x] **1.2.1** Créer `_theme-engine.scss` : liste des jetons obligatoires (Brief §2) et mixin `theme()` qui génère les variables CSS. [TEC-12, TEC-13]
  - Note : ℹ️ Info : `$required-tokens` reprend tous les jetons du Brief §2 + `color-scheme` (barres de défilement et contrôles natifs clairs ou sombres). Le mixin `theme()` génère `[data-theme="<id>"]` (et `:root` pour le thème par défaut). Les jetons communs (espacements, rayons…) sont générés une seule fois par `common-tokens`.
- [x] **1.2.2** Faire échouer la compilation si un jeton manque dans une map (vérifier avec une map volontairement incomplète). [TEC-12]
  - Note : ℹ️ Info : le mixin refuse un jeton manquant **et** un jeton inconnu (faute de frappe). Vérification automatisée : `npm run check:themes` compile chaque thème puis une map amputée de `accent` et une map avec un jeton inventé, et attend une erreur dans les deux cas.
- [x] **1.2.3** Créer `themes/_nuit-doree.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : ℹ️ Info : valeurs reprises telles quelles du Brief §11.3. ⚠️ Alerte : Stylelint impose la notation moderne `rgb(0 0 0 / 50%)` ; elle est désactivée dans les fichiers de thème pour garder la notation `rgba()` du Brief et faciliter la comparaison.
- [x] **1.2.4** Créer `themes/_automne.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : ℹ️ Info : valeurs reprises du Brief §11.3 (thème clair, `color-scheme: light`).
- [x] **1.2.5** Générer les deux thèmes dans `styles.scss` (Nuit dorée par défaut sur `:root`). [TEC-13]
  - Note : ℹ️ Info : Nuit dorée appliqué à `:root` et à `[data-theme="nuit-doree"]`, Automne à `[data-theme="automne"]`. Ajouter un thème = un fichier SCSS + une ligne dans `styles.scss` + une entrée dans `THEMES` (`core/theme/theme.ts`).

### 1.3 Angular Material, polices et icônes

- [x] **1.3.1** `ng add @angular/material` puis brancher le thème Material (M3 + surcharges) sur les variables CSS. [TEC-08, TEC-15]
  - Note : ℹ️ Info : `ng add @angular/material`. `mat.theme()` (M3) puis `mat.theme-overrides()` qui redirige les rôles Material (primary, surface, outline, error…) vers nos variables CSS : les composants Material suivent le thème actif sans recompilation. Les liens Google Fonts / Material Symbols ajoutés par `ng add` ont été retirés de `index.html` (polices auto-hébergées, icônes Lucide).
- [x] **1.3.2** Auto-héberger les polices Cinzel, Inter et Lora (`@font-face`, fichiers dans `assets`). [Brief §3, §10]
  - Note : ℹ️ Info : polices auto-hébergées via les paquets `@fontsource/cinzel`, `@fontsource/inter` et `@fontsource/lora` (graisses utilisées seulement), déclarés dans `angular.json`. Les fichiers sont copiés dans le build : aucune requête externe, fonctionne hors ligne. C'est plus simple à maintenir que des `@font-face` écrits à la main dans `assets`.
- [x] **1.3.3** Installer les icônes Lucide (`@lucide/angular`) et vérifier leur rendu au trait. [Brief §5]
  - Note : ⚠️ Alerte : `lucide-angular` ne supporte pas Angular 22 (dépendance limitée à Angular 21). Remplacé par le paquet officiel `@lucide/angular` : une directive par icône (`<svg lucidePencil>`), configuration globale `provideLucideConfig({ strokeWidth: 1.75, size: 16 })`. Rendu au trait vérifié sur la page de démonstration. Brief §5 mis à jour.

### 1.4 Préférences et changement de thème

- [x] **1.4.1** Générer le service `UiPreferences` (`ng g service`) : lecture / écriture `localStorage` protégées par `try/catch`. [TEC-62]
  - Note : ⚠️ Alerte : Angular 22 génère `@Service()` et nomme la classe **sans suffixe** : `UiPreferences` (`core/preferences/ui-preferences.ts`). Règle ajoutée au TRD (TEC-19), noms mis à jour dans le TRD et le plan (`Theme`, `UiPreferences`, `AudioPlayer`, `MediaUrls`). ℹ️ Info : `get(key, fallback)`, `set(key, value)`, `remove(key)` ; clés préfixées `jdr-manager:`, valeurs en JSON ; stockage indisponible → valeur par défaut, sans erreur.
- [x] **1.4.2** Générer le service `Theme` : signal `theme`, application de `data-theme` sur `<html>`, mémorisation. [TEC-16]
  - Note : ℹ️ Info : service `Theme` : signal `theme` (lecture seule), `setTheme(id)`, liste `THEMES`, thème mémorisé relu au démarrage, identifiant inconnu ignoré. Un `effect` applique `data-theme` sur `<html>`.
- [x] **1.4.3** Ajouter dans `index.html` le script qui applique le thème mémorisé avant le chargement d'Angular (pas de flash). [TEC-16]
  - Note : ℹ️ Info : script inline dans `<head>` qui lit `jdr-manager:theme` et pose `data-theme` avant le chargement d'Angular. Vérifié : après rechargement, le thème Automne reste appliqué sans flash.
- [x] **1.4.4** Page de démonstration temporaire : bascule entre les deux thèmes à la volée. [Plan, lot 1]
  - Note : ℹ️ Info : page `features/dev/theme-demo-page`, route temporaire `/dev/themes` : nuancier, typographie (Cinzel, Inter, Lora), couleurs des sept types d'éléments avec leur icône, boutons / bascule / champ Material, sélecteur de thème. À supprimer quand les vrais écrans seront en place.

### 1.5 Internationalisation

- [x] **1.5.1** `ng add @jsverse/transloco`, langue `fr` par défaut, chargement de `public/i18n/fr.json`. [TEC-70]
  - Note : ℹ️ Info : `ng g @jsverse/transloco:ng-add --langs=fr` (`ng add` échouait sur l'option `--ssr`). Chargeur déplacé dans `core/i18n/transloco-loader.ts`, chemin relatif `i18n/fr.json` (fonctionne aussi si l'appli est servie dans un sous-dossier). Pour les tests : `getTranslocoTestingModule()` dans `src/testing`.
- [x] **1.5.2** Organiser les clés par domaine (`common`, `project`, `scene`, `action`, `presentation`, `sound`, `error`, `settings`). [TEC-71, TEC-72]
  - Note : ℹ️ Info : `fr.json` organisé en `common`, `project`, `scene`, `action`, `presentation`, `sound`, `error`, `settings` (+ `dev` pour la page temporaire, à supprimer avec elle). Les clés seront complétées écran par écran.

**Critère de fin** : la page de démonstration change de thème à la volée ; un jeton manquant fait échouer la compilation.

> ✅ Lot 1 validé : `ng build`, `ng test` (21 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : Material, Transloco, Lucide, Fontsource, Sass), puis `ng serve` et ouvrir `http://localhost:4200/dev/themes`.

---

## Lot 2 — Couche de données et médias

### 2.1 Modèle

- [x] **2.1.1** Générer les interfaces du modèle (`ng g interface`) : `Project`, `TreeNode`, `SceneNode`, `Scene`, `Battlemap`, `SoundNode`, `Media`. [TRD §3]
  - Note : ℹ️ Info : un fichier par interface dans `core/models` (générés avec `ng g interface core/models/<nom>`). Ajouts écrits à la main (la CLI ne génère pas de type) : `id.ts` (type `Id` et `newId()` = `crypto.randomUUID()`), `TreeNodeKind`, `SoundLibraryId` et la constante `GLOBAL_SOUND_LIBRARY`. ⚠️ Alerte : champ `fileName` ajouté à `Media` (nom du fichier d'origine), utile pour nommer un son importé par défaut et pour l'export ; TRD §3 mis à jour.
- [x] **2.1.2** Interfaces `Action` et union `ActionElement` (8 types). [TRD §3]
  - Note : ℹ️ Info : `core/models/action.ts` (`Action`, `Trigger`) et `core/models/action-element.ts` : une interface par type d'élément (`ShowBattlemapElement`, `PlaySoundElement`, `StopSoundElement`, `StopAllSoundsElement`, `AddTextElement`, `ChangeSceneElement`, `WaitElement`, `UserClickElement`) réunies dans l'union discriminée `ActionElement` (sur `type`), plus `ActionElementType` et la liste `ACTION_ELEMENT_TYPES` (ordre du menu d'ajout). Un `switch` sur `element.type` donne ainsi le bon type à TypeScript dans le moteur et l'éditeur.
- [x] **2.1.3** Interfaces de partie : `PlaySession`, `SceneState` (dont `paused` et `volume` des sons), `FeedItem`. [TRD §3, PRS-04]
  - Note : ℹ️ Info : `play-session.ts`, `scene-state.ts` (le son en cours devient une interface nommée `PlayingSound` : `soundId`, `elementId`, `paused`, `volume`) et `feed-item.ts` (union `TextFeedItem` / `BattlemapFeedItem` / `UserClickFeedItem`). Ajout d'un point d'entrée `core/models/index.ts` pour importer tout le modèle en une ligne.

### 2.2 Contrat d'accès

- [x] **2.2.1** Écrire l'interface `DataRepository` complète et le token `DATA_REPOSITORY`. [TEC-21, TEC-22]
  - Note : ℹ️ Info : `core/data/data-repository.ts`, conforme au TRD §4.1, avec le comportement attendu documenté sur chaque méthode (tris, cascades, erreurs). Ajout de `core/data/data-error.ts` : classe `DataError` avec un `code` (`unsupported-media-type`, `quota-exceeded`, `media-not-found`) et une `messageKey` de traduction (`error.data.<code>` ajoutées dans `fr.json`), pour que les écrans affichent un message clair sans connaître IndexedDB. Écrit à la main : la CLI ne génère ni `InjectionToken` ni interface de ce type.
- [x] **2.2.2** Déclarer le fournisseur unique dans `app.config.ts`. [TEC-22]
  - Note : ℹ️ Info : `{ provide: DATA_REPOSITORY, useExisting: IndexedDbRepository }`. `useExisting` (au lieu de `useClass` du TRD) garantit une seule instance, donc une seule connexion à la base, même si une classe injecte `IndexedDbRepository` directement. Classe générée avec `ng g s core/data/indexed-db-repository` ; ses méthodes sont remplies dans les tâches 2.3.x. Test `data-repository.spec.ts` : le jeton renvoie bien l'implémentation IndexedDB.

### 2.3 Implémentation IndexedDB

- [x] **2.3.1** Installer `idb`, ouvrir la base, schéma v1 (stores et index du TRD §4.2) dans `upgrade`. [TEC-20, TEC-25]
  - Note : ℹ️ Info : `idb` 8 (`npm install`, pas de schematic). `core/data/jdr-db.ts` : schéma typé `JdrDbSchema`, `openJdrDb()` avec migrations en blocs `if (oldVersion < N)`, et fermeture de la connexion si un autre onglet ouvre une version plus récente. La connexion est ouverte à la première utilisation puis partagée ; le nom de la base passe par le jeton `INDEXED_DB_NAME` pour isoler les tests. ⚠️ Alerte : index `mediaId` ajouté sur `battlemaps` et `soundNodes` (absent du TRD §4.2) : il permet de savoir rapidement si un média est encore utilisé avant de le supprimer (2.4.3). TRD §4.2 mis à jour. Test `jdr-db.spec.ts` : stores et index créés.
- [x] **2.3.2** Méthodes projets (liste, lecture, sauvegarde, suppression en cascade dans une seule transaction). [TRD §4.2]
  - Note : ℹ️ Info : `listProjects` trie du plus récemment modifié au plus ancien. `deleteProject` supprime dans une seule transaction l'arborescence, les scènes, battlemaps, actions, la bibliothèque de sons du projet, la partie sauvegardée, puis les médias devenus inutilisés (un média encore utilisé par un autre projet est conservé). Les fonctions de cascade, réutilisées par les autres suppressions, sont dans `core/data/jdr-db-cascade.ts`. Fabriques de données de test dans `src/testing/data-builders.ts`. Tests : enregistrement, tri, remplacement, cascade complète.
- [x] **2.3.3** Méthodes arborescence des scènes, scènes, battlemaps, actions. [TRD §4.1]
  - Note : ℹ️ Info : listes triées par `order` ; `saveSceneNodes` enregistre un lot en une transaction (déplacements). `deleteSceneNode` supprime le nœud et tous ses descendants (dossier), leurs scènes, battlemaps, actions et médias inutilisés, et nettoie les références : `Project.firstSceneId` et `Scene.nextSceneIds` des autres scènes. `deleteBattlemap` vide aussi `Scene.defaultBattlemapId` et garde l'image si une autre battlemap l'utilise. ✅ Décision (Allan) : les éléments « Changer de scène » qui visent une scène supprimée sont conservés tels quels et **signalés à l'écran** (éditeur et Présentation, cf. 8.3.6, 9.3.4, 10.3.7) ; le dépôt ne les modifie pas. ℹ️ Info : l'interdiction de supprimer l'action « Texte de scène » sera appliquée par l'éditeur (lot 7), pas par le dépôt, qui doit pouvoir la supprimer avec sa scène.
- [x] **2.3.4** Méthodes bibliothèques de sons (globale et par projet). [SON-01]
  - Note : ℹ️ Info : une seule table `soundNodes`, séparée par `libraryId` (`GLOBAL_SOUND_LIBRARY` = `'global'` ou id du projet). `deleteSoundNode` supprime le nœud et ses descendants, puis les fichiers son qui ne servent plus ailleurs. Les éléments « Lancer / Arrêter un son » qui visent un son supprimé restent en l'état et seront signalés à l'affichage (même principe que PRS-07).
- [x] **2.3.5** Méthodes partie sauvegardée (lecture, sauvegarde, suppression). [PRS-04]
  - Note : ℹ️ Info : une partie par projet (clé `projectId`), remplacée à chaque sauvegarde. Testé avec un état complet (sons en pause avec leur volume, bloc « clic » non validé) relu à l'identique.

### 2.4 Médias

- [x] **2.4.1** `uploadMedia` : contrôle du type MIME, copie en `Blob` dans le store `media`. [TEC-30, TEC-31, TEC-34]
  - Note : ℹ️ Info : formats dans `core/media/media-types.ts` : `resolveMediaType(file)` regarde le type MIME puis, s'il est vide ou générique, l'extension ; il normalise les variantes (`audio/x-wav` → `audio/wav`, `audio/x-m4a` → `audio/mp4`…) et refuse le reste (GIF, vidéo…). `acceptAttribute('image' | 'sound')` servira aux champs de fichier et à la directive de glisser-déposer (TEC-35). Un format refusé lève `DataError('unsupported-media-type')`. ⚠️ Alerte : en test, fake-indexeddb ne sait pas copier les `Blob` de jsdom ; l'utilitaire `src/testing/node-blob.ts` utilise ceux de Node pendant les tests de médias (ajout de `@types/node` en dépendance de dev). Aucun impact dans le navigateur.
- [x] **2.4.2** Gestion de `QuotaExceededError` (échec propre, message d'erreur). [TRD §5]
  - Note : ℹ️ Info : `isQuotaExceededError()` reconnaît `QuotaExceededError`, l'ancien nom Firefox et une erreur de quota enveloppée. `uploadMedia` la transforme en `DataError('quota-exceeded')` (clé `error.data.quota-exceeded` : « Espace de stockage du navigateur insuffisant… ») ; rien n'est enregistré. Les autres erreurs remontent telles quelles. Testé en simulant le quota. ⚠️ Alerte : les utilitaires de test (`src/testing`) sont maintenant exclus de `tsconfig.app.json` et inclus dans `tsconfig.spec.json`, sinon `ng build` compilait du code de test.
- [x] **2.4.3** Suppression d'un média uniquement s'il n'est plus référencé. [TRD §4.2]
  - Note : ℹ️ Info : `deleteMedia` vérifie dans la même transaction, via les index `mediaId`, qu'aucune battlemap ni aucun son n'utilise le média ; sinon il ne fait rien (pas d'erreur). La même règle s'applique dans toutes les suppressions en cascade (projet, scène, battlemap, son). Les éléments d'action ne référencent jamais un média directement, donc pas de vérification de leur côté.
- [x] **2.4.4** `MediaUrls` : cache `mediaId → blob:` avec compteur de références et `revokeObjectURL`. [TEC-32, TEC-33]
  - Note : ℹ️ Info : service `MediaUrls` (`ng g s core/media/media-urls`) : `acquire(id)` crée l'URL au premier usage puis la partage, `release(id)` la révoque quand le compteur retombe à zéro (seulement les URL `blob:` ; une URL `https:` de la future API n'a rien à libérer). Un média introuvable n'est pas gardé en cache, pour pouvoir réessayer. Pour les composants : `track(() => mediaId)` renvoie les signals `url` et `missing`, suit le changement d'id et libère tout seul à la destruction du composant (sert à l'affichage « battlemap manquante », PRS-07). `getMediaUrl` du dépôt est implémenté (nouvelle URL `blob:` à chaque appel, `DataError('media-not-found')` sinon). Tests écrits dès maintenant (création, partage, révocation, URL distante, échec, `track`).
- [x] **2.4.5** Demande `navigator.storage.persist()` au démarrage. [TEC-26, NF-12]
  - Note : ℹ️ Info : service `StoragePersistence` (`ng g s core/data/storage-persistence`) appelé par `provideAppInitializer` dans `app.config.ts`, sans bloquer l'affichage. Il ne redemande pas si le stockage est déjà persistant, ne lève jamais d'erreur et expose le signal `persisted` (utile pour les paramètres, NF-14). ⚠️ Alerte : Chrome et Edge accordent ou refusent sans rien demander ; Firefox affiche une demande d'autorisation dès l'ouverture de l'application. Si c'est gênant, on pourra déplacer la demande au premier import de fichier.

### 2.5 Tests

- [x] **2.5.1** Tests unitaires de chaque méthode du dépôt avec `fake-indexeddb` (dont les suppressions en cascade). [TEC-81]
  - Note : ℹ️ Info : `indexed-db-repository.spec.ts` couvre les 24 méthodes du contrat (écrits au fil des tâches 2.3 et 2.4), avec une base neuve par test. Cascades testées : projet complet (en gardant les données des autres projets et un média partagé), dossier de scènes avec sous-dossiers et nettoyage des références, battlemap partagée, dossier de sons. Couverture de `core/data` : 98 % des lignes (seuls restent l'échec d'ouverture de la base et le changement de version dans un autre onglet). Nouvelle commande `npm run test:coverage` (ajout de `@vitest/coverage-v8`).
- [x] **2.5.2** Tests de `MediaUrls` (création, partage, libération des URL) ; vérifier qu'aucun autre fichier n'importe `idb`. [TEC-23]
  - Note : ℹ️ Info : tests de `MediaUrls` écrits en 2.4.4 (partage, révocation à la dernière libération, URL distante non révoquée, média introuvable, `track`). Vérification de TEC-23 rendue **automatique** par ESLint : `no-restricted-imports` interdit `idb` et `no-restricted-globals` interdit `indexedDB` partout, sauf dans `src/app/core/data` et `src/testing`. `ng lint` échoue donc dès qu'un autre fichier y accède (vérifié avec un fichier d'essai). Aujourd'hui, seuls `jdr-db.ts`, `jdr-db-cascade.ts` et leurs tests importent `idb`.

**Critère de fin** : toutes les méthodes du contrat sont testées ; aucun autre code n'importe `idb`.

> ✅ Lot 2 validé : `ng build`, `ng test` (74 tests), `ng lint` (dont la règle TEC-23), `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : `idb`, et pour les tests `@types/node`, `@vitest/coverage-v8`). TRD mis à jour (§3 `Media.fileName`, §4.1 `useExisting` et `DataError`, §4.2 index `mediaId` et nettoyage des références, §5 API de `MediaUrls`). Une question reste ouverte en 2.3.3 (éléments « Changer de scène » vers une scène supprimée).

---

## Lot 3 — Composants partagés

### 3.1 Composants d'interface de base (`shared/ui`)

- [x] **3.1.1** Boutons : principal, secondaire, plein, discret, ajout, danger, danger fort, icône. [Brief §6.1]
  - Note : ℹ️ Info : directive `appButton` (`ng g directive shared/ui/button/button`) posée sur un vrai `<button>` ou `<a>` : `<button appButton="secondary" size="sm">`. Variantes `primary`, `secondary`, `filled`, `quiet`, `add`, `danger`, `danger-strong`, `icon` ; tailles `sm` (volet), `md`, `header`, `lg` (Présentation), `touch` (tablette) ; option `block`. Styles globaux dans `src/styles/components/_button.scss` (une directive n'a pas de feuille de style propre). Jetons ajoutés : `control-height(header)` 40 px, `radius(xxxl)` 20 px (et `2xl` renommé `xxl` : Stylelint lisait `2xl` comme une unité), `layout(tree-indent)` et largeurs de modales `layout(modal-sm|md|lg)`. Page de démonstration temporaire `/dev/components`, complétée à chaque composant ; vérifiée dans les deux thèmes.
- [x] **3.1.2** Pastilles (action, scène suivante avec « × », badge « Par défaut »). [Brief §6.5]
  - Note : ℹ️ Info : composant `app-pill` (`shared/ui/pill`) : `tone` = un type d'élément (couleurs du Brief §2.6) ou `neutral` / `accent` ; `removable` affiche un bouton « × » (libellé d'accessibilité « Retirer : <nom> ») qui émet `remove` ; `variant="badge"` pour « Par défaut ». La table `ELEMENT_TONES` donne la couleur de chaque type d'élément d'action (« Arrêter un son » partage celle de « Arrêter tous les sons »). Jetons d'espacement 2 et 3 px ajoutés (marge 3 × 10 du Brief). Clé `common.actions.remove` ajoutée.
- [x] **3.1.3** Champs : texte, zone de texte, case à cocher, radio, curseur, contrôle segmenté. [Brief §6.2, §6.3]
  - Note : ℹ️ Info : directive `appInput` (champ texte et zone de texte, variante `surface="card"`, bordure rouge si `aria-invalid="true"`) ; composant `app-field` (libellé relié au contrôle par `controlId`, mention « (obligatoire) », aide en italique, erreur annoncée par `role="alert"`, libellé masqué possible pour le texte de scène) ; cases à cocher, radios et curseurs natifs à la couleur d'accent avec la classe `app-check` pour le libellé ; composant `app-segmented-control` (groupe radio accessible, flèches du clavier, compatible Signal Forms par son modèle `value`). Styles globaux dans `src/styles/components/_form.scss` (dont `.visually-hidden`). Clé `common.required` ajoutée.
- [x] **3.1.4** Section repliable (chevron, titre, résumé, action dans l'en-tête, état mémorisable). [Brief §6.6]
  - Note : ℹ️ Info : composant `app-collapsible-section` : en-tête de 48 px avec chevron, titre, résumé et emplacement d'action (`sectionAction`) placé hors du bouton de repli (pas de bouton dans un bouton) ; `aria-expanded` / `aria-controls` ; ouverte par défaut (modèle `open`). Avec `preferenceKey`, l'état est mémorisé via `UiPreferences` sous `section:<clé>` et relu à l'affichage. Testé (repli, mémorisation, relecture).
- [x] **3.1.5** Fenêtre modale (en-tête, contenu, pied) via CDK Dialog. [Brief §6.9]
  - Note : ℹ️ Info : service `Modals` (`open(Composant, { data, size: 'sm' | 'md' | 'lg', closable })`) sur CDK Dialog : fond `--bg-backdrop`, largeurs 560 / 620 / 900 px du Brief, focus piégé puis rendu à l'élément d'origine. Composant de mise en page `app-modal` : titre Cinzel + sous-titre + bouton fermer, contenu défilant, pied avec `modalFooterStart` (action destructive) et `modalFooterEnd` (Annuler + principale), variante `danger` ; la fenêtre est nommée par son titre (`aria-labelledby`). Le focus initial va sur l'élément marqué `cdkFocusInitial` (sinon le premier élément focusable). Styles structurels du CDK + habillage dans `src/styles/components/_overlay.scss`. Testé (titre, taille, résultat, fermeture).
- [x] **3.1.6** Fenêtre de confirmation (variante destructive). [Brief §6.9, NF-31]
  - Note : ℹ️ Info : composant `ConfirmDialog` ouvert par `Modals.confirm({ title, message, confirmLabel?, destructive? })`, qui renvoie une `Promise<boolean>` (`false` si on annule ou ferme). Variante destructive : bordure rouge, icône d'alerte dans un cercle `--danger-bg`, bouton « Danger fort ». Le focus initial est sur « Annuler », pour qu'une touche Entrée par erreur ne supprime rien (NF-31). Libellés par défaut traduits (Annuler / Confirmer). Testé (confirmation, annulation, fermeture sans réponse).
- [x] **3.1.7** Message d'erreur / notification (couleurs danger). [Brief §6.14, NF-25]
  - Note : ℹ️ Info : composant `app-alert` (message dans la page, ton `danger` annoncé par `role="alert"` ou `info` par `role="status"`, icône, action optionnelle `alertAction`). Service `Notifications` (`error()`, `info()`, `dismiss()`, et `fromError(e)` qui affiche le message traduit d'une `DataError` ou « Une erreur est survenue. ») ; disparition automatique après 8 s (erreur) ou 4 s (information), durée 0 = jusqu'à fermeture. Zone d'affichage `<app-notification-host>` ajoutée une fois dans `app.html`, en bas à droite. Testé.
- [x] **3.1.8** Menu / liste déroulante (CDK Menu / Overlay). [Brief §6.8]
  - Note : ℹ️ Info : directives `appMenu` et `appMenuItem` qui embarquent CDK Menu (`hostDirectives`) : rôles ARIA, navigation aux flèches, fermeture à Échap et au choix d'une entrée. `appMenuItem` : sortie `triggered`, entrées `disabled`, `tone="danger"` et `selected` (option choisie d'une liste) ; séparateur `.app-menu-separator`. Ouverture par `[cdkMenuTriggerFor]` ; la position est réglable (`cdkMenuPosition`, ex. liste « Scène suivante » ouverte au-dessus du bouton, Brief §6.11). Styles dans `src/styles/components/_menu.scss` ; jetons `control-height(item)` 38 px et `layout(menu-min)` 200 px ajoutés. Testé.
- [x] **3.1.9** Visuel de remplacement quadrillé (jetons `--placeholder-*`). [Brief §6.15]
  - Note : ℹ️ Info : composant `app-placeholder` : fond uni et grille fine dessinée en CSS avec les jetons `--placeholder-*` ; `variant="alt"` (seconde palette), `grid="fine"` (pas de 12 px pour les miniatures) ou `wide` (20 px). Décoratif par défaut (`aria-hidden`), nommé avec `label` (`role="img"`). Contenu projeté centré (icône). Vérifié dans les deux thèmes avec le badge « Par défaut ».

### 3.2 Composant d'arborescence générique

- [x] **3.2.1** Construire l'arbre à partir de la liste plate (`computed`), plier / déplier. [TEC-60, TRD §8]
  - Note : ℹ️ Info : composant `app-tree` (`ng g c shared/tree`, classe `Tree<T extends TreeNode>` : nom CLI, sans le suffixe `Component` du TRD). Fonctions pures dans `shared/tree/tree-model.ts` : `visibleRows()` construit dans un `computed` la liste des lignes visibles (tri par `order` puis par nom, profondeur, ancêtres) ; un nœud dont le parent est introuvable est ramené à la racine plutôt que perdu ; `descendantIds()` et `pathTo()` (chemin « Dossier › Sous-dossier › Élément ») serviront aux étapes suivantes. Plier / déplier : modèle `collapsedIds` (les nouveaux dossiers sont dépliés ; le parent peut mémoriser l'état) et méthodes `toggle()` / `expand()`. Rendu en liste aplatie (plus simple pour le glisser-déposer et le clavier). Données de test dans la page de démonstration.
- [x] **3.2.2** Sélection d'une ligne, style sélectionné, `itemTemplate` fourni par le parent. [TEC-61]
  - Note : ℹ️ Info : modèle `selectedId` (clic sur la ligne ; le chevron plie / déplie sans sélectionner) ; ligne sélectionnée en `--accent-tint` / `--accent-text` avec filet doré de 2 px à gauche, survol en `--bg-control` (Brief §6.7). Affichage des éléments fourni par le parent via `<ng-template #item let-node let-row="row">` (`contentChild('item')`) ; les dossiers gardent l'affichage par défaut (icône dossier + nom en gras). Dans la page de démonstration, les scènes ont une icône clap. Testé (sélection, synchronisation avec le parent, modèle d'affichage).
- [x] **3.2.3** Création, renommage en place, suppression (outputs génériques). [SCN-08 à 11]
  - Note : ℹ️ Info : sorties génériques `create` (`{ parentId, kind }`), `rename` (`{ id, name }`) et `remove` (id, émis seulement après confirmation) ; le composant ne sauvegarde rien. `requestCreate()` déplie le dossier parent ; le parent crée le nœud puis appelle `startRename(id)` : la ligne passe en champ de saisie, focus et texte sélectionné. Entrée ou sortie du champ valide (nom vide ou inchangé ignoré, espaces retirés), Échap annule, F2 renomme la ligne active. `requestRemove()` ouvre la confirmation destructive ; pour un dossier, le message indique que son contenu (nombre d'éléments) sera supprimé. Libellés par clés de traduction via `labels` (`tree-labels.ts`, valeurs génériques `tree.*` dans `fr.json`, remplaçables une à une, ex. `newItem: 'scene.new'`). Démonstration : création, renommage et suppression sur les données de test. Testé.
- [x] **3.2.4** Menu contextuel : bouton « ⋯ » au survol / focus + clic droit, entrées communes et `extraMenuItems`, libellés via `labels`. [TEC-61, SCN-09]
  - Note : ℹ️ Info : un seul menu (CDK Menu, directives `appMenu`) ouvert par le bouton « ⋯ » de la ligne ou par clic droit (`cdkContextMenuTriggerFor`, menu à la position du pointeur). « ⋯ » est visible au survol, au focus ou menu ouvert, et toujours visible sur écran tactile. Entrées communes : Nouvel élément et Nouveau sous-dossier (dossiers), Renommer, entrées du parent, séparateur, Supprimer (en rouge, avec confirmation). `extraMenuItems` : `{ label (clé), appliesTo: 'folder' | 'item' | 'both', run(node), hidden?(node) }` ; `hidden` est un ajout au TRD, pour masquer une entrée selon le nœud (ex. « Définir comme première scène » sur la scène déjà première). Tous les libellés passent par `labels` ; clé `scene.setFirst` ajoutée. Testé (bouton, clic droit, filtrage, déclenchement).
- [x] **3.2.5** Glisser-déposer pour déplacer et réordonner (CDK Drag & Drop), dans un dossier ou à la racine. [SCN-02]
  - Note : ℹ️ Info : CDK Drag & Drop sur la liste aplatie, avec tri automatique désactivé : la cible est calculée sous le pointeur (quart haut = avant, quart bas = après, milieu d'un dossier = dedans ; moitiés pour un élément ; sous la dernière ligne = fin de la racine) et matérialisée par un trait doré ou un cadre sur le dossier. Calcul pur et testé dans `tree-model.ts` : `computeMove()` refuse les dépôts impossibles (dossier dans lui-même ou un descendant, dans un élément) ou sans effet ; `applyMove()` renvoie les nœuds dont le parent ou l'ordre change, à enregistrer par l'écran (`saveSceneNodes`). Sortie `move` (`{ id, parentId, order }`, conforme au TRD) ; le dossier cible est déplié. Vérifié dans Chromium avec de vrais glisser-déposer (dans un dossier, avant une ligne, à la racine). ⚠️ Alerte : jsdom ne sait pas simuler le glisser ; le composant lui-même est donc testé dans le navigateur, la logique par des tests unitaires.
- [x] **3.2.6** Mode lecture seule (`editable = false`) et modes de sélection (`selectionMode`, `disabledIds`). [TEC-61]
  - Note : ℹ️ Info : `editable = false` retire le bouton « ⋯ », le menu au clic droit, le glisser-déposer et le renommage. `selectionMode` : `single` (boutons radio) ou `multiple` (cases à cocher) devant les éléments ; modèle `checkedIds` (cases pré-cochées) ; un clic ou Entrée sur un élément le coche / décoche, sur un dossier le plie / déplie. `disabledIds` : élément grisé, non cochable, suivi d'une mention en italique (libellé `labels.disabled`, ex. « scène actuelle », clé `scene.current` ajoutée). Démonstration : arborescence de sélection des scènes suivantes. Testé.
- [x] **3.2.7** Navigation clavier et attributs ARIA (`tree`, `treeitem`, `aria-expanded`). [Brief §8]
  - Note : ℹ️ Info : motif « tree » WAI-ARIA : `role="tree"` (`ariaLabel`, `aria-multiselectable` en sélection multiple), lignes `role="treeitem"` avec `aria-level`, `aria-expanded` (dossiers), `aria-selected` ou `aria-checked` (mode sélection), `aria-disabled`. Une seule ligne atteignable par Tab (« roving tabindex » : ligne sélectionnée, sinon la première). Clavier : flèches haut / bas, Début / Fin ; droite déplie puis descend au premier enfant ; gauche replie puis remonte au parent ; Entrée / Espace activent (sélection ou case) ; F2 renomme ; Suppr supprime (avec confirmation) ; Maj+F10 ou touche Menu ouvre le menu. Après un renommage, le focus revient sur la ligne. Testé (jsdom et Chromium).
- [x] **3.2.8** Tests unitaires du composant. [TEC-82]
  - Note : ℹ️ Info : 33 tests pour l'arborescence. `tree-model.spec.ts` (10 tests) : construction, tri, nœud orphelin, repli, descendants, chemin, calcul et application des déplacements, cas impossibles ou inconnus. `tree.spec.ts` (23 tests), un bloc par sous-tâche 3.2.1 à 3.2.7 : construction et repli, sélection et modèle d'affichage, création / renommage / suppression, menu contextuel, lecture seule et modes de sélection, clavier et ARIA. Le branchement du glisser-déposer est aussi testé en appelant directement les gestionnaires du CDK avec un pointeur simulé (`elementFromPoint`). Couverture de `shared/tree` : 98,7 % des lignes. ℹ️ Info : une branche inatteignable de `computeMove()` a été retirée (parent interdit alors que la référence ne l'est pas).

### 3.3 Fenêtre de sélection

- [x] **3.3.1** Fenêtre réutilisable : arborescence en lecture seule + champ de recherche + compteur. [SCN-04]
  - Note : ℹ️ Info : composant `SelectionDialog` (`shared/selection-dialog`) ouvert par le service `Selections.select({ title, subtitle?, nodes, mode, checkedIds?, disabledIds?, labels?, confirmLabel? })`, qui renvoie les identifiants choisis ou `null` si l'utilisateur annule. Contenu : champ de recherche (focus à l'ouverture), arborescence en lecture seule, compteur « N sélectionné(s) » annoncé aux lecteurs d'écran, Annuler / Valider. Recherche par `filterNodes()` (`tree-model.ts`) : sans tenir compte des accents ni des majuscules, garde les ancêtres des éléments trouvés et tout le contenu d'un dossier trouvé ; les dossiers sont dépliés pendant la recherche ; message « Aucun résultat ». La croix native des champs de recherche est masquée. Clés `selection.*` ajoutées. Vérifiée dans les deux thèmes.
- [x] **3.3.2** Modes sélection multiple (pré-cochés, éléments désactivés) et sélection unique. [SCN-04, ACT-09]
  - Note : ℹ️ Info : `mode: 'multiple'` : cases à cocher, éléments `checkedIds` pré-cochés, éléments `disabledIds` grisés avec leur mention (ex. « scène actuelle »), validation possible même sans choix (vider les scènes suivantes). `mode: 'single'` : boutons radio, « Valider » désactivé tant qu'aucun élément n'est choisi ; libellé de validation personnalisable (ex. « Choisir »). Les éléments cochés sont conservés pendant une recherche, même s'ils sont masqués par le filtre. Testé (pré-cochés, désactivés, compteur, résultat, mode unique, recherche). Démonstration : boutons « Fenêtre de sélection (multiple / unique) ».

### 3.4 Dépôt de fichiers

- [x] **3.4.1** Directive `appFileDrop` : événements de glisser au niveau de la fenêtre, uniquement pour les fichiers (`dataTransfer.types`), compteur d'entrées / sorties. [TEC-35]
  - Note : ℹ️ Info : directive `appFileDrop` (`shared/file-drop`, `exportAs: 'appFileDrop'`) posée sur l'écran hôte. Elle écoute `dragenter` / `dragover` / `dragleave` / `drop` au niveau de la fenêtre et ne réagit qu'aux fichiers du disque (`dataTransfer.types` contient `Files`), jamais aux glisser-déposer internes du CDK. Un compteur d'entrées / sorties évite le clignotement. Elle empêche le navigateur d'ouvrir le fichier déposé. Expose les signals `active` (glisser en cours, pour afficher le calque) et `fileCount`, la sortie `filesDropped` (`File[]`) et l'entrée `appFileDropDisabled`. Testée (jsdom, avec un `DataTransfer` simulé) et vérifiée dans Chromium avec de vrais événements de glisser.
- [x] **3.4.2** Calque plein écran (nombre de fichiers, destination, formats). [Brief §6.13]
  - Note : ℹ️ Info : composant `app-file-drop-overlay`, affiché par l'écran hôte quand `appFileDrop` est actif. Fond `--overlay-drop`, marge 20 px, cadre en pointillés dorés 3 px, rayon 20 px, fond doré à 6 % (Brief §6.13). Au centre : icône d'import dans un cercle, titre Cinzel 30 px (jeton `font-size(drop)` ajouté), nombre de fichiers (masqué s'il est inconnu), destination et formats acceptés selon `kinds` (`FORMAT_LABELS` dans `media-types.ts`). Le calque laisse passer les événements (`pointer-events: none`) : le dépôt reste géré par la directive. Clés `fileDrop.*` ajoutées. Vérifié dans les deux thèmes avec un vrai glisser de 3 fichiers.
- [x] **3.4.3** Filtrage des formats acceptés et signalement des fichiers refusés. [TEC-34]
  - Note : ℹ️ Info : la directive filtre les fichiers déposés avec `resolveMediaType()` (même règle que `uploadMedia`, TEC-34) et les types acceptés par l'écran (`appFileDropKinds`, ex. `['sound']` pour la bibliothèque de sons). `filesDropped` ne reçoit que les fichiers acceptés ; les refusés sont émis par `filesRejected` et signalés par une notification d'erreur qui les nomme et rappelle les formats acceptés (désactivable avec `appFileDropNotify`). Le calque affiche les mêmes formats grâce à `drop.kinds()`. Testé (jsdom) et vérifié dans Chromium (2 fichiers acceptés, 1 refusé et signalé).

**Critère de fin** : arborescence et fenêtre de sélection fonctionnent avec des données de test ; le calque de dépôt s'affiche et filtre les formats.

> ✅ Lot 3 validé : `ng build`, `ng test` (142 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Tous les composants sont réunis sur la page temporaire `/dev/components` avec des données de test, vérifiés dans les deux thèmes. Écarts au TRD : noms CLI sans suffixe (`Tree`, `SelectionDialog`, `Selections`), option `hidden` des entrées de menu, sorties `filesRejected` et entrées `appFileDropKinds` / `appFileDropNotify` de la directive de dépôt.

---

## Lot 4 — Tranche verticale

- [x] **4.1** Accueil minimal : liste des projets et création d'un projet. [PRJ-01]
  - Note : ℹ️ Info : écran `ProjectsPage` (`/projects`) : en-tête commun `app-header` (nouveau composant partagé, 64 px / 60 px en Présentation), titre « Mes projets », grille de cartes adaptative alignée à gauche (TEC-93) avec visuel de remplacement, nom et date de modification au format français ; carte « Créer un projet » en pointillés, toujours en dernier ; message si aucun projet. Création par la fenêtre `CreateProjectDialog` (nom obligatoire, Entrée pour valider). Liste chargée avec `resource()` d'Angular. Ajouts : `provideFrenchLocale()` (`core/i18n/locale.ts`, dates en français), `withComponentInputBinding()` (paramètres de route en inputs), utilitaire de test `useTestRepository()` (vrai dépôt IndexedDB sur fake-indexeddb, base neuve par test), jetons `layout(card-thumb)` et `layout(card-create-min)`. Renommer / supprimer un projet : lot 5. Vérifié dans les deux thèmes.
- [x] **4.2** Ouverture d'un projet en mode Édition et en mode Présentation (navigation). [PRJ-03]
  - Note : ℹ️ Info : chaque carte de projet a « Éditer » (`/projects/:id/edit`) et « Présenter » (`/projects/:id/play`), avec un libellé d'accessibilité qui nomme le projet. Les écrans `EditorPage` et `GmScreenPage` reçoivent `projectId` comme input de route, chargent le projet avec `resource()` et affichent l'en-tête : retour aux projets, nom du projet, icône du mode (Édition / Présentation, nommée pour les lecteurs d'écran) et, en Édition, le bouton « Présenter ». Projet introuvable : message et lien de retour. Testé, et navigation vérifiée dans Chromium (accueil → Édition → Présentation → accueil).
- [x] **4.3** Éditeur minimal : création d'une scène unique, marquée première scène. [SCN-03]
  - Note : ℹ️ Info : service `EditorStore` (`ng g s features/editor/editor-store`), fourni par `EditorPage` (une instance par écran, `@Injectable()` sans `providedIn` ; exception voulue à `@Service()`, qui est global). Il charge le projet, l'arborescence et la scène ouverte (première scène, sinon la première de l'arborescence), et expose `status` (`loading` / `ready` / `missing`). Projet sans scène : message et bouton « Créer la première scène », qui crée le nœud et la scène, renseigne `Project.firstSceneId` et met à jour la date de modification du projet. Mise en page : volet gauche de 290 px avec l'arborescence en lecture seule (icône clap, pastille « 1re » sur la première scène), zone centrale avec le titre de la scène. Création d'autres scènes, dossiers, renommage : lot 7. Testé (store et écran) et vérifié dans Chromium.
- [x] **4.4** Champ texte de scène : création automatique de l'action « Texte de scène » à la première saisie, mise à jour ensuite. [SCN-05, SCN-06]
  - Note : ℹ️ Info : champ « Texte de scène » sous le titre de la scène (zone de texte, libellé réservé aux lecteurs d'écran, Brief §6.2). `EditorStore.setSceneText()` : la première saisie non vide crée l'action « Texte de scène » (déclencheur « ouverture de la scène », `isSceneText`, ordre 0, un élément « Ajouter un texte ») et la relie à la scène (`sceneTextActionId`) ; ensuite seul le texte du premier élément « Ajouter un texte » change (les autres éléments ajoutés plus tard sont conservés). Les écritures sont enchaînées une à une : une frappe rapide ne crée jamais deux actions. Le champ n'est initialisé qu'à l'ouverture de la scène : un enregistrement en retard ne peut pas écraser la saisie en cours. Testé (store, écran) et vérifié dans Chromium (frappe rapide puis rechargement).
- [x] **4.5** Enregistrement automatique des modifications. [—]
  - Note : ℹ️ Info : la saisie du texte de scène est enregistrée automatiquement 500 ms après la dernière frappe (`DebouncedTask`, `shared/util/debounced-task.ts` : seule la dernière valeur est écrite), et tout de suite à la sortie du champ, au changement de scène, en quittant l'écran et à la fermeture ou au rechargement de l'onglet (`beforeunload`). État affiché dans l'en-tête (« Modifications non enregistrées… », « Enregistrement… », « Enregistré », « Échec de l'enregistrement » en rouge, annoncé aux lecteurs d'écran). Chaque enregistrement met à jour la date de modification du projet. Testé, et vérifié dans Chromium : un rechargement 0 s après la frappe garde le texte. ⚠️ Alerte : à la fermeture brutale de l'onglet, le navigateur peut interrompre l'écriture IndexedDB en cours ; au pire, les 500 dernières millisecondes de frappe sont perdues.
- [x] **4.6** `ActionRunner` limité à l'élément « Ajouter un texte ». [TEC-50]
  - Note : ℹ️ Info : `ActionRunner` (`features/presentation/engine/action-runner.ts`, `@Injectable()` fourni par l'écran de Présentation, comme le moteur). `run(action, context, signal)` exécute les éléments dans l'ordre et vérifie l'annulation (`AbortSignal`) entre deux éléments : une scène quittée arrête ses actions. Le moteur fournit ce dont les éléments ont besoin par une interface `ActionContext` (pour l'instant `addText()`), ce qui garde le runner indépendant de l'interface et facile à tester. Seul « Ajouter un texte » est exécuté ; les autres types sont ignorés jusqu'au lot 9 (`switch` exhaustif, déjà prêt à les recevoir). Testé (ordre, types ignorés, annulation).
- [x] **4.7** `PresentationEngine` minimal : ouverture de la première scène, lancement des actions d'ouverture. [PRS-01]
  - Note : ℹ️ Info : `PresentationEngine` (`features/presentation/engine`, `@Injectable()` fourni par l'écran). `start(projectId)` ouvre la première scène (PRS-01), ou à défaut la première scène de l'arborescence dans l'ordre d'affichage ; états `loading` / `ready` / `missing` (projet introuvable) / `no-scene`. `openScene()` vide le fil puis lance les actions « à l'ouverture » : « Texte de scène » d'abord, puis par ordre ; les actions manuelles ne sont pas lancées. Le fil (`feed`, signal) ne stocke que des références ; `textOf(item)` relit le texte dans l'action et renvoie `null` si l'élément a été supprimé (affiché en erreur au lot 10, PRS-07). Un texte déjà présent n'est pas ajouté deux fois. Chaque scène a son `AbortController` : `stop()` interrompt ses actions. Pas encore de partie sauvegardée : la Présentation repart toujours de la première scène (lot 9). Testé (7 tests).
- [x] **4.8** Écran de Présentation minimal : fil d'actualité affichant le texte. [FIL-01, FIL-02]
  - Note : ℹ️ Info : l'écran `GmScreenPage` fournit `PresentationEngine` et `ActionRunner`, démarre le moteur à l'ouverture et l'arrête en quittant l'écran. En-tête Présentation (60 px) : retour, nom du projet › nom de la scène, icône du mode. Fil d'actualité : colonne centrée de 760 px au plus, chaque texte dans une carte (`--bg-card`, rayon 14, police Lora 20 px, retours à la ligne conservés) ajoutée sous les précédentes (FIL-02), zone annoncée aux lecteurs d'écran. Texte supprimé : message d'erreur à sa place (PRS-07) ; projet sans scène : message et lien « Éditer ». ⚠️ Alerte (corrigée) : une classe CSS `.play` de l'écran s'appliquait aussi à l'en-tête, qui a la même classe → en-tête de 300 px. La zone centrale s'appelle maintenant `.stage` et la variante de l'en-tête `.app-header--play`. Testé et vérifié dans Chromium dans les deux thèmes.
- [x] **4.9** Vérification : après rechargement du navigateur, le projet et la scène sont toujours là. [NF-10]
  - Note : ℹ️ Info : vérifié dans Chromium. Création d'un projet, d'une scène et d'un texte, puis fermeture de l'onglet et ouverture d'un nouvel onglet : le projet est sur l'accueil ; la scène (marquée « 1re ») et son texte sont dans l'éditeur ; ils sont toujours là après F5 ; le texte s'affiche en Présentation. Test unitaire ajouté : données écrites, base fermée puis rouverte par une nouvelle instance du dépôt → projet, scène et action retrouvés (NF-10).

**Critère de fin** : projet créé → texte de scène écrit → Présentation lancée → texte affiché dans le fil.

> ✅ Lot 4 validé : scénario complet vérifié dans Chromium, dans les deux thèmes (projet créé → première scène → texte saisi → Présentation → texte dans le fil, et toujours là après rechargement). `ng build`, `ng test` (175 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : composant partagé `app-header`, `EditorStore` (état de l'éditeur, fourni par l'écran), `DebouncedTask`, `provideFrenchLocale()`, utilitaire de test `useTestRepository()`. Pas de nouvelle dépendance.

---

## Lot 5 — Projets et paramètres

### 5.1 Accueil

- [x] **5.1.1** Grille de cartes adaptative (`auto-fill`, `minmax(320px, 1fr)`). [TEC-93]
  - Note : ℹ️ Info : déjà en place depuis 4.1 : `grid-template-columns: repeat(auto-fill, minmax(layout(card-min), 1fr))` (`card-min` = 320 px). Vérifié dans Chromium : 2 colonnes à 900 px, 3 à 1300 px, 5 à 1900 px ; avec peu de projets, les cartes gardent leur largeur et restent alignées à gauche (`auto-fill`, pas `auto-fit`).
- [x] **5.1.2** Carte de projet : vignette, nom, statistiques, date de modification, dernière scène jouée, boutons Éditer / Présenter. [PRJ-01]
  - Note : ℹ️ Info : composant `ProjectCard` (`features/projects/project-card`). Vignette : image de la battlemap par défaut de la première scène (sinon sa première battlemap), chargée par `MediaUrls.track()` ; à défaut, visuel de remplacement (les vraies images arriveront avec les battlemaps, lot 7). Contenu : nom ; statistiques « N scène(s) · N son(s) » (sons de la bibliothèque du projet), au singulier ou au pluriel grâce à `pluralKey()` (`core/i18n/plural.ts`, règle française : 0 et 1 au singulier) ; date de modification ; « Dernière scène jouée : … » si une partie est sauvegardée ; boutons Éditer / Présenter. Données calculées par `loadProjectSummary()` (`features/projects/project-summary.ts`) pour chaque projet. Testé (résumé, carte) et vérifié dans Chromium.
- [x] **5.1.3** Pastille « Partie en cours » si une partie est sauvegardée. [PRS-02]
  - Note : ℹ️ Info : pastille « Partie en cours » en haut à gauche de la vignette quand une partie est sauvegardée (`getPlaySession`). Nouvelle couleur de pastille `active` (couleurs « Actif » du Brief §2.5), vérifiée sur les thèmes Nuit et Automne.
- [x] **5.1.4** Carte « Créer un projet » en dernière position. [PRJ-01]
  - Note : ℹ️ Info : déjà en place depuis 4.1 (carte « Créer un projet » toujours en fin de grille) ; test complété pour vérifier qu'elle reste en dernière position quand des projets existent.
- [x] **5.1.5** Renommer un projet. [PRJ-01]
  - Note : ℹ️ Info : bouton « ⋯ » sur chaque carte (menu CDK, même style que l'arborescence) › Renommer. La fenêtre « Créer un projet » sert aussi au renommage (`data.name` pré-rempli, titre « Renommer le projet ») ; un nom identique ou une annulation n'écrit rien, sinon `updatedAt` est mis à jour (le projet remonte en tête de grille).
- [x] **5.1.6** Supprimer un projet avec confirmation (suppression en cascade). [PRJ-02, NF-31]
  - Note : ℹ️ Info : menu « ⋯ » › Supprimer (en rouge, après un séparateur) → confirmation destructive (« Supprimer le projet », focus sur Annuler) → `deleteProject` (cascade du lot 2 : scènes, actions, battlemaps, médias, partie sauvegardée) → grille rechargée et notification « Projet « … » supprimé. ». Les sons de la bibliothèque générale ne sont pas touchés.

### 5.2 Paramètres › Apparence

- [x] **5.2.1** Accès depuis l'en-tête (icône réglages). [NF-33]
  - Note : ✅ Décision : les Paramètres sont un écran à part (route `/settings`, chargée à la demande, `features/settings/settings-page` généré avec `ng g component`) plutôt qu'une modale, pour accueillir d'autres sections plus tard. Accès par l'icône réglages en haut à droite de l'accueil (`headerEnd`, libellé « Ouvrir les paramètres ») ; flèche retour vers l'accueil.
- [x] **5.2.2** Cartes d'aperçu des thèmes construites à partir des jetons de chaque thème. [NF-33, NF-34]
  - Note : ℹ️ Info : composant `ThemePreview` (fond, carte, titre, texte narratif, bouton principal, pastille « active ») qui pose `data-theme="<id>"` sur son hôte : le moteur de thèmes génère les variables sous `[data-theme]`, donc l'aperçu reprend les jetons du thème prévisualisé sans aucune valeur propre. Cartes en `radiogroup` (une par entrée de `THEMES`), thème actuel bordé d'accent avec « ✓ Thème actuel ». Hauteur d'aperçu = `layout(card-thumb)`, grille = `layout(card-min)` (pas de nouveau jeton).
- [x] **5.2.3** Changement immédiat et mémorisé ; vérifier qu'ajouter un thème ne demande qu'un fichier. [NF-35]
  - Note : ✅ Décision : un clic (ou les flèches, groupe radio WAI-ARIA avec tabindex itinérant) appelle `Theme.setTheme` : changement immédiat de `data-theme` sur `<html>`, mémorisé via `UiPreferences` (vérifié dans le navigateur : conservé après rechargement et sur l'accueil). La transmission à la fenêtre joueurs (`BroadcastChannel`, TEC-16) viendra avec cette fenêtre. ⚠️ Alerte : NF-35 est respecté pour les écrans (aucun écran à modifier), mais un nouveau thème demande en pratique 1 fichier SCSS + 3 branchements courts (`styles.scss`, `THEMES`/`ThemeId`, nom dans `fr.json`). `npm run check:themes` vérifie désormais ces branchements et signale précisément ce qui manque (testé avec un faux thème « foret »).

> ✅ Lot 5 validé : vérifié dans Chromium, dans les deux thèmes (pastille « Partie en cours », renommage, suppression avec confirmation et notification, Paramètres › Apparence avec changement de thème au clic et au clavier, conservé après rechargement). `ng build`, `ng test` (190 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : couleur de pastille `active`, `ProjectSummary` / `loadProjectSummary()`, `pluralKey()`, composant `ThemePreview`, route `/settings`, contrôle des branchements de thème dans `check:themes`. Pas de nouvelle dépendance.

---

## Lot 6 — Bibliothèques de sons

- [x] **6.1** Écran Sons et en-tête de navigation (Scènes / Sons du projet ; accès à la bibliothèque globale depuis l'accueil). [SON-01]
  - Note : ✅ Décision : un seul écran `SoundLibraryPage` pour deux routes : `/projects/:projectId/sounds` (sons du projet + bibliothèque globale, en-tête du mode Édition) et `/sounds` (bibliothèque globale seule, titre « Bibliothèque globale »). La route projet est ajoutée au TRD §2.3 de fait (elle n'y figurait pas). Navigation Scènes / Sons : composant partagé `ProjectNav` (`shared/project-nav`, `routerLinkActive` + `aria-current="page"`), placé dans l'en-tête de l'éditeur et de l'écran Sons, comme sur la maquette. Accès à la bibliothèque globale depuis l'accueil : bouton « Sons » dans l'en-tête, à gauche des réglages. Projet introuvable → message d'erreur avec retour aux projets.
- [x] **6.2** Arborescences « Ce projet » et « Bibliothèque globale » (composant générique, libellés propres aux sons). [SON-04, TEC-61] ✅ Décision (Allan, 11/11/2026) : les arborescences montrent désormais aussi les **sons** de chaque dossier (icône note de musique). Choisir un son ouvre son dossier et met sa ligne du tableau en évidence ; un son se renomme, se supprime (avec avertissement s’il est utilisé) et se déplace d’un dossier à l’autre par glisser-déposer dans l’arborescence (`SoundLibraryStore.select`, `selectedSoundId`, `move` sur tous les nœuds).
  - Note : ✅ Décision : comme sur la maquette, les arborescences n'affichent que les **dossiers** ; les sons du dossier ouvert iront dans le tableau (6.3). Une arborescence par bibliothèque (« Ce projet » puis « Bibliothèque globale » ; seulement la globale sur `/sounds`), avec un en-tête cliquable qui ouvre la racine et un bouton « Nouveau dossier » (créé puis passé en renommage). Créer un sous-dossier, renommer, supprimer (confirmation : « le dossier, ses sous-dossiers et tous les sons qu'il contient… ») et déplacer par glisser-déposer sont enregistrés par `SoundLibraryStore` (`@Injectable()` fourni par l'écran). Un déplacement ne renumérote que les dossiers. ℹ️ Info : deux petites entrées génériques ajoutées à `app-tree` (TEC-61) : `canCreateItems` (masque « Nouvel élément », les sons venant de l'import) et `folderTone` (icônes `--folder-global` pour la bibliothèque globale). ✅ Décision (Allan) : le nombre de sons à droite de chaque dossier, présent sur la maquette, n'est pas affiché ; ce n'est pas une information importante.
- [x] **6.3** Tableau des sons du dossier ouvert : nom, durée, format, « Utilisé dans ». [SON-03]
  - Note : ℹ️ Info : tableau du dossier ouvert (chemin « Ce projet › … » au-dessus du titre) avec Nom, Durée (`formatDuration`, ex. 12:40, « — » si inconnue), Format (`formatLabel`, ex. MP3) et « Utilisé dans » (« 2 actions » / « Non utilisé ») ; un fichier disparu est signalé « Fichier introuvable ». ⚠️ Alerte : ajouts au contrat de données (TRD §3 et §4.1 mis à jour en fin de lot) : `Media.durationMs?` (lue à l'import en 6.7), `getMediaInfo(ids)` (infos d'un média sans le `Blob`), `countSoundUsages()` (nombre d'actions qui lancent ou arrêtent chaque son, tous projets confondus, un seul parcours du store `actions`) et `uploadMedia(file, details?)`. Pas de changement de schéma IndexedDB (champ facultatif, pas d'index).
- [x] **6.4** Recherche dans la bibliothèque. [—]
  - Note : ℹ️ Info : champ « Rechercher un son » à droite du titre (maquette). Dès qu'on tape, le tableau montre les sons de **toutes** les bibliothèques affichées dont le nom contient le texte (sans tenir compte des accents ni des majuscules, `normalizeSearch`), triés par nom, avec leur emplacement sous le nom (« Ce projet › Ambiances ») ; titre « Résultats pour « … » », message si rien ne correspond. Échap vide le champ ; ouvrir un dossier quitte la recherche. Nouveau jeton de mise en page `layout(search)` = 280 px (largeur de la maquette).
- [x] **6.5** Import par le bouton « Importer des sons » (sélection multiple). [SON-02]
  - Note : ℹ️ Info : bouton « Importer des sons » (accent, à droite de la recherche) qui ouvre le sélecteur de fichiers (sélection multiple, `accept` = formats sons). `SoundLibraryStore.importFiles` importe dans le **dossier ouvert**, dans l'ordre choisi, à la suite des sons existants ; nom du son = nom du fichier sans extension (`soundName`). Formats refusés → même message que le calque de dépôt ; succès → « N sons importés dans « Dossier » ». Une erreur de stockage (quota) arrête l'import et s'affiche (`DataError`), les sons déjà importés restent. Bouton désactivé (« Import en cours… ») pendant l'import.
- [x] **6.6** Import par glisser-déposer depuis le disque (dossier ouvert = destination). [SON-06]
  - Note : ℹ️ Info : directive `appFileDrop` (lot 3) posée sur la zone principale de l'écran Sons, limitée aux sons ; calque plein écran avec le nombre de fichiers, la destination = dossier ouvert avec son chemin (« Bibliothèque globale › Météo ») et les formats acceptés. Au dépôt, même import que le bouton (6.5) ; les fichiers refusés sont signalés par la directive. Vérifié dans Chromium avec un vrai `DataTransfer`.
- [x] **6.7** Lecture de la durée des fichiers à l'import. [SON-03]
  - Note : ℹ️ Info : service `AudioDuration` (`core/media/audio-duration.ts`, généré avec `ng g s`) : un `<audio preload="metadata">` lit la durée sans jouer le fichier ; `null` si illisible, durée infinie ou au bout de 10 s ; l'URL temporaire est toujours libérée. La durée est lue juste avant `uploadMedia(file, { durationMs })` et enregistrée dans `Media.durationMs`. Vérifié dans Chromium avec de vrais fichiers WAV / OGG / MP3 (0:03, 1:15, 2:05). Les sons importés avant cette tâche gardent « — ».
- [x] **6.8** Renommer un son. [SON-03]
  - Note : ℹ️ Info : bouton crayon « Renommer « … » » en fin de ligne → le nom devient un champ (focus, texte sélectionné) ; Entrée ou sortie du champ enregistre un nom non vide et différent (`SoundLibraryStore.rename`, commun aux dossiers et aux sons), Échap annule. Le nouveau nom est visible partout où le son est référencé, puisque les éléments d'action pointent l'id du son, pas son nom. ℹ️ Info (11/11/2026) : nom et champ dans le sous-composant `SoundName` (`features/sound-library/sound-name`) ; pendant le renommage, le nom reste en place (masqué) et le champ se pose par-dessus en position absolue : la hauteur de la ligne et la largeur de la colonne ne changent plus (demande d'Allan). Sortir ce composant garde l'écran sous le budget de styles de 4 ko.
- [x] **6.9** Supprimer un son (confirmation, avertissement s'il est utilisé). [NF-31]
  - Note : ℹ️ Info : bouton corbeille en fin de ligne → confirmation destructive (« Supprimer « … » ? », focus sur Annuler). Si le son est utilisé, le message le précise : « Ce son est utilisé dans 3 actions : elles le signaleront comme introuvable… » (les éléments d'action ne sont pas modifiés, PRS-07). Suppression par `deleteSoundNode` (le fichier est effacé s'il n'est plus utilisé), puis notification « Son « … » supprimé. ». ✅ Décision (Allan) : il faut avertir dès qu'on supprime un son utilisé, y compris à travers un **dossier** : la confirmation de suppression d'un dossier indique alors « les sons qu'il contient (4) seront supprimés. Attention : 3 de ces sons sont utilisés dans des actions… » (`SoundLibraryStore.folderUsage` ; nouvelle entrée générique `deleteMessage` d'`app-tree` pour un message propre au nœud). Sans son utilisé, le message générique reste. ✅ Décision (Allan, 11/11/2026) : la confirmation se valide par **appui long de 3 s** sur « Supprimer » (`holdToConfirm: true` de `Modals.confirm()`, directive `appHoldToConfirm`) ; un clic simple affiche un message sous les boutons (`common.hold.tooShort`). ℹ️ Info : la suppression d'un son depuis le menu de l'arborescence (et celle d'un dossier) garde la confirmation par clic.
- [x] **6.10** Pré-écoute avec barre de progression (lecture simple). [SON-05]
  - Note : ℹ️ Info : service `SoundPreview` (`features/sound-library`, fourni par l'écran) : un seul `<audio>` à la fois, URL obtenue par `MediaUrls` et libérée à l'arrêt, à la fin du son, au changement de son ou en quittant l'écran. Bouton rond en tête de ligne (▶ / ■, `aria-pressed`), ligne en cours surlignée, barre de progression (`role="progressbar"`) sous le nom, comme sur la maquette. Fichier introuvable → bouton désactivé ; lecture refusée par le navigateur → notification. Supprimer le son en cours arrête la pré-écoute. ✅ Décision : lecture simple par `HTMLAudioElement`, sans Web Audio ; le lecteur de la Présentation (volume, boucle, fondus) reste au lot 9. Vérifié dans Chromium : la progression avance et s'efface à la fin du son.
- [x] **6.11** Test avec un projet volumineux (nombreux sons, longues ambiances) pour vérifier le quota. [Plan §6]
  - Note : ℹ️ Info : test dans Chromium (script Playwright) avec un projet de **132 sons / 276 Mo** générés par ffmpeg : 120 effets MP3 (5 à 24 s, 27 Mo), 8 ambiances OGG de 10 min (47 Mo) et 4 WAV de 5 min (4 × 53 Mo). Import des 120 MP3 en 2,4 s, des 12 longs fichiers en moins d'une seconde ; durées toutes lues (10:00, 5:00) ; rechargement + ouverture du dossier de 120 sons en 0,35 s ; recherche instantanée ; pré-écoute d'une ambiance de 10 min OK ; aucune erreur console. **Quota** simulé (CDP `Storage.overrideQuotaForOrigin`) : à 10 Mo, rien n'est importé et le message « Espace de stockage du navigateur insuffisant… » s'affiche ; à 60 Mo, le 1er WAV est importé puis l'import s'arrête proprement. ✅ Décision (correctif issu du test) : un import interrompu par le quota annonce désormais aussi les sons déjà importés (« 1 son importé… » + message de quota) : `importFiles` renvoie l'erreur dans `failure` au lieu de la lever. ⚠️ Alerte : `navigator.storage.estimate()` sous-estime nettement l'espace occupé par les `Blob` dans Chromium (21 Mo annoncés pour 212 Mo de WAV) : ne pas s'en servir pour afficher un espace restant fiable. ℹ️ Info : le bouton de pré-écoute est devenu un petit composant `ListenButton` (budget de 4 ko de styles par composant dépassé sinon).


> ✅ Lot 6 validé : écran Sons vérifié dans Chromium, dans les deux thèmes (navigation Scènes / Sons, arborescences des deux bibliothèques, tableau, recherche, import par bouton et par dépôt avec lecture de la durée, renommage, suppression avec avertissement, pré-écoute) et avec un projet de 276 Mo (6.11). `ng build` (sans avertissement de budget), `ng test` (229 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD, reportés dans le TRD (§2.3, §3, §4.1) : route `/projects/:projectId/sounds`, `Media.durationMs`, `getMediaInfo`, `countSoundUsages`, `uploadMedia(file, details)`. Autres ajouts : `ProjectNav`, `SoundLibraryStore`, `SoundPreview`, `ListenButton`, `AudioDuration`, `formatDuration`, `formatLabel`, entrées `canCreateItems` / `folderTone` / `deleteMessage` de `app-tree`, jeton `layout(search)`. Pas de nouvelle dépendance.
---

## Lot 7 — Éditeur de scène

### 7.1 Structure et arborescence

- [x] **7.1.1** Mise en page : en-tête, arborescence à gauche, zone centrale, volet droit défilant. [SCN-13, Brief §7]
  - Note : ℹ️ Info : l'éditeur a maintenant ses trois zones (Brief §7.1) : arborescence à gauche (290 px, en-tête « SCÈNES »), textes au centre, volet droit de 380 px (`--bg-panel`) qui défile indépendamment et contient les trois parties repliables, ouvertes par défaut : Actions, Battlemaps, Enchaînement (contenus aux tâches 7.3.x). Le volet n'apparaît que quand une scène est ouverte. Zones nommées pour les lecteurs d'écran (« Scènes du projet », « Textes de la scène », « Configuration de la scène »).
- [x] **7.1.2** Arborescence des scènes : dossiers, scènes, boutons Nouveau dossier / Nouvelle scène. [SCN-01, SCN-08]
  - Note : ✅ Décision : comme un clic sur un dossier le plie / déplie sans le sélectionner (SCN-10), « le dossier sélectionné » de SCN-08 est **le dossier de la scène ouverte** (racine sinon). Boutons Nouveau dossier / Nouvelle scène en haut de l'arborescence ; l'élément est créé en dernière position puis passe en renommage ; une nouvelle scène est ouverte (et devient première scène si le projet n'en a pas). Arborescence désormais modifiable (menu ⋯ / clic droit, glisser), affichée dès qu'il y a un nœud, même un dossier vide. Première scène signalée par une étoile pleine (maquette) au lieu de la pastille « 1re ». Logique dans `EditorStore.createNode` / `creationParent`.
- [x] **7.1.3** Menu des scènes : renommer, définir comme première scène (étoile), supprimer ; menu des dossiers. [SCN-03, SCN-09, SCN-11]
  - Note : ℹ️ Info : menu ⋯ / clic droit de l'arborescence branché (SCN-09) : dossier → Nouvelle scène, Nouveau sous-dossier, Renommer, Supprimer ; scène → Renommer, Définir comme première scène (masquée si elle l'est déjà ; l'étoile se déplace), Supprimer. Suppression confirmée par l'arborescence (le message d'un dossier précise son contenu) puis `deleteSceneNode` (cascade du lot 2 : battlemaps, actions, références) ; si la scène ouverte disparaît, l'éditeur ouvre la première scène restante. Chaque modification met à jour la date du projet. ℹ️ Info : les entrées propres au parent (« Définir comme première scène ») n'ont pas d'icône dans le menu ; l'arborescence n'en prévoit pas pour l'instant.
- [x] **7.1.4** Déplacement et réordonnancement par glisser-déposer. [SCN-02]
  - Note : ℹ️ Info : le glisser-déposer de l'arborescence (lot 3) est branché : `EditorStore.moveNode` applique `applyMove` et enregistre en une fois les nœuds dont le parent ou le rang change. Vérifié dans Chromium à la souris : « Le marché » glissé dans « Acte II » (à la fin), « La lisière » glissée avant « Arrivée au village » ; l'ordre est conservé après rechargement.
- [x] **7.1.5** (Optionnel) Dupliquer une scène avec ses battlemaps et actions. [SCN-12]
  - Note : ℹ️ Info : fait (optionnel). Menu d'une scène › Dupliquer : « Nom (copie) » placée juste après l'original et ouverte. Copie de la scène, de ses battlemaps (même image, non recopiée : le média partagé n'est effacé que s'il n'est plus utilisé), de ses actions et de leurs éléments, tous avec de nouveaux identifiants ; « Afficher une battlemap », battlemap par défaut et action « Texte de scène » pointent les copies ; scènes suivantes et cibles de « Changer de scène » inchangées. `EditorStore.duplicateScene`.

### 7.2 Zone centrale

- [x] **7.2.1** Titre de la scène (modifiable). [—]
  - Note : ℹ️ Info : le titre de la scène est un champ qui se lit comme un titre (Cinzel, taille « écran ») ; le cadre n'apparaît qu'au survol et au focus. Entrée ou sortie du champ renomme la scène (`renameNode`, l'arborescence suit), Échap rétablit le nom, un titre vide est refusé. Libellé d'accessibilité « Nom de la scène ».
- [x] **7.2.2** Champ texte de scène sans libellé visible (libellé d'accessibilité). [SCN-05]
  - Note : ℹ️ Info : déjà en place depuis 4.4 : premier champ de la zone centrale, sans libellé visible (`app-field` avec `hiddenLabel` : libellé « Texte de la scène » réservé aux lecteurs d'écran, texte indicatif dans le champ), enregistré automatiquement ; la première saisie crée l'action « Texte de scène ». Test existant (`editor-page.spec` 4.4) qui vérifie le libellé masqué.
- [x] **7.2.3** Textes des actions : un champ modifiable par élément « Ajouter un texte », avec pastille du nom de l'action. [SCN-07]
  - Note : ℹ️ Info : sous le texte de scène, un champ par élément « Ajouter un texte » des actions de la scène (ordre : actions d'ouverture, « Texte de scène » en tête, puis actions sur clic du MJ ; puis ordre des éléments), surmonté d'une pastille au nom de l'action, sans autre titre (SCN-07) ; libellé d'accessibilité « Texte de l'action « … » ». Le texte de scène n'est pas répété ; un 2ᵉ texte de l'action « Texte de scène » apparaît, lui, avec sa pastille. Enregistrement automatique généralisé dans `EditorStore` : saisies en attente par champ, une seule temporisation de 500 ms, `flush()` à la sortie du champ / au changement de scène ; valeurs initiales figées à l'ouverture (`initialTexts`). Les actions sont maintenant chargées dans `store.actions()` (`sortActions`), dont `sceneTextAction` est dérivée. ✅ Décision (Allan) : la pastille du nom de l'action est remplacée par un sous-titre `<h3 class="action-title">` (police des titres, `font-size(dialog)`, plus petit que le titre de la scène, qui est le `<h2>`).

### 7.3 Volet droit

- [x] **7.3.1** Partie Actions : liste par déclencheur, résumé des éléments, action « Texte de scène » verrouillée, bouton « Nouvelle ». [SCN-06, SCN-13]
  - Note : ℹ️ Info : composant `ActionsPanel` (`features/editor/actions-panel`, partage l'`EditorStore` de l'écran). Actions rangées sous « À l'ouverture de la scène » (« Texte de scène » en tête, cadenas « ne peut pas être supprimée ») puis « Sur clic du MJ » ; chaque carte : icône du déclencheur, nom, « 2 éléments · texte, lancer « Taverne animée » » (`action-summary.ts` : noms des sons, battlemaps et scènes visés). Une cible supprimée (son, battlemap, scène) est signalée : carte bordée de rouge, icône d'alerte, « scène supprimée » en rouge (PRS-07, décision d'Allan). Nombre d'actions dans l'en-tête (« · 5 »). ✅ Décision : le bouton « Nouvelle » est présent mais **désactivé** jusqu'au lot 8 (il ouvrira l'éditeur d'action, 8.1.1) ; les cartes ne s'ouvrent pas encore non plus. ⚠️ Alerte : budget du bundle initial relevé de 500 à **600 ko** (avertissement ; erreur toujours à 1 Mo) dans `angular.json` : toutes les icônes Lucide utilisées, même dans les écrans chargés à la demande, finissent dans le bundle principal (506 ko bruts, 108 ko transférés).
- [x] **7.3.2** Réordonner les actions d'un même déclencheur. [—]
  - Note : ℹ️ Info : chaque groupe (ouverture / clic du MJ) est une liste CDK : on glisse une action par sa poignée (⋮⋮) à l'intérieur de son groupe ; « Texte de scène » n'a pas de poignée et reste en tête (`EditorStore.reorderAction` borne la position). Les `order` de toutes les actions de la scène sont renumérotés et seuls ceux qui changent sont enregistrés ; les textes de la zone centrale suivent le nouvel ordre. Vérifié dans Chromium à la souris, ordre conservé après rechargement. ⚠️ Alerte : pas encore d'alternative au clavier pour réordonner (le CDK ne la fournit pas) ; à prévoir si besoin (boutons Monter / Descendre).
- [x] **7.3.3** Partie Battlemaps : miniatures en grille, badge « Par défaut ». [BTM-02]
  - Note : ℹ️ Info : composants `BattlemapsPanel` (partie « Battlemaps », nombre dans l'en-tête) et `BattlemapCard` (miniature 16:10 via `MediaUrls.track`, nom, badge « Par défaut » et bordure d'accent pour la battlemap par défaut ; image disparue → visuel de remplacement + « Image introuvable »). Grille de deux colonnes comme sur la maquette ; message quand la scène n'a pas encore de battlemap. Les battlemaps de la scène ouverte sont chargées dans `EditorStore.battlemaps()` (elles servent aussi au résumé des actions).
- [x] **7.3.4** Import d'images par bouton et par glisser-déposer sur l'éditeur. [BTM-01, BTM-04]
  - Note : ℹ️ Info : bouton « Importer » dans l'en-tête de la partie Battlemaps (sélecteur d'images, sélection multiple) et dépôt de fichiers sur tout l'éditeur (`appFileDrop` limité aux images, calque « Destination : Scène « Le marché » », désactivé sans scène ouverte). `EditorStore.importBattlemaps` ajoute les images à la scène ouverte à la suite des autres (nom = fichier sans extension, `baseName` partagé désormais avec les sons) ; si la scène n'avait pas de battlemap par défaut, la première importée le devient. Formats refusés et quota : mêmes messages que pour les sons ; succès : « 1 battlemap ajoutée à « Le marché » ». Vérifié dans Chromium (sélecteur + vrai `DataTransfer`).
- [x] **7.3.5** Définir la battlemap par défaut, renommer, supprimer une battlemap. [BTM-02]
  - Note : ℹ️ Info : bouton ⋯ sous chaque miniature : Définir par défaut (masqué pour celle qui l'est déjà), Renommer (nom modifiable sur place, Entrée / sortie du champ enregistre, Échap annule), Supprimer (confirmation destructive). ✅ Décision : comme pour les sons (règle d'Allan), la suppression **avertit** si des actions de la scène affichent la battlemap (« Cette battlemap est affichée par 1 action, qui la signalera comme introuvable ») ; ces éléments ne sont pas modifiés (PRS-07). ✅ Décision : si la battlemap supprimée était celle par défaut, la première restante le devient (BTM-02 : une scène qui a des battlemaps en a toujours une par défaut). `EditorStore.setDefaultBattlemap` / `renameBattlemap` / `deleteBattlemap` / `battlemapUsage`.
- [x] **7.3.6** Partie Enchaînement : case « Première scène du projet ». [SCN-03]
  - Note : ℹ️ Info : composant `SequencePanel` (partie « Enchaînement »). Case « Première scène du projet » : cochée → la scène ouverte devient la première scène (l'étoile se déplace dans l'arborescence) ; décochée → le projet n'a plus de première scène (la Présentation ouvrira alors la première de l'arborescence, comme au lot 4). Même `EditorStore.setFirstScene` que le menu de l'arborescence.
- [x] **7.3.7** Scènes suivantes : pastilles, retrait, « + Ajouter » ouvrant la fenêtre de sélection multiple. [SCN-04]
  - Note : ℹ️ Info : pastilles des scènes suivantes avec « × » (libellé « Retirer : Le marché »), puis « + Ajouter » qui ouvre la fenêtre de sélection multiple du lot 3 (titre « Scènes suivantes », « Après « … » », suivantes pré-cochées, scène actuelle grisée « scène actuelle »). Valider remplace la liste : l'ordre des scènes gardées est conservé, les nouvelles s'ajoutent à la fin (`EditorStore.setNextScenes`). Une scène suivante qui n'existe plus est affichée « Scène supprimée » en rouge (PRS-07) et peut être retirée.
- [x] **7.3.8** État plié / déplié des parties mémorisé comme préférence. [SCN-13, TEC-62]
  - Note : ℹ️ Info : les trois parties portent une clé de préférence (`editor.actions`, `editor.battlemaps`, `editor.sequence`) : `app-collapsible-section` (lot 3) mémorise l'état plié / déplié via `UiPreferences` (TEC-62) ; il vaut pour tous les projets et toutes les scènes. Testé : une partie repliée le reste en rouvrant l'éditeur.
- [x] **7.3.9** Vérifier le rendu dans les deux thèmes. [Brief §11]
  - Note : ℹ️ Info : éditeur complet vérifié dans Chromium dans les deux thèmes (Nuit dorée et Automne) : arborescence (étoile, sélection, menus), titre modifiable, textes et pastilles, volet Actions (groupes, cadenas, poignées, « Nouvelle » désactivée lisible), Battlemaps (badge, bordure par défaut, menus, confirmation), Enchaînement (case, pastilles, « + Ajouter », fenêtre de sélection), calque de dépôt d'images. Aucune couleur en dur (Stylelint), aucune erreur console.


> ✅ Lot 7 validé : éditeur de scène vérifié dans Chromium, dans les deux thèmes, avec un projet de démonstration (3 actes, 5 scènes, actions, battlemaps, sons). `ng build` (sans avertissement, budget initial relevé à 600 ko, cf. 7.3.1), `ng test` (258 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts : `EditorStore` étendu (arborescence, duplication, textes d'action, actions, battlemaps, enchaînement), composants `ActionsPanel`, `BattlemapsPanel`, `BattlemapCard`, `SequencePanel`, `action-summary.ts`, `baseName()`. Restent pour le lot 8 : bouton « Nouvelle » et ouverture d'une action. Pas de nouvelle dépendance.
---

## Lot 8 — Éditeur d'action

### 8.1 Fenêtre d'édition

- [x] **8.1.1** Fenêtre modale : nom, déclencheur (contrôle segmenté), Annuler / Enregistrer. [ACT-01, ACT-02]
  - Note : ℹ️ Info : composant `ActionEditor` (`features/editor/action-editor`), ouvert en fenêtre de 900 px (`Modals.open`, `size: 'lg'`) par le bouton « Nouvelle » (désormais actif) ou par le nom d'une action dans le volet. En-tête « Modifier l'action » / « Nouvelle action » + « Scène : … » ; nom (obligatoire) et déclencheur (contrôle segmenté « Ouverture de la scène » / « Clic du MJ ») côte à côte ; Annuler / Enregistrer. La fenêtre travaille sur une copie et n'écrit rien : elle renvoie le résultat, enregistré par `EditorStore.saveAction` (nouvelle action à la fin, champs de texte de la zone centrale mis à jour) puis notification « Action « … » enregistrée. ». ✅ Décision : « Texte de scène » garde toujours le déclencheur « Ouverture de la scène » (contrôle désactivé + explication). ✅ Décision : fermeture seulement par Annuler / × / Enregistrer (pas par Échap ni clic à côté), pour ne pas perdre une saisie ; Annuler abandonne sans confirmation.
- [x] **8.1.2** Suppression de l'action (confirmation ; impossible pour « Texte de scène »). [SCN-06, NF-31]
  - Note : ℹ️ Info : « Supprimer l'action » en bas à gauche (bouton danger, Brief §6.9), absent pour une nouvelle action et pour « Texte de scène » ; confirmation destructive (« Supprimer « Bagarre » ? », focus sur Annuler) puis `EditorStore.deleteAction` (qui refuse de toute façon « Texte de scène ») et notification « Action « … » supprimée. ». Les textes de l'action disparaissent de la zone centrale.
- [x] **8.1.3** Formulaire pilote en Signal Forms pour valider l'approche avant les 8 types. [TEC-06, Plan §6]
  - Note : ✅ Décision : approche Signal Forms validée sur le formulaire de l'action (nom + déclencheur), à reprendre pour les 8 types. Enseignements : (1) modèle = `signal` d'une **copie de travail** + `form(draft, schema)` ; (2) validation dans le schéma : `validate()` pour « obligatoire » (refuse aussi les espaces seuls, que `required()` laisse passer), `maxLength()` (l'attribut `maxlength` est **interdit** sur un champ `[formField]`, erreur NG8022) ; (3) `disabled(path, () => …)` se transmet tout seul à un contrôle maison qui a une entrée `disabled` (`app-segmented-control`, `FormValueControl`) ; (4) messages d'erreur = **clés de traduction** affichées avec le pipe ; (5) `[formField]` ne pose pas `aria-invalid` : l'ajouter nous-mêmes ; (6) erreurs montrées après `markAsTouched()` (sortie du champ ou Enregistrer). Tests unitaires OK en zoneless (`TestBed.tick()`).

### 8.2 Liste des éléments

- [x] **8.2.1** Liste ordonnée réordonnable par glisser-déposer (poignée). [ACT-03]
  - Note : ℹ️ Info : les éléments sont une liste ordonnée CDK (`cdkDropList`, axe vertical) ; on les déplace par la poignée ⋮⋮ de chaque carte (`cdkDragHandle` dans `ElementCard`). Le déplacement modifie la copie de travail, enregistrée avec « Enregistrer ». Numéros recalculés ; mention « Glisser pour réordonner » dès 2 éléments. Vérifié dans Chromium à la souris (5ᵉ élément ramené en tête, ordre conservé après enregistrement et rechargement). ⚠️ Alerte : comme pour les actions (7.3.2), pas encore d'équivalent au clavier pour réordonner.
- [x] **8.2.2** Carte d'élément dépliable : icône et couleur du type, résumé replié, boutons Supprimer / Replier. [ACT-03, Brief §2.6]
  - Note : ℹ️ Info : composant `ElementCard` (`features/editor/element-card`) : poignée, numéro, pastille d'icône aux couleurs du type (jetons `--el-*`, Brief §2.6), nom du type, résumé replié (`describeElement` : texte saisi, nom du son / de la battlemap / de la scène, « 2 s » ; « Texte à saisir », « À choisir » ou « Supprimé » en italique), boutons Supprimer et Déplier / Replier (`aria-expanded`, libellés « …l'élément 2 « Lancer un son » »). Dépliée : bordure d'accent et formulaire projeté (`<ng-content>`). ℹ️ Info : en attendant les formulaires (8.3), une carte dépliée affiche « Les réglages de cet élément arrivent avec les formulaires des éléments. » ✅ Décision (Allan) : un clic n'importe où sur l'en-tête déplie / replie la carte (pas seulement la flèche) : la zone de clic du bouton flèche (`.card__toggle::after`) couvre l'en-tête, poignée et Supprimer passent au-dessus ; le bouton reste le seul élément focalisable (clavier inchangé). Non testable dans jsdom (pas de calcul de position).
- [x] **8.2.3** Menu « Ajouter un élément » (8 types). [ACT-03]
  - Note : ℹ️ Info : bouton « + Ajouter un élément » (pointillés) qui ouvre un menu CDK de deux colonnes avec les 8 types, chacun avec sa pastille de couleur, dans l'ordre des spécifications (battlemap, lancer / arrêter un son, arrêter tous les sons, texte, changer de scène, attendre, clic). L'élément est ajouté à la fin, déplié, avec ses valeurs par défaut (`newElement` dans `element-types.ts` : attente 1 s, volume 100 %, cibles vides à choisir).

### 8.3 Formulaires des éléments

- [x] **8.3.1** Afficher une battlemap : choix par miniature. [ACT-04]
  - Note : ℹ️ Info : composant `ElementForm` (`features/editor/element-form`), projeté dans la carte dépliée de l'éditeur d'action ; un `@switch` par type d'élément, chaque modification renvoie l'élément mis à jour (`elementChange`). Battlemap : miniatures `BattlemapCard` des battlemaps de la scène, choix par bouton radio (cadre d'accent sur la sélection). Message si la scène n'a pas de battlemap, avertissement si la battlemap choisie a été supprimée.
- [x] **8.3.2** Lancer un son : sélecteur de son (fenêtre de sélection), volume, boucle, fondus. [ACT-05]
  - Note : ℹ️ Info : Signal Forms (`form()` sur un `linkedSignal` des champs) : volume en % (curseur 0–100, pas de 5), boucle, fondus en secondes (pas de 0,5) ; l'élément les stocke de 0 à 1 et en ms. Choix du son dans la fenêtre de sélection (mode unique) sur les deux bibliothèques, rangées sous deux dossiers racines « Ce projet » puis « Bibliothèque globale » (`sound-choice.ts` : `soundChoiceNodes`, `soundPath`) ; le bouton affiche l'emplacement du son (« Ce projet › Combat ») ou « Son supprimé ». ✅ Décision : une valeur invalide (vide, hors bornes) affiche son erreur sous le champ mais n'est pas reportée dans l'élément, qui garde sa dernière valeur valide. ⚠️ Alerte : le fond des fenêtres est opaque (`--bg-backdrop`) ; une fenêtre ouverte depuis une autre masquait l'éditeur d'action. Les fonds suivants sont désormais transparents (`styles/components/_overlay.scss`).
- [x] **8.3.3** Arrêter un son : sélecteur de son, aide sur le fondu. [ACT-06]
  - Note : ℹ️ Info : même sélecteur de son que 8.3.2 (« Son à arrêter »), aide : « Le son s'arrête avec le fondu de sortie défini à son lancement. » ; son supprimé signalé en rouge.
- [x] **8.3.4** Arrêter tous les sons : texte explicatif. [ACT-07]
  - Note : ℹ️ Info : pas de champ, texte explicatif seul.
- [x] **8.3.5** Ajouter un texte : zone de texte. [ACT-08]
  - Note : ℹ️ Info : zone de texte (3 lignes) « Texte ajouté au fil d'actualité ».
- [x] **8.3.6** Changer de scène : sélection unique de la scène cible + avertissement ; si la scène cible a été supprimée, l'élément est signalé (« Scène supprimée ») et le MJ peut en choisir une autre. [ACT-09, PRS-07]
  - Note : ℹ️ Info : fenêtre de sélection unique sur l'arbre des scènes, scène actuelle grisée (« scène actuelle »). Le bouton affiche le chemin de la scène (« Acte I › Le marché ») ; une scène supprimée est signalée « Scène supprimée » (PRS-07) et le MJ peut en choisir une autre. Avertissement permanent : « Les éléments placés après celui-ci ne seront pas exécutés. » Vérifié dans Chromium : choix, enregistrement, résumé « aller à « Le marché » » dans le volet Actions.
- [x] **8.3.7** Attendre : durée en secondes (nombre positif). [ACT-10]
  - Note : ℹ️ Info : champ numérique (pas de 0,5) suivi de « secondes » ; 0, négatif ou vide : « Indiquez une durée positive, en secondes. »
- [x] **8.3.8** Clic de l'utilisateur : texte obligatoire. [ACT-11]
  - Note : ℹ️ Info : zone de texte obligatoire (« (obligatoire) », `aria-invalid`), aide sur l'arrêt jusqu'au clic « Continuer ». ⚠️ Alerte : l'erreur s'affiche quand le champ a été quitté, mais n'empêche pas encore l'enregistrement de l'action : c'est la validation globale prévue en 8.4.1. ℹ️ Info : 10 tests (`element-form.spec.ts`) ; suite complète 282 tests OK, lint, stylelint, Prettier et build sans avertissement.

### 8.4 Validation et finitions

- [x] **8.4.1** Validation globale (champs obligatoires, valeurs numériques) avant enregistrement. [—]
  - Note : ℹ️ Info : « Enregistrer » vérifie le nom et **tous** les éléments (`elementProblem()`, `features/editor/element-validation.ts`, + champs saisis invalides de chaque `ElementForm`). Bloquant : battlemap, son ou scène cible jamais choisis, texte du clic vide, durée d'attente ≤ 0, volume hors 0–100, fondu négatif. En cas d'erreur : rien n'est renvoyé, les cartes à corriger sont dépliées et bordées de rouge (`ElementCard` entrée `invalid`), chaque erreur s'affiche sous son champ (« Choisissez un son. »…), un message apparaît à côté des boutons (« Corrigez les éléments signalés avant d'enregistrer. », `role=alert`) et le focus va au premier champ en erreur. Les signalements disparaissent dès la correction. ✅ Décision : une cible **supprimée** (scène, son, battlemap) n'empêche pas l'enregistrement : elle reste signalée (PRS-07, décision d'Allan) ; seule une cible jamais choisie bloque. ⚠️ Alerte : Signal Forms marque les objets des listes d'une clé `Symbol` ; l'éditeur renvoie une copie (`structuredClone`). ℹ️ Info : pied des fenêtres : contenus alignés verticalement (`modal.scss`).
- [x] **8.4.2** Mise à jour immédiate de la zone centrale et du volet de l'éditeur de scène après enregistrement. [SCN-07]
  - Note : ℹ️ Info : déjà assuré par `EditorStore.saveAction` (mise à jour du signal `actions`, dont dérivent les textes d'action du centre et le volet). Test ajouté dans `editor-page.spec.ts` : une action sans élément reçoit un « Ajouter un texte » dans l'éditeur ; après « Enregistrer », le centre affiche le nouveau champ avec la pastille de l'action et le volet « 1 élément · texte », sans rechargement.
- [x] **8.4.3** Vérifier le rendu dans les deux thèmes. [Brief §11]
  - Note : ℹ️ Info : éditeur d'action vérifié dans Chromium en Nuit dorée et Automne : formulaires des 8 types, fenêtres de choix (son, scène) au-dessus de l'éditeur, état « à corriger » (bordure, messages, pied de fenêtre). Aucune erreur de console.
- [x] **8.4.4** Jalon J3 : saisir un scénario de test (≥ 10 scènes, battlemaps, sons, actions). [PRD §7]
  - Note : ℹ️ Info : scénario « Les Ombres de Valombre » saisi **entièrement par l'interface** dans Chromium (script Playwright qui clique comme un utilisateur) : projet créé depuis l'accueil, 5 sons importés dans le projet et 2 dans la bibliothèque globale, 3 actes et 11 scènes créés et nommés dans l'arborescence, 11 textes de scène, 12 battlemaps importées, 15 actions (6 à l'ouverture, 9 sur clic du MJ ; 37 éléments des 8 types, sons choisis dans les deux bibliothèques), 12 enchaînements. Après rechargement : tout est relu (11 scènes, 26 actions dont les 11 « Texte de scène », 48 éléments, aucune référence cassée), carte de l'accueil « 11 scènes · 5 sons ». Aucune erreur de console. ℹ️ Info : la carte de l'accueil ne compte que les sons du projet, pas ceux de la bibliothèque globale.


> ✅ Lot 8 validé : éditeur d'action complet (nom, déclencheur, éléments réordonnables, formulaires des 8 types, validation globale) vérifié dans Chromium dans les deux thèmes ; jalon **J3** atteint avec un scénario de 11 scènes saisi par l'interface (cf. 8.4.4). `ng build` (sans avertissement), `ng test` (289 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Ajouts : `ActionEditor`, `ElementCard`, `ElementForm`, `element-types.ts`, `element-validation.ts`, `sound-choice.ts` ; fenêtres empilées (fond opaque sur la première seulement). Pas de nouvelle dépendance, rien à faire côté Allan. Pas d'écart au TRD.
---

## Lot 9 — Moteur de présentation et audio (sans interface)

### 9.1 ActionRunner

- [x] **9.1.1** Exécution séquentielle des éléments, signal d'annulation (`AbortController`). [TEC-50, TEC-51]
  - Note : ℹ️ Info : `ActionRunner.run(action, context, signal)` exécute les éléments dans l'ordre et renvoie un `RunOutcome` (`done` ou `change-scene`). L'annulation du signal (scène quittée) rejette la promesse entre deux éléments, pendant une attente ou un clic ; l'action n'est alors pas marquée effectuée. Le contrat `ActionContext` (`addText`, `showBattlemap`, `playSound`, `stopSound`, `stopAllSounds`, `waitForUserClick`, `canChangeScene`, `markDone`) est fourni par le moteur : chaque méthode applique et enregistre l'événement. Utilitaire `delay(ms, signal)` (`shared/util/delay.ts`). ℹ️ Info : écart de forme au TRD §6.2 : le runner ne fait pas lui-même `engine.goToScene()` ; il renvoie la scène cible et le moteur l'ouvre (évite qu'une action annule son propre signal).
- [x] **9.1.2** Éléments Ajouter un texte (sans doublon à la relance) et Afficher une battlemap. [ACT-04, ACT-08, CTL-03]
  - Note : ℹ️ Info : « Ajouter un texte » : ajouté sous les éléments existants ; s'il est déjà dans le fil (relance), pas de doublon, le moteur pose `focus` sur lui. « Afficher une battlemap » : battlemap affichée + miniature dans le fil. ✅ Décision : afficher la battlemap **déjà affichée** n'ajoute pas de miniature en double ; la battlemap par défaut à l'ouverture d'une scène n'est pas ajoutée au fil (ce n'est pas un « changement »).
- [x] **9.1.3** Éléments sonores : lancer, arrêter, arrêter tous. [ACT-05 à 07]
  - Note : ℹ️ Info : lancer (paramètres de l'élément : volume, boucle, fondus), arrêter (fondu de sortie défini au lancement), arrêter tous (chacun avec son fondu). Le chargement d'un son n'est pas attendu : l'action continue. ✅ Décision : un même son ne joue qu'une fois à la fois ; le relancer remplace la lecture en cours.
- [x] **9.1.4** Attendre (annulable). [ACT-10]
  - Note : ℹ️ Info : `delay(seconds × 1000, signal)`, rejetée dès l'annulation (testé avec des minuteurs simulés).
- [x] **9.1.5** Clic de l'utilisateur : promesse résolue au clic, rejetée à l'annulation. [ACT-11, FIL-05]
  - Note : ℹ️ Info : le moteur ajoute un bloc `user-click` (`validated: false`) au fil et garde la promesse ; `engine.continueClick(itemId)` le valide, l'enregistre et reprend l'action. À l'annulation la promesse est rejetée. ✅ Décision : un bloc en attente créé par l'action interrompue est **retiré du fil** (l'action n'est pas effectuée et pourra être relancée) ; à la relance d'une action, son bloc déjà présent est réutilisé (pas de doublon). Un bloc resté en attente après une fermeture brutale est retiré à la reprise.
- [x] **9.1.6** Changer de scène (fin de l'action). [ACT-09]
  - Note : ℹ️ Info : l'élément termine l'action (éléments suivants ignorés, ACT-09) ; l'action est marquée effectuée puis la scène cible s'ouvre (sans attendre la fin de ses propres actions). Scène cible supprimée : message « La scène cible de « Changer de scène » a été supprimée : la scène ne change pas. » et l'action se termine (PRS-07).
- [x] **9.1.7** Marquage des actions effectuées et relance. [CTL-01 à 03]
  - Note : ℹ️ Info : `markDone` en fin d'action (aussi pour les actions d'ouverture et « Texte de scène ») → `doneActionIds` de la scène, enregistré. `engine.runAction(id)` lance ou relance ; une action déjà en cours ne se lance pas deux fois (`runningActionIds`). `manualActions` expose `{ action, done, running }` pour l'écran (CTL-01 à 03).

### 9.2 PresentationEngine

- [x] **9.2.1** Ouverture d'une scène jamais visitée : battlemap par défaut, actions d'ouverture dans l'ordre (« Texte de scène » en premier). [TRD §6.3]
  - Note : ℹ️ Info : `openScene(id)` : état neuf (`visited`, battlemap par défaut), puis actions d'ouverture une par une dans l'ordre, « Texte de scène » en premier ; si l'une change de scène, les suivantes ne sont pas lancées. Démarrage : `load(projectId)` charge projet, scènes, sons des deux bibliothèques et partie sauvegardée ; sans partie → première scène (PRS-01).
- [x] **9.2.2** Quitter une scène : annulation des actions, sons coupés en fondu, sauvegarde. [CTL-06]
  - Note : ℹ️ Info : quitter = `abort()` du contrôleur de la scène (attente, clic, actions en cours), puis `AudioPlayer.stopAll()` (fondu de chaque son), `currentSceneId` enregistré. Les sons de la scène quittée restent dans son `playingSounds` sauvegardé, pour être relancés au retour (TRD §6.3).
- [x] **9.2.3** Retour sur une scène visitée : restauration de l'état sans relancer les actions d'ouverture. [PRS-06]
  - Note : ℹ️ Info : scène déjà visitée : fil, battlemap, actions effectuées restaurés ; actions d'ouverture **non** relancées ; sons relancés depuis le début avec leur volume et leur pause (paramètres relus dans l'élément `play-sound`, ou par défaut pour un son lancé à la main).
- [x] **9.2.4** Changement de battlemap (action ou sélecteur) et ajout au fil. [FIL-03, CTL-07]
  - Note : ℹ️ Info : `engine.showBattlemap(id)` (sélecteur CTL-07) et l'élément « Afficher une battlemap » passent par le même chemin : battlemap courante + miniature au fil + enregistrement + `focus`.
- [x] **9.2.5** Signals exposés : scène, fil, battlemap, actions disponibles / effectuées, sons. [TRD §6.1]
  - Note : ℹ️ Info : signals : `status` (`loading` / `choose` / `ready` / `missing` / `no-scene`), `project`, `sceneNodes`, `soundNodes`, `scene`, `sceneNode`, `battlemaps`, `shownBattlemap` (`battlemap: null` si supprimée), `feed`, `focus` (entrée à montrer, FIL-06), `actions`, `manualActions`, `doneActionIds`, `runningActionIds`, `nextScenes`, `sounds`, `anyPlaying`, `savedSession`. Commandes : `runAction`, `continueClick`, `showBattlemap`, `openScene`, `playLibrarySound`, `pauseSound` / `resumeSound`, `setVolume`, `togglePlayback`, `stop`. ⚠️ Alerte : dans `GmScreenPage`, l'`effect` qui démarre le moteur doit l'appeler dans `untracked()` : sinon il suit les signals lus par le moteur et le relance à chaque enregistrement (corrigé).

### 9.3 PlaySessionStore

- [x] **9.3.1** Sauvegarde à chaque événement (élément exécuté, battlemap, son, clic validé). [TEC-52, NF-24]
  - Note : ℹ️ Info : `PlaySessionStore` (`engine/play-session-store.ts`, fourni par l'écran) : chaque événement (`updateScene`, `setCurrentScene`) enregistre aussitôt une copie de la partie ; écritures enchaînées ; une écriture ratée (quota…) est signalée par une notification sans bloquer les suivantes (NF-25). Les sons sont reportés à chaque changement via `AudioPlayer.onChange` (sauf pendant un changement de scène).
- [x] **9.3.2** Continuer : restauration de la dernière scène dans l'état exact. [PRS-05]
  - Note : ℹ️ Info : partie existante → statut `choose` (`savedSession`) ; `continueSession()` rouvre `currentSceneId` dans son état exact (sons repris depuis le début). ✅ Décision : si la dernière scène a été supprimée depuis, la partie reprend sur la première scène. ⚠️ Alerte : en attendant la fenêtre Continuer / Recommencer du lot 10, `engine.start()` (utilisé par l'écran actuel) **continue automatiquement** la partie existante.
- [x] **9.3.3** Recommencer : effacement de la partie et retour à la première scène. [PRS-03]
  - Note : ℹ️ Info : `restart()` : la partie enregistrée est supprimée, une nouvelle commence sur la première scène (l'avertissement et la confirmation sont pour l'écran, lot 10).
- [x] **9.3.4** Références vers des éléments supprimés : action ignorée, battlemap, son ou scène cible d'un « Changer de scène » manquants signalés (pas de changement de scène dans ce dernier cas). [PRS-07, NF-25]
  - Note : ℹ️ Info : action ou élément supprimé : ses textes et clics disparaissent du fil (`feed` les filtre). Battlemap supprimée : `shownBattlemap().battlemap === null` (message à afficher par l'écran, lot 10). Son supprimé (nœud ou fichier) : non lancé, notification « Un son a été supprimé du projet : il n'est pas lancé. », la partie continue. Scène cible supprimée : cf. 9.1.6.

### 9.4 AudioPlayer

- [x] **9.4.1** Prototype Web Audio sur Chrome et Firefox (fondus, pause) avant le reste du service. [Plan §6]
  - Note : ℹ️ Info : prototype autonome `prototypes/prototype-web-audio.html` (dossier JDR_Manager, son intégré, s'ouvre en double-clic) : `<audio>` en boucle → `MediaElementAudioSourceNode` → `GainNode`, fondu en entrée de 1 s, pause (rampe 200 ms puis `pause()`), reprise, volume en direct, fondu en sortie de 0,8 s. Mesuré dans Chromium : le gain monte linéairement jusqu'à 0,8, la position reste figée pendant la pause, le niveau mesuré (AnalyserNode) suit le gain, la boucle repart au début. ⚠️ Alerte : Firefox n'est pas disponible dans mon environnement : **à vérifier par Allan** en ouvrant le prototype dans Firefox (cliquer « Démarrer », écouter, comparer les mesures affichées). Chromium sans interface ne bloque pas la lecture automatique : le déblocage au premier clic (TEC-43) sera vérifié à l'écran (lot 10).
- [x] **9.4.2** `AudioContext` unique, créé / repris au premier clic. [TEC-43]
  - Note : ℹ️ Info : `AudioPlayer` est un service global (`@Service()`, `features/presentation/audio`) : un seul `AudioContext`, créé à la première utilisation ; `unlock()` le crée ou le reprend (`resume()`), à appeler sur le premier clic (bouton Continuer / Recommencer, lot 10). Fabrique injectable `AUDIO_CONTEXT_FACTORY` (faux contexte dans les tests).
- [x] **9.4.3** Lecture `<audio>` + `MediaElementAudioSourceNode` + `GainNode`, boucle, volume. [TEC-40, TEC-41]
  - Note : ℹ️ Info : un `<audio>` par son (`src` = URL du média via `MediaUrls`, libérée à l'arrêt), relié à Web Audio ; le fichier n'est jamais décodé en entier (TEC-41). `play(request, { paused, volume })` renvoie `false` si le fichier est introuvable. Un son sans boucle disparaît de la liste à la fin du fichier.
- [x] **9.4.4** Fondus en entrée et en sortie. [TEC-42]
  - Note : ℹ️ Info : rampes `linearRampToValueAtTime` : entrée de 0 au volume en `fadeInMs` ; sortie vers 0 en `fadeOutMs` puis `pause()` et déconnexion des nœuds. Son lancé à la main : fondu de sortie par défaut `DEFAULT_FADE_OUT_MS` = 1 s.
- [x] **9.4.5** Pause / reprise d'un son et volume en direct. [CTL-08, CTL-09]
  - Note : ℹ️ Info : `pause(id)` : rampe de 200 ms vers 0 puis `pause()` ; `resume(id)` : `play()` puis remontée au volume courant (une reprise juste après une pause annule l'arrêt programmé). `setVolume(id, v)` borné à 0–1, appliqué tout de suite si le son joue, retenu sinon. Pas d'arrêt manuel (TRD §7).
- [x] **9.4.6** Pause / reprise globale et signal `anyPlaying`. [CTL-10]
  - Note : ℹ️ Info : `pauseAll()`, `resumeAll()`, signal `anyPlaying` ; côté moteur, `togglePlayback()` choisit selon `anyPlaying` (CTL-10). Signal `sounds` : `{ soundId, elementId, paused, volume, loop }`, et `onChange(listener)` pour la sauvegarde.
- [x] **9.4.7** Relance des sons d'une scène restaurée (depuis le début, avec volume et état de pause). [PRS-05]
  - Note : ℹ️ Info : `play(request, { paused, volume })` crée un nouvel `<audio>` (lecture depuis le début) ; en pause, il est prêt mais pas joué, et `resume()` le lance au volume enregistré. Utilisé par le moteur à la reprise d'une partie et au retour sur une scène.

### 9.5 Tests

- [x] **9.5.1** Tests de l'`ActionRunner` (séquence, annulation, attente, clic, relance). [TEC-81]
  - Note : ℹ️ Info : `action-runner.spec.ts` (8 tests) : tous les types d'éléments dans l'ordre, annulation, attente (minuteurs simulés) et attente annulée, clic résolu / annulé, changement de scène (et cible supprimée), relance ; `delay.spec.ts` (3 tests).
- [x] **9.5.2** Tests du `PresentationEngine` et du `PlaySessionStore` (scénarios du TRD §6). [TEC-81]
  - Note : ℹ️ Info : `presentation-engine.spec.ts` (18 tests, vrai dépôt IndexedDB + Web Audio simulé) : scénarios du TRD §6 (ouverture, ordre des actions d'ouverture, quitter avec annulation et fondus, retour sans relance, battlemap, actions manuelles et relance, clic validé / retiré, changement de scène, sons manuels, pause globale, Continuer, Recommencer, projet introuvable / sans scène) ; `play-session-store.spec.ts` (4 tests : enregistrement de chaque événement, Recommencer, Continuer sur une copie, écriture ratée).
- [x] **9.5.3** Tests de l'`AudioPlayer` avec Web Audio simulé. [TEC-81]
  - Note : ℹ️ Info : `audio-player.spec.ts` (11 tests) avec `useFakeAudio()` (`src/testing/fake-audio.ts` : faux `AudioContext`, gains qui journalisent leurs rampes, faux `MediaUrls`, `play` / `pause` espionnés) : contexte unique et repris, chaîne `<audio>` → gain, boucle, fondus, arrêt et libération, arrêter tout, pause / reprise / volume, pause globale, son restauré, remplacement, fin de fichier.
- [x] **9.5.4** Tests des références supprimées (dont la scène cible d'un « Changer de scène »). [PRS-07]
  - Note : ℹ️ Info : couverts dans les specs du moteur et du runner : son supprimé (nœud ou fichier) non lancé avec message, battlemap supprimée signalée, textes d'une action supprimée masqués, scène cible supprimée (pas de changement + message), dernière scène supprimée → reprise sur la première. Suite complète : 324 tests OK ; lint, stylelint, Prettier et build sans avertissement. Vérifié aussi dans Chromium sur le scénario Valombre : son d'ambiance lancé (volume 0,6, boucle) et partie enregistrée.

**Critère de fin** : les scénarios du TRD §6 sont couverts par des tests.

> ✅ Lot 9 validé : moteur de présentation complet sans interface (`ActionRunner`, `PresentationEngine`, `PlaySessionStore`, `AudioPlayer`), 41 nouveaux tests (suite : 324). `ng build` (sans avertissement), `ng test`, `ng lint`, `npm run lint:styles` et `npm run format:check` passent ; vérifié dans Chromium sur le scénario Valombre. Écarts au TRD (mis à jour, §6 et §7) : le runner renvoie la scène cible au lieu d'appeler le moteur ; `stopAll()` coupe toujours en fondu. **À faire par Allan** : ouvrir `prototypes/prototype-web-audio.html` dans Firefox (9.4.1). Décisions à confirmer (cf. notes 9.1.2, 9.1.3, 9.1.5, 9.3.2). Pas de nouvelle dépendance.

---

## Lot 10 — Écran de Présentation (PC)

### 10.1 Lancement

- [x] **10.1.1** Fenêtre de lancement : dernière scène, choix « Un seul écran » / « Deux fenêtres ». [AFF-01, AFF-03]
  - Note : ℹ️ Info : `LaunchDialog` (`gm-screen/launch-dialog`, fenêtre 620 px, maquette « Présentation — lancement ») : nom du projet, dernière scène (ou première), date de sauvegarde et nombre de scènes visitées, choix de l'affichage en cartes radio « Un seul écran » / « Deux fenêtres », « Retour aux projets ». Le moteur s'arrête désormais toujours au statut `choose` après `load()` : c'est l'écran qui lance. ⚠️ Alerte : le choix « Deux fenêtres » est mémorisé (`displayMode`) mais la fenêtre joueurs s'ouvrira au lot 11 (11.1) ; la pastille « Fenêtre joueurs ouverte » est prête (signal `playerWindowOpen`).
- [x] **10.1.2** Continuer / Recommencer + confirmation destructive. [PRS-02, PRS-03]
  - Note : ℹ️ Info : « Continuer la partie » → `continueSession()` ; « Recommencer » → confirmation destructive (« Recommencer la partie ? », « Effacer et recommencer », bouton Danger fort, texte de la maquette) → `restart()` ; Annuler revient à la fenêtre de lancement. ✅ Décision (Allan, 11/11/2026) : plus de fenêtre de confirmation. « Recommencer » se valide en **restant appuyé 3 s** (souris, doigt, Espace ou Entrée ; `RESTART_HOLD_MS`) : le fond du bouton se remplit de gauche à droite (`--hold-progress`, piloté en JS pour rester visible avec `prefers-reduced-motion`) et revient à vide au relâchement, il faut alors recommencer les 3 s. Un clic simple (ou un appui trop court) affiche sous le bouton un message (`role="alert"`) : rester appuyé pour valider, toute la progression sera perdue. ⚠️ Alerte : avec « Deux fenêtres », la fenêtre joueurs s’ouvre 3 s après le début de l’appui ; Firefox peut alors la bloquer (activation utilisateur expirée), le bouton « Ouvrir la fenêtre joueurs » de l’en-tête permet de l’ouvrir. ℹ️ Info : comportement extrait dans la directive partagée `appHoldToConfirm` (`shared/ui/hold-to-confirm`, styles `styles/components/_hold-to-confirm.scss`), réutilisée par la fenêtre de confirmation (6.9).
- [x] **10.1.3** Sans partie sauvegardée : ouverture directe de la première scène (le clic de lancement débloque l'audio). [PRS-01, TEC-43]
  - Note : ℹ️ Info : sans partie, la même fenêtre propose « Commencer la partie » (pas de Recommencer) puis ouvre la première scène. ✅ Décision : la fenêtre de lancement s'affiche aussi sans partie sauvegardée : elle porte le choix de l'affichage (AFF-03) et fournit le clic qui débloque l'audio (`AudioPlayer.unlock()` appelé dans le gestionnaire du clic, TEC-43).

### 10.2 En-tête

- [x] **10.2.1** Retour, nom du projet, chemin et nom de la scène, pastille « Fenêtre joueurs ouverte ». [—]
  - Note : ℹ️ Info : en-tête Présentation (60 px) : retour aux projets, ligne de contexte « Projet · Acte I › … » (dossiers de la scène), nom de la scène en Cinzel, icône du mode, pastille « Fenêtre joueurs ouverte » (affichée au lot 11).
- [x] **10.2.2** « Aller à une scène » : navigation libre via l'arborescence en lecture seule. [CTL-05]
  - Note : ℹ️ Info : bouton « Aller à une scène » (en-tête, à droite) : fenêtre de sélection en lecture seule sur toute l'arborescence, scène actuelle grisée (« scène actuelle »), bouton « Ouvrir la scène » → `engine.openScene()`.

### 10.3 Fil d'actualité

- [x] **10.3.1** Bloc texte (police narrative). [FIL-02]
  - Note : ℹ️ Info : composant `Feed` (`gm-screen/feed`) : colonne centrée de 760 px, texte en carte, Lora 20 px (police narrative), retours à la ligne conservés ; non modifiable (FIL-09).
- [x] **10.3.2** Miniature de battlemap cliquable + modale plein écran. [FIL-03, FIL-04]
  - Note : ℹ️ Info : `FeedBattlemap` : miniature (16:9, largeur du panneau au plus) avec le nom, curseur loupe ; clic → `BattlemapViewer` en grand (nouvelle taille de fenêtre `xl`, jeton `layout(modal-xl)` = 1400 px, bornée à l'écran). Réutilisée pour l'aperçu du panneau.
- [x] **10.3.3** Bloc « Clic de l'utilisateur » avec bouton « Cliquer pour continuer » en bas à droite ; état validé. [FIL-05]
  - Note : ℹ️ Info : bloc doré (fond `accent-surface`, bordure 2 px), icône dans un cercle, texte Inter 19 px 500 (nouveau jeton `font-size(click)`), bouton « Cliquer pour continuer » en bas à droite → `engine.continueClick()`. Validé : style neutre, coche turquoise, mention « Validé ».
- [x] **10.3.4** Défilement automatique du nouvel élément en haut de l'écran. [FIL-06]
  - Note : ℹ️ Info : à chaque élément montré (`engine.focus`), le fil défile (en douceur, sauf `prefers-reduced-motion`) pour placer l'élément en haut, sous une marge de 64 px (`scroll-padding-top`) qui laisse voir la fin du précédent ; un espace en bas permet au dernier élément de monter. ⚠️ Alerte : jsdom ne calcule pas les positions : le défilement est vérifié dans Chromium, pas en test unitaire.
- [x] **10.3.5** Éléments précédents estompés, relecture du fil, bouton « Revenir au dernier élément ». [FIL-07]
  - Note : ℹ️ Info : éléments avant l'élément courant estompés (opacité 45 %) ; pastille « N éléments précédents » en haut, qui remonte d'un élément à chaque clic. Quand le MJ remonte le fil, l'estompage disparaît et un bouton flottant « Revenir au dernier élément » apparaît.
- [x] **10.3.6** Défilement jusqu'au texte existant lors d'une relance. [CTL-03]
  - Note : ℹ️ Info : à la relance, le moteur pose `focus` sur le texte déjà présent : il devient l'élément courant et le fil y défile (testé : seul ce qui le précède est estompé).
- [x] **10.3.7** Affichage des erreurs (battlemap manquante, scène cible supprimée…) sans bloquer la partie. [PRS-07, NF-25]
  - Note : ℹ️ Info : battlemap ou image supprimée : bloc d'erreur « Cette battlemap a été supprimée du projet. » dans le fil et dans l'aperçu du panneau ; son supprimé, scène cible supprimée, échec d'enregistrement : notifications du moteur ; textes d'actions supprimées masqués. La partie continue dans tous les cas (NF-25).

### 10.4 Navigation entre scènes

- [x] **10.4.1** Bouton flottant « Scène suivante » : ouverture directe s'il n'y a qu'une scène. [CTL-04]
  - Note : ℹ️ Info : `NextSceneButton` : bouton principal flottant (54 px, ombre `shadow(float)`) en bas à droite de la zone du fil ; une seule scène suivante → ouverture directe ; aucune → pas de bouton. ✅ Décision (Allan) : avec une seule scène suivante, le bouton affiche son nom (tronqué s'il est long ; `aria-label` « Scène suivante : <nom> »).
- [x] **10.4.2** Liste déroulante si plusieurs scènes suivantes. [CTL-04]
  - Note : ℹ️ Info : plusieurs scènes suivantes : chevron, liste (menu CDK, `appMenu`) qui s'ouvre au-dessus du bouton, alignée à droite.

### 10.5 Panneau de contrôle

- [x] **10.5.1** Trois parties repliables avec résumé dans l'en-tête, état mémorisé. [CTL-11]
  - Note : ℹ️ Info : panneau droit de 420 px, trois composants `BattlemapSection`, `ActionsSection`, `SoundsSection`, chacun dans une `app-collapsible-section` avec résumé (« · Salle », « · 2 disponibles », « · 1 en cours ») et état mémorisé (`play.battlemap`, `play.actions`, `play.sounds`).
- [x] **10.5.2** Battlemap : aperçu, choix parmi les battlemaps de la scène. [CTL-07]
  - Note : ℹ️ Info : aperçu de la battlemap affichée (clic → en grand) ; s'il y en a plusieurs, pastilles de choix (`aria-pressed`) → `engine.showBattlemap()` (miniature ajoutée au fil).
- [x] **10.5.3** Actions : actions manuelles disponibles, action en cours, masquage des actions effectuées. [CTL-01]
  - Note : ℹ️ Info : action en cours dans un bloc turquoise « En cours » ; actions manuelles disponibles en boutons ▶ ; les actions effectuées sont masquées ; message si toutes sont faites ou s'il n'y en a pas. ✅ Décision (Allan) : l'avancement « 4/5 » d'une action en cours (maquette) n'est **pas affiché** pour le moment ; s'il est ajouté plus tard : élément démarré / nombre total, remis à 1 à la relance.
- [x] **10.5.4** « Voir toutes les actions » et relance d'une action effectuée. [CTL-02, CTL-03]
  - Note : ℹ️ Info : « Voir toutes les actions (N effectuée(s)) » / « Masquer les actions effectuées » ; une action effectuée apparaît avec une coche et « Relancer » ; la relance ne duplique pas les textes (CTL-03).
- [x] **10.5.5** Sons : cartes des sons en cours, pause / reprise, carte dépliée avec volume. [CTL-08, CTL-09]
  - Note : ℹ️ Info : `SoundCard` : icône haut-parleur turquoise (grisée en pause), nom, « boucle », « en pause », bouton Pause / Lecture à droite ; clic sur la carte → carte dépliée avec curseur de volume (pas de 5) et valeur en %. Pas d'arrêt manuel.
- [x] **10.5.6** Bouton global lecture / pause dans l'en-tête de la partie Sons. [CTL-10]
  - Note : ℹ️ Info : bouton global dans l'en-tête de Sons (emplacement `sectionAction`) : icône Pause tant qu'un son joue, Lecture sinon (« Tout mettre en pause » / « Tout reprendre ») ; masqué s'il n'y a aucun son.
- [x] **10.5.7** « Lancer un son » via la fenêtre de sélection des sons ; vérification dans les deux thèmes. [CTL-08, Brief §11]
  - Note : ℹ️ Info : « Lancer un son » : fenêtre de sélection unique (« Ce projet » puis « Bibliothèque globale », bouton « Lancer ») → `engine.playLibrarySound()`. `sound-choice.ts` déplacé dans `shared/selection-dialog` (utilisé par l'éditeur d'action et la Présentation). Rendu vérifié dans Chromium en Nuit dorée et Automne (lancement, confirmation, scène avec clic, relecture du fil, liste des scènes suivantes, « Aller à une scène »). Tests : 21 (fenêtre de lancement, écran, fil, miniature, scène suivante, trois parties du panneau, carte de son) avec le banc `src/testing/presentation-harness.ts` ; suite complète 341 tests OK, lint, stylelint, Prettier et build sans avertissement.

> ✅ Lot 10 validé : écran de Présentation PC complet (lancement, en-tête, fil, scène suivante, panneau de contrôle), vérifié dans Chromium dans les deux thèmes sur le scénario Valombre. `ng build` (sans avertissement), `ng test` (341 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Ajouts : taille de fenêtre `xl`, jetons `space(18|22|44|160)`, `font-size(click)`, `layout(scene-thumb|modal-xl)`. « Deux fenêtres » : choix mémorisé, fenêtre ouverte au lot 11. Pas de nouvelle dépendance.

---

## Lot 11 — Fenêtre joueurs

- [x] **11.1** Route `/projects/:id/player` et ouverture par `window.open` depuis l'écran du MJ. [AFF-02, TEC-53]
  - Note : ℹ️ Info : route déjà déclarée (`/projects/:projectId/player`, page `PlayerScreenPage`). Côté MJ, service `PlayerWindow` (`gm-screen/player-window.ts`, fourni par l'écran) : `window.open(url, 'jdr-manager-player-<id>', 'popup')`. ⚠️ Alerte : l'ouverture doit avoir lieu **dans le gestionnaire du clic**, sinon le navigateur bloque la fenêtre : la fenêtre de lancement appelle un rappel `onLaunch` avant de se fermer. Fenêtre bloquée : notification (« autorisez les fenêtres pop-up… ») et bouton « Ouvrir la fenêtre joueurs » dans l'en-tête.
- [x] **11.2** Canal `BroadcastChannel` par projet ; messages `show-battlemap`, `clear`, `ping`. [TEC-53, TRD §9]
  - Note : ℹ️ Info : canal `BroadcastChannel('jdr-manager:<projectId>')`, contrat typé `PlayerMessage` (`player-screen/player-channel.ts`). Messages du TRD (`show-battlemap`, `clear`, `ping`) plus `theme` (11.6), `hello` et `bye` (11.7) ; TRD §9 mis à jour. `show-battlemap` porte aussi l'id de la scène (il n'existe pas de lecture d'une battlemap seule dans le dépôt). Fabrique `PLAYER_CHANNEL_FACTORY`, remplacée en test par un canal en mémoire (`src/testing/fake-player-channel.ts`).
- [x] **11.3** Résolution de l'URL de la battlemap par la fenêtre joueurs elle-même (identifiants seulement dans les messages). [TRD §9]
  - Note : ℹ️ Info : la fenêtre joueurs lit les battlemaps de la scène (`listBattlemaps(sceneId)`, `resource`) puis l'image via `MediaUrls.track()` ; seuls des identifiants passent dans le canal. Battlemap supprimée : écran noir (pas de message d'erreur montré aux joueurs ; le MJ voit l'erreur de son côté).
- [x] **11.4** État initial demandé à l'ouverture (`ping`). [TRD §9]
  - Note : ℹ️ Info : à l'ouverture (et au rechargement), la fenêtre joueurs envoie `ping` ; l'écran du MJ répond par le thème puis la battlemap affichée (ou `clear`). Avant toute réponse : « En attente de l'écran du MJ… ».
- [x] **11.5** Affichage plein écran, fond noir quel que soit le thème. [Brief §2.8]
  - Note : ℹ️ Info : page plein cadre, battlemap en `object-fit: contain` sur fond noir, aucun contrôle ; double-clic : plein écran (`requestFullscreen`), rappelé discrètement dans le message d'attente. Nouveaux jetons `player-bg` (`#000` dans les deux thèmes) et `player-text` (Brief §2.7 et §11.3 mis à jour).
- [x] **11.6** Transmission du thème courant. [TEC-16]
  - Note : ℹ️ Info : l'écran du MJ envoie `theme` à chaque changement de `Theme.theme()` et en réponse à `ping` ; la fenêtre joueurs l'applique (`Theme.setTheme`). Il ne colore que le message d'attente : le fond reste noir.
- [x] **11.7** Comportement si la fenêtre joueurs est fermée ou rechargée en cours de partie. [—]
  - Note : ℹ️ Info : fenêtre joueurs fermée : `bye` (`pagehide`) et vérification de `window.closed` chaque seconde → pastille retirée, bouton « Ouvrir la fenêtre joueurs ». Rechargée : `ping` → état renvoyé. Écran du MJ rechargé : il envoie `hello`, la fenêtre joueurs encore ouverte répond `ping` → pastille et état. Écran du MJ quitté (navigation dans l'application, onglet fermé ou rechargé) : `clear` → écran noir. Vérifié dans Chromium avec deux fenêtres réelles (lancement « Deux fenêtres », changement de battlemap, rechargement et fermeture de la fenêtre joueurs, rechargement et sortie de l'écran du MJ). Tests : `player-window.spec.ts` (3), `player-screen-page.spec.ts` (3), écran du MJ en « Deux fenêtres » (1) ; suite complète 347 tests OK, lint, stylelint, Prettier, `check:themes` et build sans avertissement.

> ✅ Lot 11 validé : fenêtre joueurs synchronisée par `BroadcastChannel`, vérifiée dans Chromium avec deux fenêtres réelles. `ng build` (sans avertissement), `ng test` (347 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Écarts au TRD (mis à jour, §9) : messages `theme`, `hello`, `bye` en plus ; `show-battlemap` porte aussi l'id de la scène. Nouveaux jetons `player-bg` / `player-text` (Brief mis à jour). **À vérifier par Allan** : Firefox et Edge (blocage des fenêtres pop-up, plein écran au double-clic). Pas de nouvelle dépendance.

---

## Lot 12 — Reprise et cohérence des données

- [x] **12.1** Fermer le navigateur en pleine partie puis « Continuer » : scène, fil, battlemap, actions restaurés. [PRS-05, NF-24]
  - Note : ℹ️ Info : vérifié dans Chromium par l'interface, sur une copie du scénario Valombre : partie jouée sur 3 scènes (actions, clic validé, choix de battlemap, son lancé à la main, volume et pause), puis navigateur fermé brutalement (profil conservé). Au retour, la fenêtre de lancement annonce « La taverne du Sanglier · 3 scènes visitées » ; « Continuer » rouvre la taverne avec son fil (6 éléments), sa battlemap choisie, ses actions effectuées. ⚠️ Alerte (corrigée) : fermeture pendant le clic d'une action **relancée** : la règle du lot 9 retirait le bloc en attente, donc un texte d'une exécution précédente terminée. Désormais, à la reprise, un bloc en attente est retiré seulement si son action n'a jamais été terminée ; sinon il reste, validé (2 tests ajoutés au moteur, vérifié dans Chromium).
- [x] **12.2** Sons restaurés : relancés depuis le début, avec leur volume et leur état de pause. [PRS-04, PRS-05]
  - Note : ℹ️ Info : après fermeture et « Continuer » : « Vent dans les arbres » relancé en pause à 30 %, « Pluie battante » (lancé à la main) à 40 %, « Taverne animée » à 70 % ; relancés depuis le début (un nouvel `<audio>` par son). Un son court sans boucle (« Combat ») est relancé lui aussi puis disparaît à sa fin, comme prévu (PRS-05).
- [x] **12.3** Supprimer une action, une battlemap, un son et une scène visée par un « Changer de scène » entre deux séances, puis reprendre la partie. [PRS-07]
  - Note : ℹ️ Info : entre deux séances, supprimés dans l'éditeur : l'action « Le garde » (textes et clic dans le fil), la battlemap affichée « Place du village », le son en cours « Pluie battante », la scène « La lisière » (cible de « Poursuite »). Les confirmations avertissent pour l'action, la battlemap et le son. À la reprise : textes de l'action supprimés masqués, bloc d'erreur à la place de la battlemap, son supprimé non lancé avec message (le vent revient, en pause), « Poursuite » affiche « La scène cible… a été supprimée : la scène ne change pas. » et reste sur la scène ; l'éditeur signale « scène supprimée ». ✅ Décision (Allan) : avertir aussi à la suppression d'une scène visée par un « Changer de scène » : fait. La confirmation indique le nombre d'actions extérieures qui la visent (« Cette scène est la cible de 1 action « Changer de scène », qui la signalera comme introuvable. »), y compris pour un dossier ; nouvelle méthode du dépôt `listSceneLinks(projectId)` (TRD §4.1), `EditorStore.sceneTargetCount()`, 2 tests.
- [x] **12.4** « Recommencer » après une longue partie : tout l'état est bien effacé. [PRS-03]
  - Note : ℹ️ Info : « Recommencer » après une partie de 4 scènes : la partie enregistrée ne contient plus que la première scène (fil d'ouverture, actions d'ouverture) ; la taverne revient à son état neuf (texte de scène seul, actions disponibles, battlemap par défaut, ambiance).
- [x] **12.5** Revenir sur plusieurs scènes visitées : chaque fil est restauré indépendamment. [FIL-01, PRS-06]
  - Note : ℹ️ Info : allers-retours Arrivée → Taverne → Marché → Taverne → Arrivée : chaque scène retrouve son propre fil, sa battlemap, ses actions effectuées et ses sons (volumes et pauses) sans relancer ses actions d'ouverture ; aucun mélange entre scènes. Enregistrement vérifié dans IndexedDB scène par scène.
- [x] **12.6** Jalon J4 : animer une séance de test complète sur PC, avec et sans fenêtre joueurs. [Plan §2]
  - Note : ℹ️ Info : jalon J4 atteint sur le scénario Valombre (11 scènes) joué de bout en bout dans Chromium, deux fois : en « Deux fenêtres » (fenêtre joueurs ouverte au lancement, battlemap juste à chaque scène jusqu'à la fin, pastille présente) puis en « Un seul écran ». Chaque scène : actions d'ouverture, toutes les actions manuelles, clics validés, scène suivante directe ou par la liste, navigation libre (« Aller à une scène ») vers Le marché et Le campement, « Changer de scène » de « Poursuite ». 88 s par séance, aucune erreur de console, 11 scènes enregistrées. ✅ Décision (Allan) : la Présentation sur tablette entre en V1 (lot 12 bis).

> ✅ Lot 12 validé : reprise de partie et cohérence des données vérifiées par l'interface dans Chromium (fermeture brutale, sons restaurés, suppressions entre deux séances, Recommencer, allers-retours entre scènes), jalon **J4** atteint avec et sans fenêtre joueurs. Correction : bloc de clic d'une relance interrompue conservé à la reprise. `ng build` (sans avertissement), `ng test` (349 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Décisions d'Allan : avertissement à la suppression d'une scène visée par « Changer de scène » (fait) ; tablette en V1 (lot 12 bis). Pas de nouvelle dépendance.

---

## Lot 12 bis — Hors ligne et tablette

> Ajouté après le jalon J4 (décision d'Allan) : Présentation sur tablette Android (Chrome) en V1, application utilisable sans connexion internet et lancée depuis un fichier HTML, transfert des projets du PC vers la tablette.

- [ ] **12b.1** Conception : lancement hors ligne depuis un fichier HTML (fichier unique, application installable, ou autre), validée par Allan après prototypes sur PC et sur tablette Android. [O5, PRJ-04, NF-04]
  - Note : —
- [ ] **12b.2** Format d'export d'un projet (scènes, actions, battlemaps, sons du projet et sons de la bibliothèque globale utilisés) et « Exporter le projet » depuis l'accueil. [PRJ-04, PRJ-05]
  - Note : —
- [ ] **12b.3** « Importer un projet » (nouveau projet, fichiers refusés expliqués, quota). [PRJ-05]
  - Note : —
- [ ] **12b.4** Build hors ligne selon 12b.1 : traductions, polices et médias embarqués, navigation sans serveur. [TEC-90]
  - Note : —
- [ ] **12b.5** Mise en page tablette : fil à gauche, onglets Actions / Cartes / Sons, « Scène suivante » en bas, cibles ≥ 48 px. [CTL-12, Brief §7.3]
  - Note : —
- [ ] **12b.6** Tablette : un seul écran (pas de fenêtre joueurs), plein écran et son débloqués au toucher, stockage persistant. [NF-04, TEC-43]
  - Note : —
- [ ] **12b.7** Lecteur `.zip` hors ligne : Présentation seule d'un projet exporté. [PRJ-04]
  - Note : —
- [ ] **12b.8** Vérification sur une tablette Android réelle (Allan) et en émulation : import, séance complète, reprise. [Plan §2]
  - Note : —

**Critère de fin** : un projet préparé sur le PC est présenté sur la tablette Android sans connexion internet.

---

## Lot 13 — Robustesse, performance, accessibilité

### 13.1 Stockage

- [x] **13.1.1** Message clair en cas de quota dépassé à l'import. [TRD §5]
  - Note : ℹ️ Vérifié dans Chromium avec un petit quota simulé (CDP `Storage.overrideQuotaForOrigin`) : import de battlemaps (éditeur) et de sons (bibliothèque) → notification `error.data.quota-exceeded` (« Espace de stockage du navigateur insuffisant. Supprimez des projets ou des sons inutilisés, puis réessayez. »), les fichiers déjà importés sont gardés, aucune donnée cassée. Un enregistrement de partie qui échoue pour la même raison est notifié (`PlaySessionStore`) et la partie continue.
- [x] **13.1.2** (Optionnel) Affichage de la place de stockage utilisée. [NF-14]
  - Note : ℹ️ Paramètres › « Stockage » (`StorageUsage`, `features/settings/storage-usage`) : nombre et poids des images et des sons, total, espace disponible (`navigator.storage.estimate()`), et si les données sont protégées (`persisted()`). Nouvelle méthode du dépôt `getStorageUsage()` (somme des `size` des médias, sans lire les `Blob`) ; utilitaire `formatFileSize()` (`shared/util/file-size.ts`, Ko / Mo / Go en base 1024). ⚠️ « Espace disponible » vient du navigateur, qui l'estime largement (et sous-estime les `Blob`) : c'est un ordre de grandeur. Chromium sans interface refuse la protection : l'écran y affiche « Données non protégées ».

### 13.2 Performance

- [x] **13.2.1** Mesurer le changement de scène et le lancement d'une action (< 300 ms). [NF-20]
  - Note : ℹ️ Mesuré dans Chromium (projet de démo, 11 scènes, clic → fil affiché) : changement de scène 7 à 17 ms (médiane 9) ; lancement d'action 1 à 12 ms. Une mesure à 1 005 ms correspond à une action qui commence par « Attendre 1 s » (attente voulue). Objectif < 300 ms atteint.
- [x] **13.2.2** Plusieurs longues ambiances simultanées sans ralentissement ni coupure. [NF-21, NF-22]
  - Note : ℹ️ Trois ambiances de 20 min (WAV, 3 × 19 Mo) lues ensemble pendant 30 s en changeant de battlemap : les trois avancent de 30,2 s (aucune coupure), ~60 images/s, intervalle max 50 ms, 0 tâche longue, mémoire JS stable à 13 Mo (lecture en flux par `<audio>`, pas de décodage complet).
- [x] **13.2.3** Chargement des médias de la seule scène courante ; miniatures en `loading="lazy"`. [TEC-91, TEC-92]
  - Note : ℹ️ Seuls les médias de la scène ouverte sont demandés (`MediaUrls` acquiert / libère à l'ouverture / fermeture). Ajout de `loading="lazy" decoding="async"` sur les miniatures du fil (`FeedBattlemap`) et de l'éditeur (`BattlemapCard`).
- [x] **13.2.4** Vérifier la libération des URL de médias sur une séance longue (pas de fuite mémoire). [TEC-33, NF-23]
  - Note : ℹ️ Trois tours complets des 11 scènes en Présentation : URL actives par scène identiques à chaque tour (1 à 5 : battlemaps de la scène + sons en cours), créées 74 / libérées 69 (les 5 restantes = scène affichée), mémoire JS stable à 13 Mo. Éditeur : une URL par battlemap de la scène ouverte, libérées en changeant de scène. Pas de fuite.

### 13.3 Accessibilité

- [x] **13.3.1** Navigation complète au clavier, focus visible. [Brief §8]
  - Note : ℹ️ Parcours au Tab de chaque écran (accueil, éditeur, sons, lancement, Présentation) : tous les contrôles atteints, contour visible partout. Corrigé : le titre de scène modifiable de l'éditeur n'avait pas de contour au focus (`:focus-visible` ajouté). Les fenêtres gardent le focus (CDK) et le rendent à l'élément d'origine.
- [x] **13.3.2** Libellés et attributs ARIA (boutons icône, sections, menus, arborescences). [Brief §8]
  - Note : ℹ️ axe-core sur 10 écrans × 2 thèmes : plus aucun problème ARIA. Corrigés : en-tête / pied de `app-modal` en `<div class="modal__header|footer">` (des `<header>` / `<footer>` créaient des repères en double) ; fenêtre joueurs dans un `<main>` libellé. Les tests ciblent maintenant `.modal__footer`.
- [x] **13.3.3** Contrastes vérifiés dans les deux thèmes. [Brief §2.8]
  - Note : ℹ️ axe-core, deux thèmes. Les éléments **passés** du fil, estompés à 45 % (Brief §6.10), étaient sous le 4,5:1 du Brief §2.8 (3,69 en Nuit dorée, 2,8 en Automne). ✅ Décision (Allan) : estompage remonté à 65 % (Brief §6.10 mis à jour), pleine opacité au survol ou au focus. Résultat : tout passe en Nuit dorée, et le texte des éléments passés passe aussi en Automne. ⚠️ Reste en Automne la petite mention « Validé » d'un clic passé (2,86:1, texte secondaire de 13 px) : acceptée en l'état, à revoir si besoin (ne pas estomper cette mention).
- [x] **13.3.4** Respect de `prefers-reduced-motion`. [Brief §8]
  - Note : ℹ️ `prefers-reduced-motion: reduce` (émulé dans Chromium) : transitions et animations ramenées à ~0 par les jetons `duration()`, défilement du fil sans animation (`behavior: 'auto'`). Les fondus audio ne sont pas concernés (son, pas mouvement).

### 13.4 Compatibilité et confort

- [ ] **13.4.1** Tests manuels sur Chrome, Edge et Firefox (dernières versions). [NF-02, TEC-90]
  - Note : ⚠️ À faire par Allan : seul Chromium est disponible ici (tous les tests automatiques y passent). À vérifier dans chaque navigateur : créer un projet, importer battlemaps et sons (glisser-déposer compris), éditer une action, lancer une partie en « Deux fenêtres » (fenêtre joueurs, plein écran par double-clic), sons (fondus, boucle, volume), raccourcis clavier, Continuer après rechargement, thème Automne. Firefox : la demande d'autorisation de stockage persistant au démarrage.
- [x] **13.4.2** Vérifier l'absence de texte en dur hors `fr.json`. [TEC-71]
  - Note : ℹ️ Nouveau script `npm run check:i18n` (`scripts/check-i18n.mjs`) : texte en dur dans les templates et dans `aria-label` / `title` / `placeholder` / `alt`, chaînes françaises dans le TypeScript, clés citées absentes de `fr.json`. Pages `features/dev` exclues, « JDR Manager » autorisé. Résultat : aucun texte en dur. À ajouter à la liste des commandes avant de cocher.
- [x] **13.4.3** (Optionnel) Raccourcis clavier en Présentation. [NF-32]
  - Note : ℹ️ Raccourcis à une touche dans la Présentation (`GmScreenPage.onShortcut`) : C clic à continuer, S scène suivante (ouvre le menu s'il y en a plusieurs), A aller à une scène, P tout lire / tout mettre en pause, 1 à 9 n-ième action disponible, ? aide (`ShortcutsDialog`, aussi par le bouton clavier de l'en-tête). Ignorés pendant une saisie, avec Ctrl / Alt / Cmd, ou si une fenêtre est ouverte (`Modals.isOpen()`). `aria-keyshortcuts` sur les boutons concernés. Vérifié dans Chromium.
- [x] **13.4.4** Mode démo de la Présentation, lancé par « Présenter » depuis un projet ouvert. [PRS-09]
  - Note : ✅ Décision (Allan, 11/11/2026) : le bouton « Présenter » de l’en-tête de l’éditeur et de l’écran Sons lance une **démo** (`/projects/:id/play?demo=1&scene=<id>`) ; la vraie partie (Continuer / Recommencer) se lance depuis la carte du projet sur l’accueil. Démo : démarrage direct sans fenêtre de lancement, sur un écran (la fenêtre joueurs reste ouvrable depuis l’en-tête) ; départ = scène ouverte dans l’éditeur, ou, depuis l’écran Sons, la dernière scène ouverte dans l’éditeur (préférence `editor.lastScene.<projectId>`, `core/preferences/last-edited-scene.ts`), à défaut la première scène ; pastille « Démo » ; la flèche de retour ramène à l’éditeur sur la scène en cours (`?scene=`, nouvelle entrée `scene` de `EditorPage`). Implémentation : `PlaySessionStore.enableDemo()` (ni lecture, ni effacement, ni enregistrement de la partie) et `PresentationEngine.startDemo(projectId, sceneId)`. L’audio est débloqué dans le clic sur « Présenter » (TEC-43). ⚠️ Alerte : une démo ouverte par rechargement de la page (sans clic préalable) peut rester muette tant que le navigateur bloque l’audio ; une démo et une vraie partie ouvertes en même temps partagent le canal de la fenêtre joueurs du projet.
- [x] **13.4.5** Texte facultatif sur l'élément « Attendre ». [ACT-10]
  - Note : ✅ Décision (Allan, 11/11/2026) : texte facultatif (`WaitElement.text`, absent quand il est vide, pas de migration de la base). Éditeur d'action : champ « Texte (facultatif) » sous la durée. Éditeur de scène : texte affiché sous « Attendre N s » sur la ligne de l'attente (`ActionPause`). Présentation : texte affiché **pendant l'attente** à la place de « Attente en cours » (`PendingWait.text`, `FeedWait` ; « Attente en cours » reste lu par les lecteurs d'écran), puis retiré avec la ligne ; rien n'est ajouté au fil ni enregistré (choix d'Allan).
- [x] **13.4.6** Option « Masquer l'action au départ » et élément « Afficher l'action ». [ACT-12, CTL-01, CTL-02]
  - Note : ✅ Décision (Allan, 11/11/2026) : ACT-12 (jusqu'ici hors V1) entre dans la V1. Cible : une action « Clic du MJ » de la **même scène** ; les actions masquées au départ sont traitées **comme les effectuées** (même liste repliée « Voir toutes les actions (N masquées) », raccourcis 1-9 ignorés, lançables) ; **nouvelle couleur** `--el-action-*` (violet, Brief §2.6 et §11.3). ℹ️ Info : modèle `Action.hidden` (gardé seulement pour « Clic du MJ », `EditorStore.saveAction`), `ShowActionElement` (`actionId`), `SceneState.shownActionIds` (facultatif : pas de migration de la base ni des parties enregistrées). Moteur : `ManualAction.hidden` = effectuée, ou masquée au départ et pas encore affichée ; « Afficher l'action » retire l'action des effectuées et l'ajoute à `shownActionIds` (une fois relancée et terminée, elle est de nouveau masquée). Éditeur : case sous le déclencheur, icône œil barré dans la liste des actions, choix de la cible par boutons radio (l'action elle-même exclue), avertissement à la suppression d'une action visée, cible supprimée signalée (PRS-07) ; la duplication de scène fait viser les copies. ⚠️ Alerte : `specifications.md` et `Plan_implementation.md` présentent encore cet élément comme une version future (non modifiés).

---

## Lot 14 — Recette V1

- [ ] **14.1** Saisir un scénario réel complet dans l'outil. [PRD §7]
  - Note : —
- [ ] **14.2** Animer une séance réelle de 4 heures sans quitter l'outil. [PRD §7]
  - Note : —
- [ ] **14.3** Vérifier la reprise après fermeture du navigateur pendant la séance. [PRD §7]
  - Note : —
- [ ] **14.4** Recenser et corriger les anomalies (lister ici les anomalies bloquantes). [—]
  - Note : —
- [ ] **14.5** Mettre à jour les documents (PRD, TRD, brief, spécifications) avec les écarts constatés. [—]
  - Note : —
- [ ] **14.6** Étiqueter la version `v1.0.0`. [—]
  - Note : —

---

## Points ouverts

| Sujet | Statut | Note |
|---|---|---|
| Présentation sur tablette en V1 (transfert des projets du PC vers la tablette) | ✅ Décidé (Allan) : oui | Tablette **Android (Chrome)** en priorité ; transfert par **export / import de projet** et par **lecteur `.zip` hors ligne** ; l'application doit fonctionner **sans connexion internet** et se **lancer depuis un fichier HTML**. Lot 12 bis, qui commence par une conception (12b.1). |
| Mise en page Markdown des textes (SCN-14, FIL-10) | ✅ Fait (2026-11-09) | ✅ Décision (Allan) : textarea + barre d'outils (gras, italique, titre, listes, citation, Ctrl + B / Ctrl + I) ; rendu par la bibliothèque `marked` (nouvelle dépendance, `npm install`), HTML assaini par Angular (`[innerHTML]`). Module `shared/markdown` : `appMarkdownEditor` sur le `<textarea>` (la barre s'affiche d'elle-même dans `app-field`), pipe `markdown`, styles `.app-markdown`. Branché sur le texte de scène, les textes d'action et l'élément « Afficher un texte » ; rendu dans le fil (`Feed`). Le texte d'un « Clic de l'utilisateur » reste du texte brut. ✅ Décision (Allan) : la barre d'outils est masquée par défaut et n'apparaît qu'au focus du champ (`:focus-within` de `app-field`), en flottant juste au-dessus du champ, par-dessus le libellé ou le contenu qui précède (aucun décalage de mise en page). Tests « Ajouter un texte » mis à jour (« Afficher un texte »), ils échouaient depuis le renommage. ⚠️ À vérifier par Allan dans le navigateur, deux thèmes. ✅ Demande (Allan, 2026-11-10) : sans le focus, le champ affiche le texte **mis en page** ; avec le focus, le texte **source** avec ses marqueurs visibles **et** mis en forme en même temps (gras, italique, titre, citation, code, lien). Réalisation : le texte du `<textarea>` est transparent, `app-field` dessine par-dessus un calque `aria-hidden` (`highlightMarkdown`, `shared/markdown/markdown-highlight.ts`, ou pipe `markdown`) ; un clic sur le rendu donne le focus au champ. ⚠️ Le calque source doit garder la largeur des caractères (curseur aligné) : titre en couleur d'accent sans changer de taille ni de police, gras simulé par un contour (`-webkit-text-stroke`), italique synthétisé (Inter n'a pas de fichier italique : en ajouter un décalerait le curseur). Alignement vérifié dans Chromium (deux thèmes, défilement). |
| Défilement du fil sur une salve d'éléments (FIL-06) | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : quand plusieurs éléments s'affichent à la suite, le fil défile vers le **premier**, pas vers le dernier, pour laisser le temps de lire. Une salve commence à l'ouverture de la scène, après « Continuer » (Clic de l'utilisateur) et à la fin d'une attente ; ℹ️ aussi quand le MJ lance une action ou une battlemap à la main (même logique : un geste du MJ). Réalisation : `PresentationEngine` (`startBurst()` / `show()`), seul le premier élément montré d'une salve devient `focus` ; les suivants s'affichent dessous sans défilement. Les éléments d'avant la salve sont estompés, ceux de la salve non. ⚠️ Une salve plus haute que la zone oblige à faire défiler à la main pour voir la fin (ex. le bouton « Continuer »). Test du fil « N éléments précédents » adapté. |
| Pause entre les éléments affichés en Présentation | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : 0,5 s entre la fin de l'affichage d'un élément et le suivant, ✅ portée à **1 s** (Allan, 2026-11-10), sauf pour les éléments de son. ℹ️ Concernés : « Afficher un texte », « Afficher une battlemap », « Clic de l'utilisateur » ; non concernés : sons, « Attendre », « Changer de scène » (un son placé entre deux textes part avec le premier). L'écart vaut pour toute la scène, y compris d'une action d'ouverture à la suivante et entre actions lancées en parallèle (créneaux réservés) ; aucun délai si l'affichage précédent date de plus de 1 s (après un clic ou une attente). Le sélecteur de battlemap du MJ n'est pas retardé. Réalisation : `ActionContext.beforeDisplay()` appelé par `ActionRunner`, implémenté par `PresentationEngine` ; jeton `DISPLAY_GAP_MS` (1 s, 0 dans les tests via `usePresentation()`). |
| Fondu d'apparition des éléments du fil en Présentation | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : fondu de 0,5 s, ✅ porté à **1 s** (Allan, 2026-11-10), à l'apparition de chaque élément du fil (texte, battlemap, clic, attente en cours). Animation CSS `feed-item-in` sur `.item` (`feed.scss`), nouveau jeton commun `duration(appear)` = 1 s (`_tokens.scss`, Brief §8). ℹ️ Les éléments déjà présents quand on ouvre ou reprend une scène apparaissent aussi en fondu ; désactivé avec « mouvements réduits ». Les éléments estompés finissent le fondu à leur opacité estompée. |
| Compte à rebours de l'élément « Attendre » en Présentation (ACT-10) | ✅ Fait (2026-11-09) | ✅ Décision (Allan) : pendant l'attente, une ligne en bas du fil affiche le temps restant (« 0:07 », arrondi à la seconde supérieure) ; ✅ Décision (Allan) : pas de barre de progression, c'est le **fond de la ligne** qui se remplit de gauche à droite (teinte `accent-tint-strong` sur `bg-card`, variable CSS `--wait-progress`) ; elle **disparaît** à la fin de l'attente et n'est **pas enregistrée** dans la partie (une attente interrompue par un changement de scène disparaît aussi). ℹ️ Info : `ActionContext.wait(element, signal)` remplace l'appel direct à `delay` dans `ActionRunner` ; le moteur expose `waits` (`PendingWait` : `endsAt`, `durationMs`) ; composant `FeedWait` (`gm-screen/feed-wait`, `role="timer"`). ⚠️ À vérifier par Allan dans le navigateur, deux thèmes. |
| Lancement hors ligne depuis un fichier HTML | ❓ Conception à valider (12b.1) | Vérifié : le build actuel ouvert en `file://` ne démarre pas (modules JavaScript bloqués par le navigateur, traductions chargées par requête). |
