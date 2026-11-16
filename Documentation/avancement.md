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
| 12 ter | Vidéos (fait avant le 12 bis) | 13 | 13 | Terminé |
| 12 bis | Hors ligne et tablette | 8 | 0 | À faire |
| 13 | Robustesse, performance, accessibilité | 16 | 15 | En cours |
| 14 | Recette V1 | 6 | 0 | À faire |
| 15 | Fiches (après la V1) | 12 | 0 | À faire |
| **Total** | | **248** | **221** | |

---

## Lot 0 — Initialisation du projet

### 0.1 Création du projet

- [x] **0.1.1** Créer le projet avec `ng new jdr-manager --style=scss --routing --ssr=false` et vérifier la version d'Angular (dernière stable). [TEC-01, TEC-11, TEC-18]
  - Note : —
- [x] **0.1.2** Vérifier les réglages standalone et zoneless (`provideZonelessChangeDetection`), retirer Zone.js s'il est présent. [TEC-02, TEC-04]
  - Note : ℹ️ Info : projet zoneless par défaut (pas de `zone.js`). En Angular 22, **OnPush est la stratégie par défaut** : ne pas la déclarer ; ESLint interdit `ChangeDetectionStrategy.Eager` / `Default`.
- [x] **0.1.3** Fixer les valeurs par défaut des schematics dans `angular.json` : `style: scss`, `changeDetection: OnPush`, `skipTests: false`, préfixe `app`. [TEC-18]
  - Note : —
- [x] **0.1.4** Initialiser le dépôt Git (`.gitignore`, premier commit).
  - Note : —

### 0.2 Qualité du code

- [x] **0.2.1** Activer TypeScript `strict` et les options strictes des templates. [TEC-09]
  - Note : —
- [x] **0.2.2** `ng add @angular-eslint/schematics` et configurer les règles du projet. [TEC-09]
  - Note : —
- [x] **0.2.3** Installer et configurer Prettier (intégration ESLint). [TEC-09]
  - Note : —
- [x] **0.2.4** Installer Stylelint pour SCSS, avec une règle interdisant les couleurs, tailles et ombres en dur hors des fichiers de jetons et de thèmes. [TEC-14]
  - Note : —

### 0.3 Tests

- [x] **0.3.1** Vérifier la configuration Vitest de `ng test` et écrire un test d'exemple. [TEC-80]
  - Note : —
- [x] **0.3.2** Installer `fake-indexeddb` pour les tests de la couche de données. [TEC-81]
  - Note : —

### 0.4 Structure

- [x] **0.4.1** Créer l'arborescence `core/`, `shared/`, `features/` et `src/styles/`. [TRD §2.2]
  - Note : —
