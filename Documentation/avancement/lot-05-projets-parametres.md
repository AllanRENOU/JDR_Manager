# Lot 5 — Projets et paramètres

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 5.1 Accueil

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

## 5.2 Paramètres › Apparence

- [x] **5.2.1** Accès depuis l'en-tête (icône réglages). [NF-33]
  - Note : ✅ Décision : les Paramètres sont un écran à part (route `/settings`) plutôt qu'une modale, pour accueillir d'autres sections plus tard. Accès par l'icône réglages en haut à droite de l'accueil.
- [x] **5.2.2** Cartes d'aperçu des thèmes construites à partir des jetons de chaque thème. [NF-33, NF-34]
  - Note : —
- [x] **5.2.3** Changement immédiat et mémorisé ; vérifier qu'ajouter un thème ne demande qu'un fichier. [NF-35]
  - Note : ⚠️ Alerte : NF-35 est respecté pour les écrans (aucun écran à modifier), mais un nouveau thème demande en pratique 1 fichier SCSS + 3 branchements courts (`styles.scss`, `THEMES`/`ThemeId`, nom dans `fr.json`). `npm run check:themes` vérifie ces branchements et signale précisément ce qui manque.

## 5.3 Image d'illustration du projet (ajout du 18/11/2026)

Demande d'Allan : une image d'illustration par projet, montrée sur la carte de l'accueil à la place de la battlemap, choisie dans les paramètres du projet et exportée avec lui.

- [x] **5.3.1** Modèle et dépôt : `Project.imageMediaId?: Id | null`, `DataRepository.setProjectImage(projectId, mediaId | null)` (une transaction : projet, date de modification, ancienne image supprimée si inutilisée) ; `isMediaUsed` compte les images de projet ; `deleteProject` supprime l'image. [PRJ-01, TEC-21]
  - Note : ℹ️ Info : champ facultatif, sans index ni changement de schéma (`DB_VERSION` inchangé) : `isMediaUsed` lit les projets (peu nombreux). `EditorStore.saveProject` et `SheetsStore.touchProject` relisent `imageMediaId` dans le dépôt avant d'enregistrer leur copie du projet : sinon une image choisie dans les paramètres pendant l'édition serait écrasée.
- [x] **5.3.2** Paramètres › Projet : composant `ProjectImage` (`features/settings/project-image`), aperçu au format de la vignette, « Choisir une image » / « Remplacer l'image », « Retirer l'image », formats acceptés (PNG, JPG, WebP). [PRJ-01]
  - Note : ✅ Décision (Allan) : section visible dans la fenêtre Paramètres ouverte depuis les écrans d'édition du projet (Scènes, Fiches, Bibliothèque du projet), pas en Présentation ni dans `/settings` (accueil). `SettingsButton` reçoit `projectId`, transmis par `SettingsDialog` (`data.projectId`) à `SettingsContent`. Actions : choisir / remplacer et retirer, sans cadrage (affichage recadré `object-fit: cover`). ✅ Décision (Allan) : l'image du projet ne doit jamais devenir une battlemap. Le `appFileDrop` de l'éditeur (et de la Bibliothèque) écoute toute la page et importait un fichier déposé sur la fenêtre Paramètres : la directive ignore maintenant tout dépôt tant qu'une fenêtre est ouverte (`Modals.isOpen()`, dépôt refusé sans que le navigateur ouvre le fichier). Le choix de l'image se fait par le bouton. Libellé du stockage : « Images (battlemaps, projets) ».
- [x] **5.3.3** Carte de l'accueil : vignette = image du projet, sinon visuel quadrillé. [PRJ-01]
  - Note : ✅ Décision (Allan) : la battlemap de la première scène n'est plus utilisée comme vignette (`loadProjectSummary` ne lit plus scènes ni battlemaps pour la vignette).
- [x] **5.3.4** Export / import : l'image est exportée comme les autres médias (`collectProject`), `imageMediaId` validé (facultatif, `null` accepté), média importé avec le projet. [PRJ-05]
  - Note : ℹ️ Info : `ARCHIVE_VERSION` inchangé (champ facultatif, lisible par l'ancienne version qui l'ignore). À l'import, un export sans `imageMediaId` (antérieur) garde l'image locale ; une image locale remplacée est supprimée si plus rien ne l'utilise.
- [x] **5.3.5** Vérification dans Chrome, dans les deux thèmes (fenêtre Paramètres sans image, avec image, carte de l'accueil).
  - Note : —

> ✅ Lot 5 validé : vérifié dans Chromium, dans les deux thèmes (pastille « Partie en cours », renommage, suppression avec confirmation et notification, Paramètres › Apparence avec changement de thème au clic et au clavier, conservé après rechargement). `ng build`, `ng test` (190 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : couleur de pastille `active`, `ProjectSummary` / `loadProjectSummary()`, `pluralKey()`, composant `ThemePreview`, route `/settings`, contrôle des branchements de thème dans `check:themes`. Pas de nouvelle dépendance.

> ✅ Lot 5 (5.3, image du projet) validé : vérifié dans Chrome (Linux), thèmes Nuit dorée et Automne : choix, remplacement de l'image, carte de l'accueil, place occupée dans Stockage. `ng build`, `ng test` (715 tests), `ng lint`, `npm run lint:styles`, `npm run format:check`, `npm run check:themes` et `npm run check:i18n` passent. Pas de nouvelle dépendance, pas de changement de schéma ni de version d'export. Écart : la vignette n'utilise plus la battlemap de la première scène (décision d'Allan).
