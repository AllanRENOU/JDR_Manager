# Lot 10 — Écran de Présentation (PC)

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 10.1 Lancement

- [x] **10.1.1** Fenêtre de lancement : dernière scène, choix « Un seul écran » / « Deux fenêtres ». [AFF-01, AFF-03]
  - Note : —
- [x] **10.1.2** Continuer / Recommencer + confirmation destructive. [PRS-02, PRS-03]
  - Note : ✅ Décision (Allan, 11/11/2026) : plus de fenêtre de confirmation. « Recommencer » se valide en **restant appuyé 3 s** (souris, doigt, Espace ou Entrée ; `RESTART_HOLD_MS`) : le fond du bouton se remplit de gauche à droite (`--hold-progress`, piloté en JS pour rester visible avec `prefers-reduced-motion`) et revient à vide au relâchement. Un clic simple (ou un appui trop court) affiche sous le bouton un message (`role="alert"`). ⚠️ Alerte : avec « Deux fenêtres », la fenêtre joueurs s'ouvre 3 s après le début de l'appui ; Firefox peut alors la bloquer (activation utilisateur expirée), le bouton « Ouvrir la fenêtre joueurs » de l'en-tête permet de l'ouvrir. ℹ️ Info : comportement extrait dans la directive partagée `appHoldToConfirm` (`shared/ui/hold-to-confirm`), réutilisée par la fenêtre de confirmation (6.9).
- [x] **10.1.3** Sans partie sauvegardée : ouverture directe de la première scène (le clic de lancement débloque l'audio). [PRS-01, TEC-43]
  - Note : ✅ Décision : la fenêtre de lancement s'affiche aussi sans partie sauvegardée : elle porte le choix de l'affichage (AFF-03) et fournit le clic qui débloque l'audio (`AudioPlayer.unlock()` appelé dans le gestionnaire du clic, TEC-43).

## 10.2 En-tête

- [x] **10.2.1** Retour, nom du projet, chemin et nom de la scène, pastille « Fenêtre joueurs ouverte ». [—]
  - Note : —
- [x] **10.2.2** « Aller à une scène » : navigation libre via l'arborescence en lecture seule. [CTL-05]
  - Note : —

## 10.3 Fil d'actualité

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

## 10.4 Navigation entre scènes

- [x] **10.4.1** Bouton flottant « Scène suivante » : ouverture directe s'il n'y a qu'une scène. [CTL-04]
  - Note : ✅ Décision (Allan) : avec une seule scène suivante, le bouton affiche son nom (tronqué s'il est long ; `aria-label` « Scène suivante : <nom> »).
- [x] **10.4.2** Liste déroulante si plusieurs scènes suivantes. [CTL-04]
  - Note : —

## 10.5 Panneau de contrôle

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
