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

> ✅ Lot 5 validé : vérifié dans Chromium, dans les deux thèmes (pastille « Partie en cours », renommage, suppression avec confirmation et notification, Paramètres › Apparence avec changement de thème au clic et au clavier, conservé après rechargement). `ng build`, `ng test` (190 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : couleur de pastille `active`, `ProjectSummary` / `loadProjectSummary()`, `pluralKey()`, composant `ThemePreview`, route `/settings`, contrôle des branchements de thème dans `check:themes`. Pas de nouvelle dépendance.