- [x] **0.4.2** Déclarer les routes (`/projects`, `/sounds`, `/projects/:id/edit`, `/play`, `/player`) avec chargement paresseux de composants vides ; README de démarrage (commandes `ng serve`, `ng test`, `ng lint`, `ng build`). [TEC-10, TRD §2.3]
  - Note : ⚠️ Alerte : le dossier `.vscode` (recommandations d'extensions, tâches) n'a pas pu être copié sur ton PC (écriture interdite par l'outil) ; sans impact sur le projet.

**Critère de fin** : `ng serve`, `ng lint`, `ng test` et `ng build` passent sur le projet vide.

> ✅ Vérifié le 6 novembre 2026 : `ng lint`, `npm run lint:styles`, `ng test --watch=false`, `ng build` et `prettier --check` passent. Après récupération, lancer `npm install` dans `Source` avant toute commande.

---

## Lot 1 — Styles, thèmes et internationalisation

### 1.1 Jetons et fonctions SCSS

- [x] **1.1.1** Créer `_tokens.scss` : espacements, rayons, tailles et graisses de texte. [Brief §3, §4]
  - Note : —
- [x] **1.1.2** Créer `_functions.scss` : `color()`, `space()`, `radius()`, `shadow()`, `font()` qui renvoient des `var(--…)`. [TRD §10.4]
  - Note : ℹ️ Info : `font()` a été découpée en `font-family()` / `font-size()` / `font-weight()`, plus lisibles.
- [x] **1.1.3** Créer les styles de base globaux (reset, `body`, typographie par défaut, focus visible). [Brief §8]
  - Note : —

### 1.2 Moteur de thèmes

- [x] **1.2.1** Créer `_theme-engine.scss` : liste des jetons obligatoires (Brief §2) et mixin `theme()` qui génère les variables CSS. [TEC-12, TEC-13]
  - Note : ℹ️ Info : jeton `color-scheme` ajouté à `$required-tokens` (barres de défilement et contrôles natifs clairs ou sombres).
- [x] **1.2.2** Faire échouer la compilation si un jeton manque dans une map (vérifier avec une map volontairement incomplète). [TEC-12]
  - Note : —
- [x] **1.2.3** Créer `themes/_nuit-doree.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : ⚠️ Alerte : Stylelint impose la notation moderne `rgb(0 0 0 / 50%)` ; elle est désactivée dans les fichiers de thème pour garder la notation `rgba()` du Brief et faciliter la comparaison.
- [x] **1.2.4** Créer `themes/_automne.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : —
- [x] **1.2.5** Générer les deux thèmes dans `styles.scss` (Nuit dorée par défaut sur `:root`). [TEC-13]
  - Note : —

### 1.3 Angular Material, polices et icônes

- [x] **1.3.1** `ng add @angular/material` puis brancher le thème Material (M3 + surcharges) sur les variables CSS. [TEC-08, TEC-15]
  - Note : ℹ️ Info : les liens Google Fonts / Material Symbols ajoutés par `ng add` ont été retirés de `index.html` (polices auto-hébergées, icônes Lucide).
- [x] **1.3.2** Auto-héberger les polices Cinzel, Inter et Lora (`@font-face`, fichiers dans `assets`). [Brief §3, §10]
  - Note : ℹ️ Info : polices auto-hébergées via les paquets `@fontsource/*` (déclarés dans `angular.json`) plutôt que des `@font-face` écrits à la main dans `assets`.
- [x] **1.3.3** Installer les icônes Lucide (`@lucide/angular`) et vérifier leur rendu au trait. [Brief §5]
  - Note : ⚠️ Alerte : `lucide-angular` ne supporte pas Angular 22 (dépendance limitée à Angular 21). Remplacé par le paquet officiel `@lucide/angular` : une directive par icône (`<svg lucidePencil>`), configuration globale `provideLucideConfig({ strokeWidth: 1.75, size: 16 })`. Brief §5 mis à jour.

### 1.4 Préférences et changement de thème

- [x] **1.4.1** Générer le service `UiPreferences` (`ng g service`) : lecture / écriture `localStorage` protégées par `try/catch`. [TEC-62]
  - Note : ⚠️ Alerte : Angular 22 génère `@Service()` et nomme la classe **sans suffixe** : `UiPreferences` (`core/preferences/ui-preferences.ts`). Règle ajoutée au TRD (TEC-19), noms mis à jour dans le TRD et le plan (`Theme`, `UiPreferences`, `AudioPlayer`, `MediaUrls`).
- [x] **1.4.2** Générer le service `Theme` : signal `theme`, application de `data-theme` sur `<html>`, mémorisation. [TEC-16]
  - Note : —
- [x] **1.4.3** Ajouter dans `index.html` le script qui applique le thème mémorisé avant le chargement d'Angular (pas de flash). [TEC-16]
  - Note : —
- [x] **1.4.4** Page de démonstration temporaire : bascule entre les deux thèmes à la volée. [Plan, lot 1]
  - Note : —

### 1.5 Internationalisation

- [x] **1.5.1** `ng add @jsverse/transloco`, langue `fr` par défaut, chargement de `public/i18n/fr.json`. [TEC-70]
  - Note : ℹ️ Info : `ng add` échouait sur l'option `--ssr` : utiliser `ng g @jsverse/transloco:ng-add --langs=fr`. Chargeur déplacé dans `core/i18n/transloco-loader.ts`, chemin relatif `i18n/fr.json` (fonctionne aussi si l'appli est servie dans un sous-dossier).
- [x] **1.5.2** Organiser les clés par domaine (`common`, `project`, `scene`, `action`, `presentation`, `sound`, `error`, `settings`). [TEC-71, TEC-72]
  - Note : —

**Critère de fin** : la page de démonstration change de thème à la volée ; un jeton manquant fait échouer la compilation.

> ✅ Lot 1 validé : `ng build`, `ng test` (21 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : Material, Transloco, Lucide, Fontsource, Sass), puis `ng serve` et ouvrir `http://localhost:4200/dev/themes`.

---

## Lot 2 — Couche de données et médias

### 2.1 Modèle

- [x] **2.1.1** Générer les interfaces du modèle (`ng g interface`) : `Project`, `TreeNode`, `SceneNode`, `Scene`, `Battlemap`, `SoundNode`, `Media`. [TRD §3]
  - Note : ⚠️ Alerte : champ `fileName` ajouté à `Media` (nom du fichier d'origine), utile pour nommer un son importé par défaut et pour l'export ; TRD §3 mis à jour.
- [x] **2.1.2** Interfaces `Action` et union `ActionElement` (8 types). [TRD §3]
  - Note : —
- [x] **2.1.3** Interfaces de partie : `PlaySession`, `SceneState` (dont `paused` et `volume` des sons), `FeedItem`. [TRD §3, PRS-04]
  - Note : —

### 2.2 Contrat d'accès

- [x] **2.2.1** Écrire l'interface `DataRepository` complète et le token `DATA_REPOSITORY`. [TEC-21, TEC-22]
  - Note : ℹ️ Info : ajout de `core/data/data-error.ts` : classe `DataError` avec un `code` et une `messageKey` de traduction (`error.data.<code>`), pour que les écrans affichent un message clair sans connaître IndexedDB.
- [x] **2.2.2** Déclarer le fournisseur unique dans `app.config.ts`. [TEC-22]
  - Note : ℹ️ Info : `useExisting` (au lieu de `useClass` du TRD) garantit une seule instance, donc une seule connexion à la base, même si une classe injecte `IndexedDbRepository` directement.

### 2.3 Implémentation IndexedDB

- [x] **2.3.1** Installer `idb`, ouvrir la base, schéma v1 (stores et index du TRD §4.2) dans `upgrade`. [TEC-20, TEC-25]
  - Note : ⚠️ Alerte : index `mediaId` ajouté sur `battlemaps` et `soundNodes` (absent du TRD §4.2) : il permet de savoir rapidement si un média est encore utilisé avant de le supprimer (2.4.3). TRD §4.2 mis à jour.
- [x] **2.3.2** Méthodes projets (liste, lecture, sauvegarde, suppression en cascade dans une seule transaction). [TRD §4.2]
  - Note : —
- [x] **2.3.3** Méthodes arborescence des scènes, scènes, battlemaps, actions. [TRD §4.1]
  - Note : ℹ️ Info : `deleteSceneNode` nettoie aussi `Project.firstSceneId` et `Scene.nextSceneIds` des autres scènes ; `deleteBattlemap` vide `Scene.defaultBattlemapId`. ✅ Décision (Allan) : les éléments « Changer de scène » qui visent une scène supprimée sont conservés tels quels et **signalés à l'écran** (éditeur et Présentation, cf. 8.3.6, 9.3.4, 10.3.7) ; le dépôt ne les modifie pas. ℹ️ Info : l'interdiction de supprimer l'action « Texte de scène » est appliquée par l'éditeur (lot 7), pas par le dépôt, qui doit pouvoir la supprimer avec sa scène.
- [x] **2.3.4** Méthodes bibliothèques de sons (globale et par projet). [SON-01]
  - Note : ℹ️ Info : les éléments « Lancer / Arrêter un son » qui visent un son supprimé restent en l'état et sont signalés à l'affichage (même principe que PRS-07).
- [x] **2.3.5** Méthodes partie sauvegardée (lecture, sauvegarde, suppression). [PRS-04]
  - Note : —

### 2.4 Médias

- [x] **2.4.1** `uploadMedia` : contrôle du type MIME, copie en `Blob` dans le store `media`. [TEC-30, TEC-31, TEC-34]
  - Note : ⚠️ Alerte : en test, fake-indexeddb ne sait pas copier les `Blob` de jsdom ; l'utilitaire `src/testing/node-blob.ts` utilise ceux de Node pendant les tests de médias (ajout de `@types/node` en dépendance de dev). Aucun impact dans le navigateur.
- [x] **2.4.2** Gestion de `QuotaExceededError` (échec propre, message d'erreur). [TRD §5]
  - Note : ⚠️ Alerte : les utilitaires de test (`src/testing`) sont exclus de `tsconfig.app.json` et inclus dans `tsconfig.spec.json`, sinon `ng build` compilait du code de test.
- [x] **2.4.3** Suppression d'un média uniquement s'il n'est plus référencé. [TRD §4.2]
  - Note : —
- [x] **2.4.4** `MediaUrls` : cache `mediaId → blob:` avec compteur de références et `revokeObjectURL`. [TEC-32, TEC-33]
  - Note : ℹ️ Info : API ajoutée à `MediaUrls` (TRD §5) : `track(() => mediaId)` renvoie les signals `url` et `missing`, suit le changement d'id et libère tout seul à la destruction du composant. Une URL non `blob:` (future API distante) n'est pas révoquée.
- [x] **2.4.5** Demande `navigator.storage.persist()` au démarrage. [TEC-26, NF-12]
  - Note : ⚠️ Alerte : Chrome et Edge accordent ou refusent le stockage persistant sans rien demander ; Firefox affiche une demande d'autorisation dès l'ouverture de l'application. Si c'est gênant, on pourra déplacer la demande au premier import de fichier.

### 2.5 Tests

- [x] **2.5.1** Tests unitaires de chaque méthode du dépôt avec `fake-indexeddb` (dont les suppressions en cascade). [TEC-81]
  - Note : ℹ️ Info : nouvelle commande `npm run test:coverage` (ajout de `@vitest/coverage-v8`).
- [x] **2.5.2** Tests de `MediaUrls` (création, partage, libération des URL) ; vérifier qu'aucun autre fichier n'importe `idb`. [TEC-23]
  - Note : ℹ️ Info : vérification de TEC-23 rendue **automatique** par ESLint : `no-restricted-imports` interdit `idb` et `no-restricted-globals` interdit `indexedDB` partout, sauf dans `src/app/core/data` et `src/testing`.

**Critère de fin** : toutes les méthodes du contrat sont testées ; aucun autre code n'importe `idb`.

> ✅ Lot 2 validé : `ng build`, `ng test` (74 tests), `ng lint` (dont la règle TEC-23), `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : `idb`, et pour les tests `@types/node`, `@vitest/coverage-v8`). TRD mis à jour (§3 `Media.fileName`, §4.1 `useExisting` et `DataError`, §4.2 index `mediaId` et nettoyage des références, §5 API de `MediaUrls`). Une question reste ouverte en 2.3.3 (éléments « Changer de scène » vers une scène supprimée).

---

## Lot 3 — Composants partagés

### 3.1 Composants d'interface de base (`shared/ui`)

- [x] **3.1.1** Boutons : principal, secondaire, plein, discret, ajout, danger, danger fort, icône. [Brief §6.1]
  - Note : ℹ️ Info : rayon `2xl` renommé `xxl` (Stylelint lisait `2xl` comme une unité). Page de démonstration temporaire `/dev/components` créée, à compléter à chaque composant.
- [x] **3.1.2** Pastilles (action, scène suivante avec « × », badge « Par défaut »). [Brief §6.5]
  - Note : ℹ️ Info : « Arrêter un son » partage la couleur de « Arrêter tous les sons » (`ELEMENT_TONES`).
- [x] **3.1.3** Champs : texte, zone de texte, case à cocher, radio, curseur, contrôle segmenté. [Brief §6.2, §6.3]
  - Note : —
- [x] **3.1.4** Section repliable (chevron, titre, résumé, action dans l'en-tête, état mémorisable). [Brief §6.6]
  - Note : —
- [x] **3.1.5** Fenêtre modale (en-tête, contenu, pied) via CDK Dialog. [Brief §6.9]
  - Note : —
- [x] **3.1.6** Fenêtre de confirmation (variante destructive). [Brief §6.9, NF-31]
  - Note : —
- [x] **3.1.7** Message d'erreur / notification (couleurs danger). [Brief §6.14, NF-25]
  - Note : —
- [x] **3.1.8** Menu / liste déroulante (CDK Menu / Overlay). [Brief §6.8]
  - Note : —
- [x] **3.1.9** Visuel de remplacement quadrillé (jetons `--placeholder-*`). [Brief §6.15]
  - Note : —

### 3.2 Composant d'arborescence générique

- [x] **3.2.1** Construire l'arbre à partir de la liste plate (`computed`), plier / déplier. [TEC-60, TRD §8]
  - Note : ℹ️ Info : classe `Tree<T extends TreeNode>` (nom CLI, sans le suffixe `Component` du TRD). Un nœud dont le parent est introuvable est ramené à la racine plutôt que perdu. Rendu en liste aplatie (plus simple pour le glisser-déposer et le clavier).
- [x] **3.2.2** Sélection d'une ligne, style sélectionné, `itemTemplate` fourni par le parent. [TEC-61]
  - Note : —
- [x] **3.2.3** Création, renommage en place, suppression (outputs génériques). [SCN-08 à 11]
  - Note : —
- [x] **3.2.4** Menu contextuel : bouton « ⋯ » au survol / focus + clic droit, entrées communes et `extraMenuItems`, libellés via `labels`. [TEC-61, SCN-09]
  - Note : ℹ️ Info : option `hidden?(node)` des `extraMenuItems` ajoutée au TRD, pour masquer une entrée selon le nœud (ex. « Définir comme première scène » sur la scène déjà première).
- [x] **3.2.5** Glisser-déposer pour déplacer et réordonner (CDK Drag & Drop), dans un dossier ou à la racine. [SCN-02]
  - Note : ⚠️ Alerte : jsdom ne sait pas simuler le glisser ; le composant lui-même est donc testé dans le navigateur, la logique (`computeMove()`, `applyMove()`) par des tests unitaires.
- [x] **3.2.6** Mode lecture seule (`editable = false`) et modes de sélection (`selectionMode`, `disabledIds`). [TEC-61]
  - Note : —
- [x] **3.2.7** Navigation clavier et attributs ARIA (`tree`, `treeitem`, `aria-expanded`). [Brief §8]
  - Note : —
- [x] **3.2.8** Tests unitaires du composant. [TEC-82]
  - Note : —

### 3.3 Fenêtre de sélection

- [x] **3.3.1** Fenêtre réutilisable : arborescence en lecture seule + champ de recherche + compteur. [SCN-04]
  - Note : —
- [x] **3.3.2** Modes sélection multiple (pré-cochés, éléments désactivés) et sélection unique. [SCN-04, ACT-09]
  - Note : —

### 3.4 Dépôt de fichiers

- [x] **3.4.1** Directive `appFileDrop` : événements de glisser au niveau de la fenêtre, uniquement pour les fichiers (`dataTransfer.types`), compteur d'entrées / sorties. [TEC-35]
  - Note : —
- [x] **3.4.2** Calque plein écran (nombre de fichiers, destination, formats). [Brief §6.13]
  - Note : —
- [x] **3.4.3** Filtrage des formats acceptés et signalement des fichiers refusés. [TEC-34]
  - Note : ℹ️ Info : ajouts au TRD : sortie `filesRejected` et entrée `appFileDropNotify` (notification d'erreur qui nomme les fichiers refusés, désactivable).

**Critère de fin** : arborescence et fenêtre de sélection fonctionnent avec des données de test ; le calque de dépôt s'affiche et filtre les formats.

> ✅ Lot 3 validé : `ng build`, `ng test` (142 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Tous les composants sont réunis sur la page temporaire `/dev/components` avec des données de test, vérifiés dans les deux thèmes. Écarts au TRD : noms CLI sans suffixe (`Tree`, `SelectionDialog`, `Selections`), option `hidden` des entrées de menu, sorties `filesRejected` et entrées `appFileDropKinds` / `appFileDropNotify` de la directive de dépôt.

---

## Lot 4 — Tranche verticale

- [x] **4.1** Accueil minimal : liste des projets et création d'un projet. [PRJ-01]
  - Note : ℹ️ Info : ajouts hors TRD : composant partagé `app-header`, `provideFrenchLocale()` (`core/i18n/locale.ts`), `withComponentInputBinding()` (paramètres de route en inputs), utilitaire de test `useTestRepository()`.
- [x] **4.2** Ouverture d'un projet en mode Édition et en mode Présentation (navigation). [PRJ-03]
  - Note : —
- [x] **4.3** Éditeur minimal : création d'une scène unique, marquée première scène. [SCN-03]
  - Note : ℹ️ Info : `EditorStore` est fourni par `EditorPage` (une instance par écran, `@Injectable()` sans `providedIn`) : exception voulue à `@Service()`, qui est global.
- [x] **4.4** Champ texte de scène : création automatique de l'action « Texte de scène » à la première saisie, mise à jour ensuite. [SCN-05, SCN-06]
  - Note : ℹ️ Info : les écritures sont enchaînées une à une (une frappe rapide ne crée jamais deux actions) et le champ n'est initialisé qu'à l'ouverture de la scène (un enregistrement en retard ne peut pas écraser la saisie en cours).
- [x] **4.5** Enregistrement automatique des modifications. [—]
  - Note : ⚠️ Alerte : à la fermeture brutale de l'onglet, le navigateur peut interrompre l'écriture IndexedDB en cours ; au pire, les 500 dernières millisecondes de frappe sont perdues.
- [x] **4.6** `ActionRunner` limité à l'élément « Ajouter un texte ». [TEC-50]
  - Note : —
- [x] **4.7** `PresentationEngine` minimal : ouverture de la première scène, lancement des actions d'ouverture. [PRS-01]
  - Note : ℹ️ Info : sans première scène définie, la Présentation ouvre la première scène de l'arborescence dans l'ordre d'affichage.
- [x] **4.8** Écran de Présentation minimal : fil d'actualité affichant le texte. [FIL-01, FIL-02]
  - Note : ⚠️ Alerte (corrigée) : une classe CSS `.play` de l'écran s'appliquait aussi à l'en-tête, qui a la même classe → en-tête de 300 px. La zone centrale s'appelle maintenant `.stage` et la variante de l'en-tête `.app-header--play`.
- [x] **4.9** Vérification : après rechargement du navigateur, le projet et la scène sont toujours là. [NF-10]
  - Note : —

**Critère de fin** : projet créé → texte de scène écrit → Présentation lancée → texte affiché dans le fil.

> ✅ Lot 4 validé : scénario complet vérifié dans Chromium, dans les deux thèmes (projet créé → première scène → texte saisi → Présentation → texte dans le fil, et toujours là après rechargement). `ng build`, `ng test` (175 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : composant partagé `app-header`, `EditorStore` (état de l'éditeur, fourni par l'écran), `DebouncedTask`, `provideFrenchLocale()`, utilitaire de test `useTestRepository()`. Pas de nouvelle dépendance.

---

## Lot 5 — Projets et paramètres

### 5.1 Accueil

- [x] **5.1.1** Grille de cartes adaptative (`auto-fill`, `minmax(320px, 1fr)`). [TEC-93]
  - Note : —
- [x] **5.1.2** Carte de projet : vignette, nom, statistiques, date de modification, dernière scène jouée, boutons Éditer / Présenter. [PRJ-01]
  - Note : —
- [x] **5.1.3** Pastille « Partie en cours » si une partie est sauvegardée. [PRS-02]
  - Note : ℹ️ Info : nouvelle couleur de pastille `active` (couleurs « Actif » du Brief §2.5).
- [x] **5.1.4** Carte « Créer un projet » en dernière position. [PRJ-01]
  - Note : —
- [x] **5.1.5** Renommer un projet. [PRJ-01]
  - Note : —
- [x] **5.1.6** Supprimer un projet avec confirmation (suppression en cascade). [PRJ-02, NF-31]
  - Note : —

### 5.2 Paramètres › Apparence

- [x] **5.2.1** Accès depuis l'en-tête (icône réglages). [NF-33]
  - Note : ✅ Décision : les Paramètres sont un écran à part (route `/settings`) plutôt qu'une modale, pour accueillir d'autres sections plus tard. Accès par l'icône réglages en haut à droite de l'accueil.
- [x] **5.2.2** Cartes d'aperçu des thèmes construites à partir des jetons de chaque thème. [NF-33, NF-34]
  - Note : —
- [x] **5.2.3** Changement immédiat et mémorisé ; vérifier qu'ajouter un thème ne demande qu'un fichier. [NF-35]
  - Note : ⚠️ Alerte : NF-35 est respecté pour les écrans (aucun écran à modifier), mais un nouveau thème demande en pratique 1 fichier SCSS + 3 branchements courts (`styles.scss`, `THEMES`/`ThemeId`, nom dans `fr.json`). `npm run check:themes` vérifie ces branchements et signale précisément ce qui manque.

> ✅ Lot 5 validé : vérifié dans Chromium, dans les deux thèmes (pastille « Partie en cours », renommage, suppression avec confirmation et notification, Paramètres › Apparence avec changement de thème au clic et au clavier, conservé après rechargement). `ng build`, `ng test` (190 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : couleur de pastille `active`, `ProjectSummary` / `loadProjectSummary()`, `pluralKey()`, composant `ThemePreview`, route `/settings`, contrôle des branchements de thème dans `check:themes`. Pas de nouvelle dépendance.

---

## Lot 6 — Bibliothèques de sons

- [x] **6.1** Écran Sons et en-tête de navigation (Scènes / Sons du projet ; accès à la bibliothèque globale depuis l'accueil). [SON-01]
  - Note : ✅ Décision : un seul écran pour deux routes, projet (sons du projet + bibliothèque globale) et global (bibliothèque globale seule). La route projet est ajoutée au TRD §2.3 (elle n'y figurait pas). Navigation par le composant partagé `ProjectNav` (`shared/project-nav`). Accès à la bibliothèque globale depuis l'accueil : bouton dans l'en-tête, à gauche des réglages.
- [x] **6.2** Arborescences « Ce projet » et « Bibliothèque globale » (composant générique, libellés propres aux sons). [SON-04, TEC-61] ✅ Décision (Allan, 11/11/2026) : les arborescences montrent désormais aussi les **sons** de chaque dossier (icône note de musique). Choisir un son ouvre son dossier et met sa ligne du tableau en évidence ; un son se renomme, se supprime (avec avertissement s’il est utilisé) et se déplace d’un dossier à l’autre par glisser-déposer dans l’arborescence (`SoundLibraryStore.select`, `selectedSoundId`, `move` sur tous les nœuds).
  - Note : ℹ️ Info : deux entrées génériques ajoutées à `app-tree` (TEC-61) : `canCreateItems` (masque « Nouvel élément ») et `folderTone` (icônes `--folder-global` pour la bibliothèque globale). ✅ Décision (Allan) : le nombre de sons à droite de chaque dossier, présent sur la maquette, n'est pas affiché ; ce n'est pas une information importante.
- [x] **6.3** Tableau des sons du dossier ouvert : nom, durée, format, « Utilisé dans ». [SON-03]
  - Note : ⚠️ Alerte : ajouts au contrat de données (TRD §3 et §4.1 mis à jour) : `Media.durationMs?`, `getMediaInfo(ids)` (infos d'un média sans le `Blob`), `countSoundUsages()` (devenu `countLibraryUsages()`) et `uploadMedia(file, details?)`. Pas de changement de schéma IndexedDB (champ facultatif, pas d'index).
- [x] **6.4** Recherche dans la bibliothèque. [—]
  - Note : —
- [x] **6.5** Import par le bouton « Importer des sons » (sélection multiple). [SON-02]
  - Note : —
- [x] **6.6** Import par glisser-déposer depuis le disque (dossier ouvert = destination). [SON-06]
  - Note : —
- [x] **6.7** Lecture de la durée des fichiers à l'import. [SON-03]
  - Note : ℹ️ Info : les sons importés avant cette tâche n'ont pas de durée (« — »).
- [x] **6.8** Renommer un son. [SON-03]
  - Note : ℹ️ Info (11/11/2026) : nom et champ dans le sous-composant `SoundName` ; pendant le renommage, le nom reste en place (masqué) et le champ se pose par-dessus en position absolue : la hauteur de la ligne et la largeur de la colonne ne changent plus (demande d'Allan). Sortir ce composant garde l'écran sous le budget de styles de 4 ko.
- [x] **6.9** Supprimer un son (confirmation, avertissement s'il est utilisé). [NF-31]
  - Note : ✅ Décision (Allan) : il faut avertir dès qu'on supprime un son utilisé, y compris à travers un **dossier** : la confirmation de suppression d'un dossier indique alors combien de ses sons sont utilisés (`folderUsage` ; nouvelle entrée générique `deleteMessage` d'`app-tree` pour un message propre au nœud). Les éléments d'action ne sont pas modifiés (PRS-07). ✅ Décision (Allan, 11/11/2026) : la confirmation se valide par **appui long de 3 s** sur « Supprimer » (`holdToConfirm: true` de `Modals.confirm()`, directive `appHoldToConfirm`) ; un clic simple affiche un message sous les boutons (`common.hold.tooShort`). ℹ️ Info : la suppression d'un son depuis le menu de l'arborescence (et celle d'un dossier) garde la confirmation par clic.
- [x] **6.10** Pré-écoute avec barre de progression (lecture simple). [SON-05]
  - Note : ✅ Décision : pré-écoute par `HTMLAudioElement`, sans Web Audio ; le lecteur de la Présentation (volume, boucle, fondus) est un autre service (lot 9).
- [x] **6.11** Test avec un projet volumineux (nombreux sons, longues ambiances) pour vérifier le quota. [Plan §6]
  - Note : ✅ Décision (correctif issu du test de 276 Mo) : un import interrompu par le quota annonce aussi les sons déjà importés (« 1 son importé… » + message de quota) : `importFiles` renvoie l'erreur dans `failure` au lieu de la lever. ⚠️ Alerte : `navigator.storage.estimate()` sous-estime nettement l'espace occupé par les `Blob` dans Chromium (21 Mo annoncés pour 212 Mo de WAV) : ne pas s'en servir pour afficher un espace restant fiable. ℹ️ Info : le bouton de pré-écoute est devenu un petit composant `ListenButton` (budget de 4 ko de styles par composant dépassé sinon).


> ✅ Lot 6 validé : écran Sons vérifié dans Chromium, dans les deux thèmes (navigation Scènes / Sons, arborescences des deux bibliothèques, tableau, recherche, import par bouton et par dépôt avec lecture de la durée, renommage, suppression avec avertissement, pré-écoute) et avec un projet de 276 Mo (6.11). `ng build` (sans avertissement de budget), `ng test` (229 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD, reportés dans le TRD (§2.3, §3, §4.1) : route `/projects/:projectId/sounds`, `Media.durationMs`, `getMediaInfo`, `countSoundUsages`, `uploadMedia(file, details)`. Autres ajouts : `ProjectNav`, `SoundLibraryStore`, `SoundPreview`, `ListenButton`, `AudioDuration`, `formatDuration`, `formatLabel`, entrées `canCreateItems` / `folderTone` / `deleteMessage` de `app-tree`, jeton `layout(search)`. Pas de nouvelle dépendance.
---

## Lot 7 — Éditeur de scène

### 7.1 Structure et arborescence

- [x] **7.1.1** Mise en page : en-tête, arborescence à gauche, zone centrale, volet droit défilant. [SCN-13, Brief §7]
  - Note : —
- [x] **7.1.2** Arborescence des scènes : dossiers, scènes, boutons Nouveau dossier / Nouvelle scène. [SCN-01, SCN-08]
  - Note : ✅ Décision : comme un clic sur un dossier le plie / déplie sans le sélectionner (SCN-10), « le dossier sélectionné » de SCN-08 est **le dossier de la scène ouverte** (racine sinon). Première scène signalée par une étoile pleine (maquette) au lieu de la pastille « 1re ».
- [x] **7.1.3** Menu des scènes : renommer, définir comme première scène (étoile), supprimer ; menu des dossiers. [SCN-03, SCN-09, SCN-11]
  - Note : ℹ️ Info : les entrées propres au parent (« Définir comme première scène ») n'ont pas d'icône dans le menu ; l'arborescence n'en prévoit pas pour l'instant.
- [x] **7.1.4** Déplacement et réordonnancement par glisser-déposer. [SCN-02]
  - Note : —
- [x] **7.1.5** (Optionnel) Dupliquer une scène avec ses battlemaps et actions. [SCN-12]
  - Note : ℹ️ Info : les battlemaps copiées partagent la même image (le média n'est effacé que s'il n'est plus utilisé) ; scènes suivantes et cibles de « Changer de scène » ne sont pas modifiées.

### 7.2 Zone centrale

- [x] **7.2.1** Titre de la scène (modifiable). [—]
  - Note : —
- [x] **7.2.2** Champ texte de scène sans libellé visible (libellé d'accessibilité). [SCN-05]
  - Note : —
- [x] **7.2.3** Textes des actions : un champ modifiable par élément « Ajouter un texte », avec pastille du nom de l'action. [SCN-07]
  - Note : ✅ Décision (Allan) : la pastille du nom de l'action est remplacée par un sous-titre `<h3 class="action-title">` (police des titres, `font-size(dialog)`, plus petit que le titre de la scène, qui est le `<h2>`).

### 7.3 Volet droit

- [x] **7.3.1** Partie Actions : liste par déclencheur, résumé des éléments, action « Texte de scène » verrouillée, bouton « Nouvelle ». [SCN-06, SCN-13]
  - Note : ℹ️ Info : une cible supprimée (son, battlemap, scène) est signalée en rouge sur la carte de l'action (PRS-07, décision d'Allan). ⚠️ Alerte : budget du bundle initial relevé de 500 à **600 ko** (avertissement ; erreur toujours à 1 Mo) dans `angular.json` : toutes les icônes Lucide utilisées, même dans les écrans chargés à la demande, finissent dans le bundle principal.
- [x] **7.3.2** Réordonner les actions d'un même déclencheur. [—]
  - Note : ⚠️ Alerte : pas encore d'alternative au clavier pour réordonner (le CDK ne la fournit pas) ; à prévoir si besoin (boutons Monter / Descendre).
- [x] **7.3.3** Partie Battlemaps : miniatures en grille, badge « Par défaut ». [BTM-02]
  - Note : —
- [x] **7.3.4** Import d'images par bouton et par glisser-déposer sur l'éditeur. [BTM-01, BTM-04]
  - Note : —
- [x] **7.3.5** Définir la battlemap par défaut, renommer, supprimer une battlemap. [BTM-02]
  - Note : ✅ Décision : comme pour les sons (règle d'Allan), la suppression **avertit** si des actions de la scène affichent la battlemap ; ces éléments ne sont pas modifiés (PRS-07). ✅ Décision : si la battlemap supprimée était celle par défaut, la première restante le devient (BTM-02 : une scène qui a des battlemaps en a toujours une par défaut).
- [x] **7.3.6** Partie Enchaînement : case « Première scène du projet ». [SCN-03]
  - Note : ℹ️ Info : décocher la case laisse le projet sans première scène (la Présentation ouvre alors la première de l'arborescence).
- [x] **7.3.7** Scènes suivantes : pastilles, retrait, « + Ajouter » ouvrant la fenêtre de sélection multiple. [SCN-04]
  - Note : —
- [x] **7.3.8** État plié / déplié des parties mémorisé comme préférence. [SCN-13, TEC-62]
  - Note : —
- [x] **7.3.9** Vérifier le rendu dans les deux thèmes. [Brief §11]
  - Note : —


> ✅ Lot 7 validé : éditeur de scène vérifié dans Chromium, dans les deux thèmes, avec un projet de démonstration (3 actes, 5 scènes, actions, battlemaps, sons). `ng build` (sans avertissement, budget initial relevé à 600 ko, cf. 7.3.1), `ng test` (258 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts : `EditorStore` étendu (arborescence, duplication, textes d'action, actions, battlemaps, enchaînement), composants `ActionsPanel`, `BattlemapsPanel`, `BattlemapCard`, `SequencePanel`, `action-summary.ts`, `baseName()`. Restent pour le lot 8 : bouton « Nouvelle » et ouverture d'une action. Pas de nouvelle dépendance.
---

## Lot 8 — Éditeur d'action

### 8.1 Fenêtre d'édition

- [x] **8.1.1** Fenêtre modale : nom, déclencheur (contrôle segmenté), Annuler / Enregistrer. [ACT-01, ACT-02]
  - Note : ✅ Décision : « Texte de scène » garde toujours le déclencheur « Ouverture de la scène » (contrôle désactivé + explication). ✅ Décision : fermeture seulement par Annuler / × / Enregistrer (pas par Échap ni clic à côté), pour ne pas perdre une saisie ; Annuler abandonne sans confirmation.
- [x] **8.1.2** Suppression de l'action (confirmation ; impossible pour « Texte de scène »). [SCN-06, NF-31]
  - Note : —
- [x] **8.1.3** Formulaire pilote en Signal Forms pour valider l'approche avant les 8 types. [TEC-06, Plan §6]
  - Note : ✅ Décision : approche Signal Forms validée. Enseignements : (1) modèle = `signal` d'une **copie de travail** + `form(draft, schema)` ; (2) validation dans le schéma : `validate()` pour « obligatoire » (refuse aussi les espaces seuls, que `required()` laisse passer), `maxLength()` (l'attribut `maxlength` est **interdit** sur un champ `[formField]`, erreur NG8022) ; (3) `disabled(path, () => …)` se transmet tout seul à un contrôle maison qui a une entrée `disabled` (`FormValueControl`) ; (4) messages d'erreur = **clés de traduction** ; (5) `[formField]` ne pose pas `aria-invalid` : l'ajouter nous-mêmes ; (6) erreurs montrées après `markAsTouched()`.

### 8.2 Liste des éléments

- [x] **8.2.1** Liste ordonnée réordonnable par glisser-déposer (poignée). [ACT-03]
  - Note : ⚠️ Alerte : comme pour les actions (7.3.2), pas encore d'équivalent au clavier pour réordonner.
- [x] **8.2.2** Carte d'élément dépliable : icône et couleur du type, résumé replié, boutons Supprimer / Replier. [ACT-03, Brief §2.6]
  - Note : ✅ Décision (Allan) : un clic n'importe où sur l'en-tête déplie / replie la carte (pas seulement la flèche) : la zone de clic du bouton flèche (`.card__toggle::after`) couvre l'en-tête, poignée et Supprimer passent au-dessus ; le bouton reste le seul élément focalisable. Non testable dans jsdom (pas de calcul de position).
- [x] **8.2.3** Menu « Ajouter un élément » (8 types). [ACT-03]
  - Note : ✅ Décision (Allan) : à l'ajout, tous les autres éléments se replient (seul le nouvel élément est déplié).

### 8.3 Formulaires des éléments

- [x] **8.3.1** Afficher une battlemap : choix par miniature. [ACT-04]
  - Note : —
- [x] **8.3.2** Lancer un son : sélecteur de son (fenêtre de sélection), volume, boucle, fondus. [ACT-05]
  - Note : ✅ Décision : une valeur invalide (vide, hors bornes) affiche son erreur sous le champ mais n'est pas reportée dans l'élément, qui garde sa dernière valeur valide. ⚠️ Alerte : le fond des fenêtres est opaque (`--bg-backdrop`) ; une fenêtre ouverte depuis une autre masquait l'éditeur d'action. Les fonds suivants sont désormais transparents (`styles/components/_overlay.scss`).
- [x] **8.3.3** Arrêter un son : sélecteur de son, aide sur le fondu. [ACT-06]
  - Note : —
- [x] **8.3.4** Arrêter tous les sons : texte explicatif. [ACT-07]
  - Note : —
- [x] **8.3.5** Ajouter un texte : zone de texte. [ACT-08]
  - Note : —
- [x] **8.3.6** Changer de scène : sélection unique de la scène cible + avertissement ; si la scène cible a été supprimée, l'élément est signalé (« Scène supprimée ») et le MJ peut en choisir une autre. [ACT-09, PRS-07]
  - Note : —
- [x] **8.3.7** Attendre : durée en secondes (nombre positif). [ACT-10]
  - Note : —
- [x] **8.3.8** Clic de l'utilisateur : texte obligatoire. [ACT-11]
  - Note : —

### 8.4 Validation et finitions

- [x] **8.4.1** Validation globale (champs obligatoires, valeurs numériques) avant enregistrement. [—]
  - Note : ✅ Décision : une cible **supprimée** (scène, son, battlemap) n'empêche pas l'enregistrement : elle reste signalée (PRS-07, décision d'Allan) ; seule une cible jamais choisie bloque. ⚠️ Alerte : Signal Forms marque les objets des listes d'une clé `Symbol` ; l'éditeur renvoie une copie (`structuredClone`).
- [x] **8.4.2** Mise à jour immédiate de la zone centrale et du volet de l'éditeur de scène après enregistrement. [SCN-07]
  - Note : —
- [x] **8.4.3** Vérifier le rendu dans les deux thèmes. [Brief §11]
  - Note : —
- [x] **8.4.4** Jalon J3 : saisir un scénario de test (≥ 10 scènes, battlemaps, sons, actions). [PRD §7]
  - Note : ℹ️ Info : la carte de l'accueil ne compte que les sons du projet, pas ceux de la bibliothèque globale.


> ✅ Lot 8 validé : éditeur d'action complet (nom, déclencheur, éléments réordonnables, formulaires des 8 types, validation globale) vérifié dans Chromium dans les deux thèmes ; jalon **J3** atteint avec un scénario de 11 scènes saisi par l'interface (cf. 8.4.4). `ng build` (sans avertissement), `ng test` (289 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Ajouts : `ActionEditor`, `ElementCard`, `ElementForm`, `element-types.ts`, `element-validation.ts`, `sound-choice.ts` ; fenêtres empilées (fond opaque sur la première seulement). Pas de nouvelle dépendance, rien à faire côté Allan. Pas d'écart au TRD.
---

## Lot 9 — Moteur de présentation et audio (sans interface)

### 9.1 ActionRunner

- [x] **9.1.1** Exécution séquentielle des éléments, signal d'annulation (`AbortController`). [TEC-50, TEC-51]
  - Note : ℹ️ Info : écart de forme au TRD §6.2 : le runner ne fait pas lui-même `engine.goToScene()` ; il renvoie la scène cible (`RunOutcome`) et le moteur l'ouvre (évite qu'une action annule son propre signal).
- [x] **9.1.2** Éléments Ajouter un texte (sans doublon à la relance) et Afficher une battlemap. [ACT-04, ACT-08, CTL-03]
  - Note : ✅ Décision : afficher la battlemap **déjà affichée** n'ajoute pas de miniature en double ; la battlemap par défaut à l'ouverture d'une scène n'est pas ajoutée au fil (ce n'est pas un « changement »).
- [x] **9.1.3** Éléments sonores : lancer, arrêter, arrêter tous. [ACT-05 à 07]
  - Note : ✅ Décision : un même son ne joue qu'une fois à la fois ; le relancer remplace la lecture en cours.
- [x] **9.1.4** Attendre (annulable). [ACT-10]
  - Note : —
- [x] **9.1.5** Clic de l'utilisateur : promesse résolue au clic, rejetée à l'annulation. [ACT-11, FIL-05]
  - Note : ✅ Décision : un bloc en attente créé par l'action interrompue est **retiré du fil** (l'action n'est pas effectuée et pourra être relancée) ; à la relance d'une action, son bloc déjà présent est réutilisé (pas de doublon). Un bloc resté en attente après une fermeture brutale est retiré à la reprise (précisé en 12.1).
- [x] **9.1.6** Changer de scène (fin de l'action). [ACT-09]
  - Note : —
- [x] **9.1.7** Marquage des actions effectuées et relance. [CTL-01 à 03]
  - Note : —

### 9.2 PresentationEngine

- [x] **9.2.1** Ouverture d'une scène jamais visitée : battlemap par défaut, actions d'ouverture dans l'ordre (« Texte de scène » en premier). [TRD §6.3]
  - Note : —
- [x] **9.2.2** Quitter une scène : annulation des actions, sons coupés en fondu, sauvegarde. [CTL-06]
  - Note : —
- [x] **9.2.3** Retour sur une scène visitée : restauration de l'état sans relancer les actions d'ouverture. [PRS-06]
  - Note : —
- [x] **9.2.4** Changement de battlemap (action ou sélecteur) et ajout au fil. [FIL-03, CTL-07]
  - Note : —
- [x] **9.2.5** Signals exposés : scène, fil, battlemap, actions disponibles / effectuées, sons. [TRD §6.1]
  - Note : ⚠️ Alerte : dans `GmScreenPage`, l'`effect` qui démarre le moteur doit l'appeler dans `untracked()` : sinon il suit les signals lus par le moteur et le relance à chaque enregistrement (corrigé).

### 9.3 PlaySessionStore

- [x] **9.3.1** Sauvegarde à chaque événement (élément exécuté, battlemap, son, clic validé). [TEC-52, NF-24]
  - Note : —
- [x] **9.3.2** Continuer : restauration de la dernière scène dans l'état exact. [PRS-05]
  - Note : ✅ Décision : si la dernière scène a été supprimée depuis, la partie reprend sur la première scène.
- [x] **9.3.3** Recommencer : effacement de la partie et retour à la première scène. [PRS-03]
  - Note : —
- [x] **9.3.4** Références vers des éléments supprimés : action ignorée, battlemap, son ou scène cible d'un « Changer de scène » manquants signalés (pas de changement de scène dans ce dernier cas). [PRS-07, NF-25]
  - Note : —

### 9.4 AudioPlayer

- [x] **9.4.1** Prototype Web Audio sur Chrome et Firefox (fondus, pause) avant le reste du service. [Plan §6]
  - Note : ⚠️ Alerte : Firefox n'est pas disponible dans mon environnement : prototype Web Audio **à vérifier par Allan** dans Firefox (fondus, pause, volume, boucle).
- [x] **9.4.2** `AudioContext` unique, créé / repris au premier clic. [TEC-43]
  - Note : —
- [x] **9.4.3** Lecture `<audio>` + `MediaElementAudioSourceNode` + `GainNode`, boucle, volume. [TEC-40, TEC-41]
  - Note : —
- [x] **9.4.4** Fondus en entrée et en sortie. [TEC-42]
  - Note : ℹ️ Info : un son lancé à la main a un fondu de sortie par défaut `DEFAULT_FADE_OUT_MS` = 1 s.
- [x] **9.4.5** Pause / reprise d'un son et volume en direct. [CTL-08, CTL-09]
  - Note : —
- [x] **9.4.6** Pause / reprise globale et signal `anyPlaying`. [CTL-10]
  - Note : —
- [x] **9.4.7** Relance des sons d'une scène restaurée (depuis le début, avec volume et état de pause). [PRS-05]
  - Note : —

### 9.5 Tests

- [x] **9.5.1** Tests de l'`ActionRunner` (séquence, annulation, attente, clic, relance). [TEC-81]
  - Note : —
- [x] **9.5.2** Tests du `PresentationEngine` et du `PlaySessionStore` (scénarios du TRD §6). [TEC-81]
  - Note : —
- [x] **9.5.3** Tests de l'`AudioPlayer` avec Web Audio simulé. [TEC-81]
  - Note : —
- [x] **9.5.4** Tests des références supprimées (dont la scène cible d'un « Changer de scène »). [PRS-07]
  - Note : —

**Critère de fin** : les scénarios du TRD §6 sont couverts par des tests.

> ✅ Lot 9 validé : moteur de présentation complet sans interface (`ActionRunner`, `PresentationEngine`, `PlaySessionStore`, `AudioPlayer`), 41 nouveaux tests (suite : 324). `ng build` (sans avertissement), `ng test`, `ng lint`, `npm run lint:styles` et `npm run format:check` passent ; vérifié dans Chromium sur le scénario Valombre. Écarts au TRD (mis à jour, §6 et §7) : le runner renvoie la scène cible au lieu d'appeler le moteur ; `stopAll()` coupe toujours en fondu. **À faire par Allan** : ouvrir `prototypes/prototype-web-audio.html` dans Firefox (9.4.1). Décisions à confirmer (cf. notes 9.1.2, 9.1.3, 9.1.5, 9.3.2). Pas de nouvelle dépendance.

---

## Lot 10 — Écran de Présentation (PC)

### 10.1 Lancement

- [x] **10.1.1** Fenêtre de lancement : dernière scène, choix « Un seul écran » / « Deux fenêtres ». [AFF-01, AFF-03]
  - Note : —
- [x] **10.1.2** Continuer / Recommencer + confirmation destructive. [PRS-02, PRS-03]
  - Note : ✅ Décision (Allan, 11/11/2026) : plus de fenêtre de confirmation. « Recommencer » se valide en **restant appuyé 3 s** (souris, doigt, Espace ou Entrée ; `RESTART_HOLD_MS`) : le fond du bouton se remplit de gauche à droite (`--hold-progress`, piloté en JS pour rester visible avec `prefers-reduced-motion`) et revient à vide au relâchement. Un clic simple (ou un appui trop court) affiche sous le bouton un message (`role="alert"`). ⚠️ Alerte : avec « Deux fenêtres », la fenêtre joueurs s'ouvre 3 s après le début de l'appui ; Firefox peut alors la bloquer (activation utilisateur expirée), le bouton « Ouvrir la fenêtre joueurs » de l'en-tête permet de l'ouvrir. ℹ️ Info : comportement extrait dans la directive partagée `appHoldToConfirm` (`shared/ui/hold-to-confirm`), réutilisée par la fenêtre de confirmation (6.9).
- [x] **10.1.3** Sans partie sauvegardée : ouverture directe de la première scène (le clic de lancement débloque l'audio). [PRS-01, TEC-43]
  - Note : ✅ Décision : la fenêtre de lancement s'affiche aussi sans partie sauvegardée : elle porte le choix de l'affichage (AFF-03) et fournit le clic qui débloque l'audio (`AudioPlayer.unlock()` appelé dans le gestionnaire du clic, TEC-43).

### 10.2 En-tête

- [x] **10.2.1** Retour, nom du projet, chemin et nom de la scène, pastille « Fenêtre joueurs ouverte ». [—]
  - Note : —
- [x] **10.2.2** « Aller à une scène » : navigation libre via l'arborescence en lecture seule. [CTL-05]
  - Note : —

### 10.3 Fil d'actualité

- [x] **10.3.1** Bloc texte (police narrative). [FIL-02]
  - Note : —
- [x] **10.3.2** Miniature de battlemap cliquable + modale plein écran. [FIL-03, FIL-04]
  - Note : ℹ️ Info : nouvelle taille de fenêtre `xl` (jeton `layout(modal-xl)` = 1400 px, bornée à l'écran).
- [x] **10.3.3** Bloc « Clic de l'utilisateur » avec bouton « Cliquer pour continuer » en bas à droite ; état validé. [FIL-05]
  - Note : —
- [x] **10.3.4** Défilement automatique du nouvel élément en haut de l'écran. [FIL-06]
  - Note : ⚠️ Alerte : jsdom ne calcule pas les positions : le défilement est vérifié dans Chromium, pas en test unitaire.
- [x] **10.3.5** Éléments précédents estompés, relecture du fil, bouton « Revenir au dernier élément ». [FIL-07]
  - Note : —
- [x] **10.3.6** Défilement jusqu'au texte existant lors d'une relance. [CTL-03]
  - Note : —
- [x] **10.3.7** Affichage des erreurs (battlemap manquante, scène cible supprimée…) sans bloquer la partie. [PRS-07, NF-25]
  - Note : —

### 10.4 Navigation entre scènes

- [x] **10.4.1** Bouton flottant « Scène suivante » : ouverture directe s'il n'y a qu'une scène. [CTL-04]
  - Note : ✅ Décision (Allan) : avec une seule scène suivante, le bouton affiche son nom (tronqué s'il est long ; `aria-label` « Scène suivante : <nom> »).
- [x] **10.4.2** Liste déroulante si plusieurs scènes suivantes. [CTL-04]
  - Note : —

### 10.5 Panneau de contrôle

- [x] **10.5.1** Trois parties repliables avec résumé dans l'en-tête, état mémorisé. [CTL-11]
  - Note : —
- [x] **10.5.2** Battlemap : aperçu, choix parmi les battlemaps de la scène. [CTL-07]
  - Note : —
- [x] **10.5.3** Actions : actions manuelles disponibles, action en cours, masquage des actions effectuées. [CTL-01]
  - Note : ✅ Décision (Allan) : l'avancement « 4/5 » d'une action en cours (maquette) n'est **pas affiché** pour le moment ; s'il est ajouté plus tard : élément démarré / nombre total, remis à 1 à la relance.
- [x] **10.5.4** « Voir toutes les actions » et relance d'une action effectuée. [CTL-02, CTL-03]
  - Note : —
- [x] **10.5.5** Sons : cartes des sons en cours, pause / reprise, carte dépliée avec volume. [CTL-08, CTL-09]
  - Note : —
- [x] **10.5.6** Bouton global lecture / pause dans l'en-tête de la partie Sons. [CTL-10]
  - Note : —
- [x] **10.5.7** « Lancer un son » via la fenêtre de sélection des sons ; vérification dans les deux thèmes. [CTL-08, Brief §11]
  - Note : ℹ️ Info : `sound-choice.ts` déplacé dans `shared/selection-dialog` (utilisé par l'éditeur d'action et la Présentation).

> ✅ Lot 10 validé : écran de Présentation PC complet (lancement, en-tête, fil, scène suivante, panneau de contrôle), vérifié dans Chromium dans les deux thèmes sur le scénario Valombre. `ng build` (sans avertissement), `ng test` (341 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Ajouts : taille de fenêtre `xl`, jetons `space(18|22|44|160)`, `font-size(click)`, `layout(scene-thumb|modal-xl)`. « Deux fenêtres » : choix mémorisé, fenêtre ouverte au lot 11. Pas de nouvelle dépendance.

---

## Lot 11 — Fenêtre joueurs

- [x] **11.1** Route `/projects/:id/player` et ouverture par `window.open` depuis l'écran du MJ. [AFF-02, TEC-53]
  - Note : ⚠️ Alerte : l'ouverture doit avoir lieu **dans le gestionnaire du clic**, sinon le navigateur bloque la fenêtre : la fenêtre de lancement appelle un rappel `onLaunch` avant de se fermer. Fenêtre bloquée : notification (« autorisez les fenêtres pop-up… ») et bouton « Ouvrir la fenêtre joueurs » dans l'en-tête.
- [x] **11.2** Canal `BroadcastChannel` par projet ; messages `show-battlemap`, `clear`, `ping`. [TEC-53, TRD §9]
  - Note : ℹ️ Info : messages `theme` (11.6), `hello` et `bye` (11.7) ajoutés à ceux du TRD ; `show-battlemap` porte aussi l'id de la scène (il n'existe pas de lecture d'une battlemap seule dans le dépôt). TRD §9 mis à jour.
- [x] **11.3** Résolution de l'URL de la battlemap par la fenêtre joueurs elle-même (identifiants seulement dans les messages). [TRD §9]
  - Note : ℹ️ Info : battlemap supprimée → écran noir côté joueurs (pas de message d'erreur montré aux joueurs ; le MJ voit l'erreur de son côté).
- [x] **11.4** État initial demandé à l'ouverture (`ping`). [TRD §9]
  - Note : —
- [x] **11.5** Affichage plein écran, fond noir quel que soit le thème. [Brief §2.8]
  - Note : ℹ️ Info : nouveaux jetons `player-bg` (`#000` dans les deux thèmes) et `player-text` (Brief §2.7 et §11.3 mis à jour).
- [x] **11.6** Transmission du thème courant. [TEC-16]
  - Note : —
- [x] **11.7** Comportement si la fenêtre joueurs est fermée ou rechargée en cours de partie. [—]
  - Note : —

> ✅ Lot 11 validé : fenêtre joueurs synchronisée par `BroadcastChannel`, vérifiée dans Chromium avec deux fenêtres réelles. `ng build` (sans avertissement), `ng test` (347 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Écarts au TRD (mis à jour, §9) : messages `theme`, `hello`, `bye` en plus ; `show-battlemap` porte aussi l'id de la scène. Nouveaux jetons `player-bg` / `player-text` (Brief mis à jour). **À vérifier par Allan** : Firefox et Edge (blocage des fenêtres pop-up, plein écran au double-clic). Pas de nouvelle dépendance.

---

## Lot 12 — Reprise et cohérence des données

- [x] **12.1** Fermer le navigateur en pleine partie puis « Continuer » : scène, fil, battlemap, actions restaurés. [PRS-05, NF-24]
  - Note : ⚠️ Alerte (corrigée) : fermeture pendant le clic d'une action **relancée** : la règle du lot 9 retirait le bloc en attente, donc un texte d'une exécution précédente terminée. Désormais, à la reprise, un bloc en attente est retiré seulement si son action n'a jamais été terminée ; sinon il reste, validé.
- [x] **12.2** Sons restaurés : relancés depuis le début, avec leur volume et leur état de pause. [PRS-04, PRS-05]
  - Note : —
- [x] **12.3** Supprimer une action, une battlemap, un son et une scène visée par un « Changer de scène » entre deux séances, puis reprendre la partie. [PRS-07]
  - Note : ✅ Décision (Allan) : avertir aussi à la suppression d'une scène visée par un « Changer de scène » : fait. La confirmation indique le nombre d'actions extérieures qui la visent, y compris pour un dossier ; nouvelle méthode du dépôt `listSceneLinks(projectId)` (TRD §4.1), `EditorStore.sceneTargetCount()`.
- [x] **12.4** « Recommencer » après une longue partie : tout l'état est bien effacé. [PRS-03]
  - Note : —
- [x] **12.5** Revenir sur plusieurs scènes visitées : chaque fil est restauré indépendamment. [FIL-01, PRS-06]
  - Note : —
- [x] **12.6** Jalon J4 : animer une séance de test complète sur PC, avec et sans fenêtre joueurs. [Plan §2]
  - Note : ✅ Décision (Allan) : la Présentation sur tablette entre en V1 (lot 12 bis).

> ✅ Lot 12 validé : reprise de partie et cohérence des données vérifiées par l'interface dans Chromium (fermeture brutale, sons restaurés, suppressions entre deux séances, Recommencer, allers-retours entre scènes), jalon **J4** atteint avec et sans fenêtre joueurs. Correction : bloc de clic d'une relance interrompue conservé à la reprise. `ng build` (sans avertissement), `ng test` (349 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Décisions d'Allan : avertissement à la suppression d'une scène visée par « Changer de scène » (fait) ; tablette en V1 (lot 12 bis). Pas de nouvelle dépendance.

---

## Lot 12 ter — Vidéos

> Ajouté le 13/11/2026 (demande d'Allan) et fait **avant le lot 12 bis**. Exigences : PRD §5.2 (VID-01 à VID-13), ACT-14, ACT-15, CTL-13 ; TRD §1.4 (TEC-44 à TEC-49), §3, §9.1, D10, D11 ; Brief §2.6, §6.12, §7.2.
>
> ✅ Décisions (Allan, 13/11/2026) : vidéos copiées dans IndexedDB comme les sons ; mêmes dossiers que les sons, page renommée « Bibliothèque » ; « Lancer la vidéo » n'attend pas la fin ; une seule vidéo à la fois, par-dessus la battlemap, qui réapparaît à la fin ; volume réglé dans l'élément, aucune autre option ; sons d'ambiance **coupés** pendant la vidéo ; arrêt au changement de scène et à l'affichage d'une battlemap, pause par le bouton global ; vidéo non enregistrée dans la partie ; carte « Vidéo en cours » côté MJ ; fenêtre joueurs fermée → notification discrète ; lancement manuel possible ; MP4 + WebM, confirmation au-delà de 500 Mo ; aperçu dans une fenêtre ; son refusé → vidéo muette + notification ; export : case « Inclure les vidéos ».
>
> ✅ Décisions (Allan, 14/11/2026) : couleurs `--el-video-*` posées telles que proposées, validées visuellement sur `/dev/themes` ; réafficher la battlemap déjà affichée arrête aussi la vidéo ; renommage complet dans le code (`SoundNode` → `LibraryNode`, `features/sound-library` → `features/library`, `SoundLibraryPage` / `SoundLibraryStore` → `LibraryPage` / `LibraryStore`), store IndexedDB `soundNodes` inchangé ; prototype dans `prototypes/` à la racine du dépôt, testé avec `D:\Content\Videos\SNK-S4 partie 4.mp4` (2,08 Go) ; **pas** de bloc vidéo dans le fil d'actualité ; lancement manuel à 100 %, et volume de la vidéo en cours **réglable à la main** sur la carte « Vidéo en cours », comme pour un son (non enregistré) ; vidéo illisible ou introuvable (`video-error`) → notification, sons rétablis, carte retirée ; vidéo en pause par le bouton global → les ambiances restent coupées jusqu'à la fin ou à l'arrêt de la vidéo. ⚠️ Problèmes Windows connus (`check:i18n` sur `features/dev`, CRLF de `format:check`, `ng test` depuis Bash) : **non corrigés**, le projet repasse bientôt sous Linux (décision d'Allan).

- [x] **12t.1** Prototype `prototypes/prototype-video.html` : vidéo avec son dans une fenêtre ouverte par `window.open` sans clic dedans (Chrome, Edge, Firefox) ; vidéo de 1 à 2 Go en `Blob` IndexedDB (durée d'import, mémoire, déplacement, URL lue depuis une autre fenêtre). Résultats validés par Allan. [TEC-47, TEC-49]
  - Note : ℹ️ Info : prototype `prototypes/prototype-video.html` à servir en HTTP (`npx http-server prototypes -p 4300 -c-1`) ; la même page avec `?role=player` sert de fenêtre joueurs. Conception retenue : la fenêtre joueurs lit IndexedDB et crée sa propre URL (aussi rapide qu'une URL `blob:` créée par le MJ, et indépendante de la durée de vie de l'écran du MJ, TEC-44). ⚠️ Alerte : prototype testé **dans Chrome et Edge seulement** (Chromium). **Firefox non testé** (non installé sur le PC d'Allan) : le repli muet (`NotAllowedError` → `muted`, `video-muted`, clic dans la fenêtre joueurs, TEC-47) est codé sans avoir été vu en vrai ; à vérifier en recette (lot 14) si Firefox est utilisé. La première lecture juste après un import peut mettre quelques secondes à démarrer (2,8 s mesurées dans Chrome, puis ~130 ms).
- [x] **12t.2** Modèle et contrat : `SoundNode` → `LibraryNode` (`mediaKind`), méthodes `listLibraryNodes`, `saveLibraryNodes`, `deleteLibraryNode`, `countLibraryUsages` (compte aussi les `play-video`) ; éléments `play-video` et `stop-video` ; store `soundNodes` inchangé (pas de migration). [TRD §3, §4.1]
  - Note : ℹ️ Info : schéma IndexedDB inchangé (store `soundNodes`), pas de `DB_VERSION`. `SummaryContext.soundNames` contient aussi les noms des vidéos (tous les éléments de bibliothèque).
- [x] **12t.3** Médias : formats `mp4` / `webm` (`resolveMediaType`, `FORMAT_LABELS.video`), `MediaDuration` (sons et vidéos), `getStorageUsage().videos` affiché dans Paramètres › Stockage. [VID-01, TEC-34, TEC-36, NF-14]
  - Note : ℹ️ Info : règle de repli sur l'extension resserrée : quand le navigateur donne un type MIME, il doit être de la même famille que l'extension (`audio/webm` nommé `.webm` refusé, `video/x-matroska` nommé `.webm` accepté ; `.mov` refusé). `MediaDuration` (`core/media/media-duration.ts`) remplace `AudioDuration` (supprimé).
- [x] **12t.4** Écran « Bibliothèque » : titre, navigation « Scènes / Bibliothèque », bouton de l'accueil, routes `/library` et `/projects/:projectId/library` (anciennes routes redirigées), traductions. [VID-02, TRD §2.3]
  - Note : ℹ️ Info : `SoundName`, `SoundPreview` et `ListenButton` gardent leur nom (ils concernent la pré-écoute des sons) ; les clés de traduction restent dans le domaine `sound.*`. ✅ Décision (Allan) : l'icône `LibraryBig` faisait dépasser le budget du bundle initial (600,77 ko pour 600 ko) : budget d'avertissement relevé à **650 ko** dans `angular.json` (erreur toujours à 1 Mo).
- [x] **12t.5** Import de vidéos (bouton, glisser-déposer) : `mediaKind` posé à l'import, confirmation au-delà de 500 Mo, « Import en cours (n / N) », quota. [VID-01, VID-03, TEC-36]
  - Note : ℹ️ Info : **une seule** fenêtre de confirmation pour tous les gros fichiers d'un import ; « Annuler » importe quand même les autres fichiers ; le seuil de 500 Mo vaut pour tout fichier accepté, son compris. Un nouvel import est ignoré pendant qu'un autre est en cours. TRD TEC-36 précisé.
- [x] **12t.6** Tableau et arborescence : icône et colonne Type, filtre Tous / Sons / Vidéos, aperçu « Voir » dans une fenêtre, avertissement à la suppression d'une vidéo (ou d'un dossier) utilisée. [VID-02, VID-04, VID-05]
  - Note : ℹ️ Info : colonne **Taille** ajoutée au tableau (comme dans le Brief §7.2). Choisir dans l'arborescence un élément masqué par le filtre remet « Tous ». ⚠️ À vérifier par Allan dans le navigateur, deux thèmes.
- [x] **12t.7** Jetons `--el-video-*` dans les deux thèmes (valeurs à valider), type d'élément (icône, couleur, pastille). [Brief §2.6, §11.3]
  - Note : ⚠️ Alerte (corrigée) : les cartes d'élément (`element-card.scss`) et le menu « Ajouter un élément » (`action-editor.scss`) ne coloraient pas le ton `action` (« Afficher / Masquer l'action » restaient sans couleur) : `action` et `video` ajoutés à leurs listes de tons. ⚠️ À vérifier par Allan sur `/dev/themes`.
- [x] **12t.8** Éditeur d'action : « Lancer la vidéo » (choix limité aux vidéos, volume) et « Arrêter la vidéo » ; résumé, validation, vidéo supprimée signalée, duplication de scène. [ACT-14, ACT-15, PRS-07]
  - Note : —
- [x] **12t.9** Fenêtre joueurs : lecteur `<video>` par-dessus la battlemap, messages `play-video` / `pause-video` / `resume-video` / `stop-video`, état renvoyé au MJ, repli muet si le son est refusé. [VID-06, VID-12, TEC-44, TEC-47, TRD §9.1]
  - Note : ℹ️ Info : `video-state` porte aussi `volume` (pour le curseur de la carte du MJ). `show-battlemap` n'arrête pas la vidéo côté joueurs : c'est l'écran du MJ qui envoie `stop-video`.
- [x] **12t.10** Moteur : `PlayerVideo`, `playVideo` / `stopVideo` dans l'`ActionContext`, fenêtre fermée → notification, arrêts (fin, nouvelle vidéo, scène, battlemap, fermeture de la fenêtre), coupure des sons (`AudioPlayer.duck`), bouton global pause, rien d'enregistré. [VID-06 à VID-11, TEC-45, TEC-46, TEC-48]
  - Note : ℹ️ Info : écart au TRD : `PlayerVideo.play` reçoit le nœud résolu (`mediaId`, `name`) au lieu de `(videoId, volume)` ; TRD §6.2, §7 et §9.1 mis à jour. Pas de dépendance circulaire : `PlayerWindow` branche le canal de `PlayerVideo` (`attach`). ⚠️ Correctif hors périmètre : pendant un import de plusieurs fichiers, les fichiers déjà importés s'affichaient « Fichier introuvable » jusqu'à la fin de l'import ; `LibraryStore.importFiles` lit maintenant les infos de chaque fichier dès son enregistrement.
- [x] **12t.11** Écran du MJ : carte « Vidéo en cours » (temps restant, Pause / Reprendre, Arrêter, « Sons coupés », « Muette »), résumé de la section Sons, « Lancer un son ou une vidéo ». [CTL-08, CTL-13, Brief §6.12]
  - Note : —
- [x] **12t.12** Vérification dans Chromium et Firefox : vidéo longue en deux fenêtres, coupure et retour des sons, arrêts, mode un seul écran, reprise de partie (vidéo non relancée), place de stockage ; mise à jour de `CLAUDE.md`. [VID-01 à VID-13]
  - Note : ⚠️ Défaut trouvé et corrigé : après un changement de scène pendant une vidéo, les sons revenaient à **mi-volume** jusqu'à la vidéo suivante : Chromium cesse de calculer le gain maître quand plus aucun son n'y entre (fondu de sortie de 0,5 s plus court que le fondu de 1 s) et le fondu restait figé ; `AudioPlayer.settleMaster()` remet le gain maître à sa valeur à chaque son lancé. ⚠️ Écarts : **Firefox non testé** (pas installé sur ce PC) : lecture automatique avec son dans la fenêtre joueurs et vidéo de 2 Go à vérifier par Allan ; seul Edge a été piloté (Chrome validé par Allan sur le prototype, 12t.1) ; la fin naturelle d'une vidéo (1 h 25) n'a pas été attendue, couverte par les tests ; VID-13 (case « Inclure les vidéos » à l'export) dépend de l'export, prévu au lot 12 bis.
- [x] **12t.13** Mention « Vidéo lancée » dans le fil d'actualité (demande d'Allan après la validation du lot). [FIL-08, Brief §6.10]
  - Note : ✅ Décision (Allan, 14/11/2026) : en Présentation, une vidéo lancée est indiquée par un **bloc dans le fil** (« Vidéo lancée : « nom » »), sans contrôle ; les contrôles restent sur la carte « Vidéo en cours ». Remplace la décision « pas de vidéo dans le fil ». ℹ️ Info : la mention n'est ajoutée que si la vidéo est **diffusée** ; elle est enregistrée avec le fil (pas de `DB_VERSION`), la vidéo elle-même ne l'est toujours pas. PRD FIL-08, TRD §3 et §9.1, Brief §6.10 mis à jour. ⚠️ Correctif en plus : à l'ouverture de la Bibliothèque, les lignes s'affichaient un instant avant les infos des fichiers (« Fichier introuvable ») : `LibraryStore.load` lit maintenant les infos avant d'afficher les lignes. Pas revérifié dans le navigateur.

**Critère de fin** : une vidéo importée dans la bibliothèque est lancée par une action et diffusée dans la fenêtre joueurs pendant que les ambiances sont coupées, puis la battlemap et les sons reviennent.

> ✅ Lot 12 ter validé (14/11/2026) : critère de fin vérifié dans Edge avec une vidéo de 1,9 Go (28 contrôles, 12t.12). Commandes passées : `ng build` (600,9 ko, sans avertissement), `ng test --watch=false` 518 / 518 (lancé depuis PowerShell ; plusieurs passages complets de suite), `ng lint`, `npm run lint:styles`, `npm run check:themes`, Prettier sur les fichiers modifiés ; `check:i18n` et `format:check` : seulement les problèmes Windows connus (pages `features/dev`, fins de ligne CRLF), non corrigés (décision d'Allan). À faire par Allan : rien à installer ; tester dans **Firefox** (lecture avec son dans la fenêtre joueurs, import d'une grosse vidéo) ; supprimer si besoin les données de test « Test vidéo » de son navigateur (non concerné : les tests ont utilisé des profils Edge jetables, supprimés). Écarts au TRD : `PlayerVideo.play` reçoit le nœud résolu (`mediaId`, `name`), `video-state` porte aussi `volume`, `AudioPlayer.settleMaster()` (contournement Chromium) ; TRD §6.2, §7 et §9.1 à jour. VID-13 reportée avec l'export (lot 12 bis).

---

## Lot 12 bis — Hors ligne et tablette

> Ajouté après le jalon J4 (décision d'Allan) : Présentation sur tablette Android (Chrome) en V1, application utilisable sans connexion internet et lancée depuis un fichier HTML, transfert des projets du PC vers la tablette.

- [ ] **12b.1** Conception : lancement hors ligne depuis un fichier HTML (fichier unique, application installable, ou autre), validée par Allan après prototypes sur PC et sur tablette Android. [O5, PRJ-04, NF-04]
  - Note : —
- [ ] **12b.2** Format d'export d'un projet (scènes, actions, battlemaps, sons et vidéos du projet, sons et vidéos de la bibliothèque globale utilisés) et « Exporter le projet » depuis l'accueil, avec la case « Inclure les vidéos » (cochée par défaut, poids affiché). [PRJ-04, PRJ-05, VID-13]
  - Note : —
- [ ] **12b.3** « Importer un projet » (nouveau projet, fichiers refusés expliqués, quota). [PRJ-05]
  - Note : —
- [ ] **12b.4** Build hors ligne selon 12b.1 : traductions, polices et médias embarqués, navigation sans serveur. [TEC-90]
  - Note : —
- [ ] **12b.5** Mise en page tablette : fil à gauche, onglets Actions / Cartes / Sons, « Scène suivante » en bas, cibles ≥ 48 px. [CTL-12, Brief §7.3]
  - Note : —
- [ ] **12b.6** Tablette : un seul écran (pas de fenêtre joueurs, donc vidéos non diffusées et signalées, VID-07), plein écran et son débloqués au toucher, stockage persistant. [NF-04, TEC-43]
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
  - Note : —
- [x] **13.1.2** (Optionnel) Affichage de la place de stockage utilisée. [NF-14]
  - Note : ⚠️ « Espace disponible » vient du navigateur, qui l'estime largement (et sous-estime les `Blob`) : c'est un ordre de grandeur. Chromium sans interface refuse la protection : l'écran y affiche « Données non protégées ».

### 13.2 Performance

- [x] **13.2.1** Mesurer le changement de scène et le lancement d'une action (< 300 ms). [NF-20]
  - Note : —
- [x] **13.2.2** Plusieurs longues ambiances simultanées sans ralentissement ni coupure. [NF-21, NF-22]
  - Note : —
- [x] **13.2.3** Chargement des médias de la seule scène courante ; miniatures en `loading="lazy"`. [TEC-91, TEC-92]
  - Note : —
- [x] **13.2.4** Vérifier la libération des URL de médias sur une séance longue (pas de fuite mémoire). [TEC-33, NF-23]
  - Note : —

### 13.3 Accessibilité

- [x] **13.3.1** Navigation complète au clavier, focus visible. [Brief §8]
  - Note : ℹ️ Corrigé : le titre de scène modifiable de l'éditeur n'avait pas de contour au focus (`:focus-visible` ajouté).
- [x] **13.3.2** Libellés et attributs ARIA (boutons icône, sections, menus, arborescences). [Brief §8]
  - Note : ℹ️ Corrigés : en-tête / pied de `app-modal` en `<div class="modal__header|footer">` (des `<header>` / `<footer>` créaient des repères en double) ; fenêtre joueurs dans un `<main>` libellé. Les tests ciblent maintenant `.modal__footer`.
- [x] **13.3.3** Contrastes vérifiés dans les deux thèmes. [Brief §2.8]
  - Note : ✅ Décision (Allan) : les éléments **passés** du fil, estompés à 45 % (Brief §6.10), étaient sous le 4,5:1 du Brief §2.8 ; estompage remonté à 65 % (Brief §6.10 mis à jour), pleine opacité au survol ou au focus. ⚠️ Reste en Automne la petite mention « Validé » d'un clic passé (2,86:1, texte secondaire de 13 px) : acceptée en l'état, à revoir si besoin (ne pas estomper cette mention).
- [x] **13.3.4** Respect de `prefers-reduced-motion`. [Brief §8]
  - Note : —

### 13.4 Compatibilité et confort

- [ ] **13.4.1** Tests manuels sur Chrome, Edge et Firefox (dernières versions). [NF-02, TEC-90]
  - Note : ⚠️ À faire par Allan : seul Chromium est disponible ici (tous les tests automatiques y passent). À vérifier dans chaque navigateur : créer un projet, importer battlemaps et sons (glisser-déposer compris), éditer une action, lancer une partie en « Deux fenêtres » (fenêtre joueurs, plein écran par double-clic), sons (fondus, boucle, volume), raccourcis clavier, Continuer après rechargement, thème Automne. Firefox : la demande d'autorisation de stockage persistant au démarrage.
- [x] **13.4.2** Vérifier l'absence de texte en dur hors `fr.json`. [TEC-71]
  - Note : ℹ️ Nouveau script `npm run check:i18n` (`scripts/check-i18n.mjs`), ajouté à la liste des commandes à passer avant de cocher. Pages `features/dev` exclues, « JDR Manager » autorisé.
- [x] **13.4.3** (Optionnel) Raccourcis clavier en Présentation. [NF-32]
  - Note : —
- [x] **13.4.4** Mode démo de la Présentation, lancé par « Présenter » depuis un projet ouvert. [PRS-09]
  - Note : ✅ Décision (Allan, 11/11/2026) : le bouton « Présenter » de l'en-tête de l'éditeur et de l'écran Sons lance une **démo** (`/projects/:id/play?demo=1&scene=<id>`) ; la vraie partie (Continuer / Recommencer) se lance depuis la carte du projet sur l'accueil. Démo : démarrage direct sans fenêtre de lancement, partie sauvegardée ni lue ni modifiée, départ sur la scène ouverte dans l'éditeur (ou la dernière éditée), pastille « Démo », retour à l'éditeur sur la scène en cours. ⚠️ Alerte : une démo ouverte par rechargement de la page (sans clic préalable) peut rester muette tant que le navigateur bloque l'audio ; une démo et une vraie partie ouvertes en même temps partagent le canal de la fenêtre joueurs du projet.
- [x] **13.4.5** Texte facultatif sur l'élément « Attendre ». [ACT-10]
  - Note : ✅ Décision (Allan, 11/11/2026) : texte facultatif (`WaitElement.text`, pas de migration de la base). Présentation : texte affiché **pendant l'attente** à la place de « Attente en cours », puis retiré ; rien n'est ajouté au fil ni enregistré (choix d'Allan).
- [x] **13.4.6** Option « Masquer l'action au départ » et élément « Afficher l'action ». [ACT-12, CTL-01, CTL-02]
  - Note : ✅ Décision (Allan, 11/11/2026) : ACT-12 (jusqu'ici hors V1) entre dans la V1. Cible : une action « Clic du MJ » de la **même scène** ; les actions masquées au départ sont traitées **comme les effectuées** (même liste repliée, raccourcis 1-9 ignorés, lançables) ; **nouvelle couleur** `--el-action-*` (violet, Brief §2.6 et §11.3). ℹ️ Info : `SceneState.shownActionIds` facultatif (pas de migration de la base ni des parties enregistrées). ⚠️ Alerte : `specifications.md` et `Plan_implementation.md` présentent encore cet élément comme une version future (non modifiés).

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

## Lot 15 — Fiches

> Ajouté le 16/11/2026 (demande d'Allan), prévu **après la V1**. Exigences : PRD §5.10 (FCH-01 à FCH-09), ACT-16, FIL-11, CTL-14 ; TRD §1.5 (TEC-54 à TEC-57), §3, §4.1, §4.2, §6.2, D12 ; Brief §2.6, §6.9, §6.10, §7.2, §11.3.
>
> ✅ Décisions (Allan, 16/11/2026) : une fiche = un titre + un texte Markdown, **sans image** ; fiches du **projet seulement** (pas de fiches globales) ; onglet « Fiches » entre Scènes et Bibliothèque ; arborescence à gauche et **fiche ouverte au centre**, modifiable, enregistrée automatiquement ; **titre = nom** dans l'arborescence ; recherche sur le **titre et le texte** ; élément « Afficher une fiche » : la fiche s'ouvre dans une **fenêtre** et **l'action continue** ; un bloc « Fiche : « titre » » cliquable est ajouté au fil **seulement si la fiche est ouverte par une action**, sans doublon à la relance ; ouverture à la main par un **bouton « Fiches » dans l'en-tête + raccourci** (F) et une fenêtre de recherche ; fenêtre en **lecture seule** ; fiches **jamais** montrées aux joueurs ; lot fait **après la V1**.
>
> ℹ️ Choix proposés, à confirmer en cours de lot : nom dans le code `Sheet` (`SheetNode`, `features/sheets`, `SheetsPage`, `SheetsStore`, `SheetDialog`, `SheetPicker`, élément `show-sheet`, route `/projects/:projectId/sheets`) ; icône Lucide `ScrollText` ; couleurs `--el-sheet-*` (Brief §11.3) ; pause d'affichage (`DISPLAY_GAP_MS`) avant « Afficher une fiche », comme pour un texte ; ouvrir une fiche ferme celle déjà affichée ; « Dupliquer » une fiche (FCH-09, priorité C).

- [ ] **15.1** Modèle et données : `SheetNode`, `Sheet` (`ng g interface`), élément `ShowSheetElement` (`show-sheet`), entrée de fil `SheetFeedItem` ; stores `sheetNodes` et `sheets` (`DB_VERSION` + 1, bloc `upgrade`) ; méthodes `listSheetNodes`, `saveSheetNodes`, `deleteSheetNode` (cascade en une transaction), `listSheets`, `getSheet`, `saveSheet`, `countSheetUsages` ; `deleteProject` supprime les fiches ; fabriques de test. [TEC-54, D12, TRD §3, §4]
  - Note : —
- [ ] **15.2** Recherche : fonction pure `searchSheets(nodes, sheets, query)` (titre + texte, accents et casse ignorés, extrait autour de la première occurrence, Markdown rendu en texte brut) et tests. [FCH-06, TEC-55]
  - Note : —
- [ ] **15.3** Onglet « Fiches » : route `/projects/:projectId/sheets`, navigation « Scènes / Fiches / Bibliothèque » (`app-project-nav`), `SheetsPage` + `SheetsStore` (`@Injectable()` fourni par l'écran), en-tête (Présenter, paramètres) comme la Bibliothèque. [FCH-02, TRD §2.3]
  - Note : —
- [ ] **15.4** Arborescence des fiches : Nouveau dossier / Nouvelle fiche (puis `startRename`), renommer, déplacer (`applyMove`), supprimer avec confirmation et **avertissement** si des actions utilisent la fiche ou le dossier (`deleteMessage`), recherche au-dessus (arbre filtré), dernière fiche ouverte mémorisée (`UiPreferences`). [FCH-03, FCH-06, FCH-07]
  - Note : —
- [ ] **15.5** Fiche ouverte au centre : chemin, titre (= nom du nœud, `appCapitalize`, titre vide refusé), texte (`appMarkdownEditor`), enregistrement automatique (`DebouncedTask`, `flush()` au changement de fiche, à la sortie du champ, à la destruction et sur `beforeunload` ; champs liés à une valeur figée à l'ouverture), « Utilisée dans N actions », état vide. [FCH-01, FCH-04, FCH-05, FCH-07]
  - Note : —
- [ ] **15.6** Jetons `--el-sheet-*` dans les deux thèmes (valeurs à valider par Allan), ton de pastille, `ELEMENT_TYPE_INFOS` (libellé, icône `ScrollText`), pages `/dev/themes` et `/dev/components`. [Brief §2.6, §11.3]
  - Note : —
- [ ] **15.7** Éditeur d'action : élément « Afficher une fiche » (bouton de choix → `Selections.select({ mode: 'single' })` sur l'arborescence des fiches, chemin affiché, « Aucune fiche choisie », « Fiche supprimée » en rouge), résumé (`describeElement`, `summarizeElement`, `hasMissingTarget`), validation (`elementProblem`), ligne en lecture seule dans l'éditeur de scène (SCN-07), duplication de scène. [ACT-16, PRS-07]
  - Note : —
- [ ] **15.8** Moteur : `context.showSheet` (pause d'affichage, fiche supprimée → notification `presentation.errors.missingSheet`, bloc `sheet` sans doublon par `elementId` + `focus`, enregistrement), `openSheet(sheetId)` et signal `sheetRequest`, noms et textes des fiches chargés avec le projet, mode démo ; tests (`usePresentation()`). [ACT-16, FIL-11, TEC-56, TEC-52]
  - Note : —
- [ ] **15.9** Écran du MJ : fenêtre `SheetDialog` (taille `lg`, lecture seule, Markdown rendu, fiche vide) ouverte par un `effect` sur `sheetRequest` (ferme d'abord la fiche affichée) ; bloc « Fiche : « titre » » du `Feed` : un vrai `<button>` dont le clic **rouvre la fiche** (`engine.openSheet(sheetId)`), y compris après « Continuer » ou le retour sur la scène ; fiche supprimée signalée, bloc non cliquable. [FCH-08, FIL-11, Brief §6.9, §6.10]
  - Note : —
- [ ] **15.10** Ouverture à la main : bouton « Fiches » dans l'en-tête de la Présentation, raccourci **F** (`PRESENTATION_SHORTCUTS`, `onShortcut`, `aria-keyshortcuts`), fenêtre `SheetPicker` (recherche titre + texte, extraits, clavier haut / bas / Entrée) ; rien n'est ajouté au fil ; rien n'est envoyé à la fenêtre joueurs. [CTL-14, FCH-08, TEC-57]
  - Note : —
- [ ] **15.11** Export / import de projet (si le lot 12 bis est fait) : emporter les fiches (`sheetNodes`, `sheets`) et les relire dans le lecteur hors ligne. [PRJ-04]
  - Note : —
- [ ] **15.12** Vérification dans Chromium (deux thèmes) : création et recherche de fiches, enregistrement automatique, élément dans une action, bloc du fil après « Continuer », ouverture à la main (F), fenêtre joueurs inchangée ; mise à jour de `CLAUDE.md`. [FCH-01 à FCH-09]
  - Note : —

**Critère de fin** : une fiche préparée dans l'onglet Fiches s'ouvre en Présentation par une action (bloc dans le fil, qui la rouvre) et à la main par la recherche (bouton « Fiches » ou touche F), sans jamais apparaître dans la fenêtre joueurs.

---

## Points ouverts

| Sujet | Statut | Note |
|---|---|---|
| Fiches du MJ (lot 15) | 📝 Spécifié (2026-11-16), à faire après la V1 | ✅ Demande (Allan) : notion de fiche (titre + texte Markdown) dans un onglet « Fiches » inspiré de la Bibliothèque, élément d'action « Afficher une fiche », ouverture manuelle en Présentation, fenêtre avec le contenu mis en forme. Décisions d'Allan : voir l'en-tête du lot 15. Documents mis à jour : PRD (§5.10 FCH-01 à FCH-09, ACT-16, FIL-11, CTL-14, glossaire, §9), TRD (§1.5 TEC-54 à TEC-57, §2.2, §2.3, §3, §4.1, §4.2, §6.2, D12), Brief (§2.6, §6.9, §6.10, §7.2, §11.3), spécifications (§3.2), plan (lot 15, jalon J6). ❓ À valider : couleurs `--el-sheet-*` et choix techniques listés dans l'en-tête du lot. |
| Diffusion de vidéos (lot 12 ter) | 📝 Spécifié (2026-11-13), à faire avant le lot 12 bis | ✅ Demande (Allan) : importer des vidéos comme les sons, page renommée « Bibliothèque », éléments « Lancer la vidéo » / « Arrêter la vidéo », vidéo jouée seulement dans la fenêtre joueurs (ignorée si elle n'est pas ouverte). Décisions d'Allan : voir l'en-tête du lot 12 ter. Documents mis à jour : PRD (§5.2, VID-01 à VID-13, ACT-14, ACT-15, CTL-13, risques), TRD (TEC-36, TEC-44 à TEC-49, §3, §4.1, §9.1, D10, D11), Brief (§2.6, §6.12, §7.2), Plan, `specifications.md`. ✅ Validé (Allan, 14/11/2026) : couleurs `--el-video-*` proposées (contrôle visuel sur `/dev/themes`) ; arrêt de la vidéo même quand on réaffiche la battlemap déjà affichée ; renommage complet dans le code (voir l'en-tête du lot). |
| « Afficher / Masquer l'action » vers plusieurs actions (ACT-12, ACT-13) | ✅ Fait (2026-11-13) | ✅ Demande (Allan) : choisir une liste d'actions. Réalisation : `ShowActionElement` / `HideActionElement` portent `actionIds: Id[]` (au lieu de `actionId`), rangés dans l'ordre des actions de la scène ; **`DB_VERSION` 2**, migration `migrateActionTargets` (`jdr-db.ts`) : `actionId` → `[actionId]`, vide → `[]`. Éditeur : cases à cocher au lieu de boutons radio (désactivées par « Masquer toutes les actions ») ; action visée supprimée : avertissement « Une action choisie a été supprimée. » et bouton « Retirer » qui l'enlève de la liste ; résumé « afficher « X » » pour une action, « afficher N actions » pour plusieurs ; détail replié = noms séparés par des virgules ; avertissement à la suppression d'une action visée par l'une de ces listes ; duplication de scène : toutes les cibles remappées. Présentation : toutes les actions visées sont affichées / masquées en un seul enregistrement ; une action supprimée est ignorée et signalée (les autres sont traitées). TRD §3 et PRD ACT-12 / ACT-13 mis à jour. Tests : `jdr-db` (migration), `element-form`, `action-summary`, `presentation-engine`. ⚠️ Alerte : depuis le shell Bash de Claude, `ng test` échoue (« Vitest failed to find the runner », casse de la lettre de lecteur) ; passe depuis PowerShell. `check:i18n` signale les pages `features/dev` sous Windows (filtre `'/features/dev/'` avec des `/`) et `format:check` les fins de ligne CRLF de la copie de travail : préexistant, non corrigé. ⚠️ À vérifier par Allan dans le navigateur. |
| Élément « Masquer l'action » (ACT-13) | ✅ Fait (2026-11-13) | ✅ Demande (Allan) : pendant d'« Afficher l'action ». ✅ Décisions (Allan) : l'action masquée s'affiche comme une action masquée au départ (œil barré, lançable) et une action terminée garde son ✓ ; cibles = autres actions « Clic du MJ » de la scène (pas elle-même) ; une action en cours se termine normalement. Réalisation : `HideActionElement` (`hide-action`, icône `EyeOff`, couleur `action`), `SceneState.hiddenActionIds` (facultatif, pas de changement de schéma ni de `DB_VERSION`) ; `hidden` d'une `ManualAction` = terminée, ou dans `hiddenActionIds`, ou masquée au départ sans être affichée ; « Afficher l'action » retire aussi l'action de `hiddenActionIds`. Éditeur : formulaire partagé avec « Afficher l'action » (`ng-template #actionChoice`, aide et erreur propres), résumé, validation, duplication de scène (cible remappée), avertissement à la suppression d'une action visée (« affichée ou masquée par… »). Cible supprimée en Présentation : message `presentation.errors.missingActionToHide`. PRD ACT-13 et TRD §3 mis à jour. Tests : `action-runner`, `presentation-engine`, `element-form`, `action-summary`, `action-editor`, `editor-store`, `pill`. ✅ Demande (Allan) : case « Masquer toutes les actions » (`HideActionElement.all`) ; cochée, les actions du formulaire sont désactivées et le choix précédent est effacé (`actionId: ''`) ; résumé « masquer toutes les actions », jamais signalé comme cible supprimée. En Présentation, toutes les actions « Clic du MJ » de la scène sont ajoutées à `hiddenActionIds`, y compris celle qui contient l'élément ; « Afficher l'action » en réaffiche une. ⚠️ À vérifier par Allan dans le navigateur. |
| « Changer de scène » attend le MJ en Présentation (ACT-09, FIL-05) | ✅ Fait (2026-11-13) | ✅ Demande (Allan) : la scène ne change plus immédiatement. Le fil affiche un bloc comme « Clic de l'utilisateur », texte « Aller à la scène '…' » (nom de la scène cible, `presentation.goToSceneNamed`) et bouton « Aller » (`presentation.go`) ; Entrée et C le valident aussi. Réalisation : `ActionRunner` vérifie la cible (`canChangeScene`), puis `beforeDisplay` et `waitForUserClick` avec l'élément `change-scene` ; l'action est marquée effectuée après le clic. Le bloc est un `UserClickFeedItem` (pas de changement du modèle ni du schéma) ; `PresentationEngine.targetSceneName(item)` dit au `Feed` qu'il s'agit d'un changement de scène (icône clap). Scène quittée avant le clic : bloc retiré, action non effectuée (comme un clic). Cible supprimée : message, ni bloc ni changement. ✅ Décision (Allan) : apostrophes droites autour du nom de la scène (pas de guillemets « … »). PRD ACT-09 mis à jour. Tests `action-runner.spec.ts`, `presentation-engine.spec.ts`, `feed.spec.ts`. ✅ Demande (Allan) : dans l'éditeur aussi, « Changer de scène » est montré entre les textes de l'action, comme les clics : ligne en pointillés `ActionPause` (icône clap, couleur `el-scene-fg`) « Aller à la scène '…' » (`scene.pause.changeScene`) ; scène cible supprimée : « Changer de scène : scène supprimée » en rouge (PRS-07). `EditorStore.actionTextGroups` inclut l'élément, `EditorStore.sceneNameOf(id)`. Tests `action-pause.spec.ts`, `editor-store.spec.ts`, `editor-page.spec.ts`. ⚠️ À vérifier par Allan dans le navigateur, deux thèmes. |
| Entrée pour continuer en Présentation (FIL-05, NF-32) | ✅ Fait (2026-11-12) | ✅ Demande (Allan) : quand le dernier élément du fil est un « Clic de l'utilisateur » en attente, **Entrée** le valide (comme le bouton « Cliquer pour continuer » ou la touche C). Ignoré si un bouton, un lien ou un élément de menu a le focus (Entrée l'active déjà), pendant une saisie ou quand une fenêtre est ouverte. Ajouté à `PRESENTATION_SHORTCUTS` (nom de touche traduit : `keysKey`), `aria-keyshortcuts="Enter C"` sur le bouton du dernier élément. Test dans `gm-screen-page.spec.ts`. |
| Hauteur des zones de texte (`app-field`) | ✅ Fait (2026-11-12) | ✅ Demande (Allan) : la hauteur d'un champ suit celle de son texte. Directive `appInput` sur un `<textarea>` : CSS `field-sizing: content` (Chrome, Edge), repli JavaScript sinon (Firefox) qui ajuste la hauteur à la saisie, à une valeur posée par le code et à un changement de largeur (en gardant le défilement de la page). Hauteur minimale = `rows` lignes (`--app-input-rows`). Plus de barre de défilement dans le champ : `scrollbar-gutter` retiré du calque Markdown pour garder l'alignement du curseur. Tests `input.spec.ts`. ✅ Correction (Allan) : en sélectionnant le texte d'un champ Markdown, le texte transparent du `<textarea>` apparaissait (style global `::selection`) : `.app-markdown-editor::selection` le garde transparent, seul le fond de sélection se voit sous le calque ; `scrollbar-gutter` retiré aussi du `<textarea>`. ⚠️ À vérifier par Allan dans Chrome et Firefox (alignement du texte Markdown au focus, sélection). |
| Présentation sur tablette en V1 (transfert des projets du PC vers la tablette) | ✅ Décidé (Allan) : oui | Tablette **Android (Chrome)** en priorité ; transfert par **export / import de projet** et par **lecteur `.zip` hors ligne** ; l'application doit fonctionner **sans connexion internet** et se **lancer depuis un fichier HTML**. Lot 12 bis, qui commence par une conception (12b.1). |
| Mise en page Markdown des textes (SCN-14, FIL-10) | ✅ Fait (2026-11-09) | ✅ Décision (Allan) : textarea + barre d'outils (gras, italique, titre, listes, citation, Ctrl + B / Ctrl + I) ; rendu par la bibliothèque `marked` (nouvelle dépendance, `npm install`), HTML assaini par Angular (`[innerHTML]`). Module `shared/markdown` : `appMarkdownEditor` sur le `<textarea>` (la barre s'affiche d'elle-même dans `app-field`), pipe `markdown`, styles `.app-markdown`. Branché sur le texte de scène, les textes d'action et l'élément « Afficher un texte » ; rendu dans le fil (`Feed`). Le texte d'un « Clic de l'utilisateur » reste du texte brut. ✅ Décision (Allan) : la barre d'outils est masquée par défaut et n'apparaît qu'au focus du champ (`:focus-within` de `app-field`), en flottant juste au-dessus du champ, par-dessus le libellé ou le contenu qui précède (aucun décalage de mise en page). Tests « Ajouter un texte » mis à jour (« Afficher un texte »), ils échouaient depuis le renommage. ⚠️ À vérifier par Allan dans le navigateur, deux thèmes. ✅ Demande (Allan, 2026-11-10) : sans le focus, le champ affiche le texte **mis en page** ; avec le focus, le texte **source** avec ses marqueurs visibles **et** mis en forme en même temps (gras, italique, titre, citation, code, lien). Réalisation : le texte du `<textarea>` est transparent, `app-field` dessine par-dessus un calque `aria-hidden` (`highlightMarkdown`, `shared/markdown/markdown-highlight.ts`, ou pipe `markdown`) ; un clic sur le rendu donne le focus au champ. ⚠️ Le calque source doit garder la largeur des caractères (curseur aligné) : titre en couleur d'accent sans changer de taille ni de police, gras simulé par un contour (`-webkit-text-stroke`), italique synthétisé (Inter n'a pas de fichier italique : en ajouter un décalerait le curseur). Alignement vérifié dans Chromium (deux thèmes, défilement). |
| Défilement du fil sur une salve d'éléments (FIL-06) | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : quand plusieurs éléments s'affichent à la suite, le fil défile vers le **premier**, pas vers le dernier, pour laisser le temps de lire. Une salve commence à l'ouverture de la scène, après « Continuer » (Clic de l'utilisateur) et à la fin d'une attente ; ℹ️ aussi quand le MJ lance une action ou une battlemap à la main (même logique : un geste du MJ). Réalisation : `PresentationEngine` (`startBurst()` / `show()`), seul le premier élément montré d'une salve devient `focus` ; les suivants s'affichent dessous sans défilement. Les éléments d'avant la salve sont estompés, ceux de la salve non. ⚠️ Une salve plus haute que la zone oblige à faire défiler à la main pour voir la fin (ex. le bouton « Continuer »). Test du fil « N éléments précédents » adapté. |
| Pause entre les éléments affichés en Présentation | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : 0,5 s entre la fin de l'affichage d'un élément et le suivant, ✅ portée à **1 s** (Allan, 2026-11-10), sauf pour les éléments de son. ℹ️ Concernés : « Afficher un texte », « Afficher une battlemap », « Clic de l'utilisateur » ; non concernés : sons, « Attendre », « Changer de scène » (un son placé entre deux textes part avec le premier). L'écart vaut pour toute la scène, y compris d'une action d'ouverture à la suivante et entre actions lancées en parallèle (créneaux réservés) ; aucun délai si l'affichage précédent date de plus de 1 s (après un clic ou une attente). Le sélecteur de battlemap du MJ n'est pas retardé. Réalisation : `ActionContext.beforeDisplay()` appelé par `ActionRunner`, implémenté par `PresentationEngine` ; jeton `DISPLAY_GAP_MS` (1 s, 0 dans les tests via `usePresentation()`). |
| Fondu d'apparition des éléments du fil en Présentation | ✅ Fait (2026-11-10) | ✅ Décision (Allan) : fondu de 0,5 s, ✅ porté à **1 s** (Allan, 2026-11-10), à l'apparition de chaque élément du fil (texte, battlemap, clic, attente en cours). Animation CSS `feed-item-in` sur `.item` (`feed.scss`), nouveau jeton commun `duration(appear)` = 1 s (`_tokens.scss`, Brief §8). ℹ️ Les éléments déjà présents quand on ouvre ou reprend une scène apparaissent aussi en fondu ; désactivé avec « mouvements réduits ». Les éléments estompés finissent le fondu à leur opacité estompée. |
| Compte à rebours de l'élément « Attendre » en Présentation (ACT-10) | ✅ Fait (2026-11-09) | ✅ Décision (Allan) : pendant l'attente, une ligne en bas du fil affiche le temps restant (« 0:07 », arrondi à la seconde supérieure) ; ✅ Décision (Allan) : pas de barre de progression, c'est le **fond de la ligne** qui se remplit de gauche à droite (teinte `accent-tint-strong` sur `bg-card`, variable CSS `--wait-progress`) ; elle **disparaît** à la fin de l'attente et n'est **pas enregistrée** dans la partie (une attente interrompue par un changement de scène disparaît aussi). ℹ️ Info : `ActionContext.wait(element, signal)` remplace l'appel direct à `delay` dans `ActionRunner` ; le moteur expose `waits` (`PendingWait` : `endsAt`, `durationMs`) ; composant `FeedWait` (`gm-screen/feed-wait`, `role="timer"`). ⚠️ À vérifier par Allan dans le navigateur, deux thèmes. |
| Lancement hors ligne depuis un fichier HTML | ❓ Conception à valider (12b.1) | Vérifié : le build actuel ouvert en `file://` ne démarre pas (modules JavaScript bloqués par le navigateur, traductions chargées par requête). |
