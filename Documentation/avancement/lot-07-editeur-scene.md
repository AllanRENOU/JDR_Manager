# Lot 7 — Éditeur de scène

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 7.1 Structure et arborescence

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

## 7.2 Zone centrale

- [x] **7.2.1** Titre de la scène (modifiable). [—]
  - Note : —
- [x] **7.2.2** Champ texte de scène sans libellé visible (libellé d'accessibilité). [SCN-05]
  - Note : —
- [x] **7.2.3** Textes des actions : un champ modifiable par élément « Ajouter un texte », avec pastille du nom de l'action. [SCN-07]
  - Note : ✅ Décision (Allan) : la pastille du nom de l'action est remplacée par un sous-titre `<h3 class="action-title">` (police des titres, `font-size(dialog)`, plus petit que le titre de la scène, qui est le `<h2>`).

## 7.3 Volet droit

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
