# Lot 12 — Reprise et cohérence des données

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

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
