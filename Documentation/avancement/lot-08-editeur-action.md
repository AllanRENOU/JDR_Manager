# Lot 8 — Éditeur d'action

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 8.1 Fenêtre d'édition

- [x] **8.1.1** Fenêtre modale : nom, déclencheur (contrôle segmenté), Annuler / Enregistrer. [ACT-01, ACT-02]
  - Note : ✅ Décision : « Texte de scène » garde toujours le déclencheur « Ouverture de la scène » (contrôle désactivé + explication). ✅ Décision : fermeture seulement par Annuler / × / Enregistrer (pas par Échap ni clic à côté), pour ne pas perdre une saisie ; Annuler abandonne sans confirmation. ⚠️ Évolution (20/11/2026, demande d'Allan) : le contrôle segmenté est **retiré** ; le déclencheur s'affiche en lecture seule (icône ▶ / ✋ + libellé `action.triggers.*`). Seule l'action « Ouverture de la scène » (ex-« Texte de scène ») se lance à l'ouverture ; une nouvelle action est toujours manuelle (`EditorStore.saveAction` ignore tout déclencheur demandé). Voir `avancement.md`, sujet « Une seule action à l'ouverture de la scène ».
- [x] **8.1.2** Suppression de l'action (confirmation ; impossible pour « Texte de scène »). [SCN-06, NF-31]
  - Note : —
- [x] **8.1.3** Formulaire pilote en Signal Forms pour valider l'approche avant les 8 types. [TEC-06, Plan §6]
  - Note : ✅ Décision : approche Signal Forms validée. Enseignements : (1) modèle = `signal` d'une **copie de travail** + `form(draft, schema)` ; (2) validation dans le schéma : `validate()` pour « obligatoire » (refuse aussi les espaces seuls, que `required()` laisse passer), `maxLength()` (l'attribut `maxlength` est **interdit** sur un champ `[formField]`, erreur NG8022) ; (3) `disabled(path, () => …)` se transmet tout seul à un contrôle maison qui a une entrée `disabled` (`FormValueControl`) ; (4) messages d'erreur = **clés de traduction** ; (5) `[formField]` ne pose pas `aria-invalid` : l'ajouter nous-mêmes ; (6) erreurs montrées après `markAsTouched()`.

## 8.2 Liste des éléments

- [x] **8.2.1** Liste ordonnée réordonnable par glisser-déposer (poignée). [ACT-03]
  - Note : ⚠️ Alerte : comme pour les actions (7.3.2), pas encore d'équivalent au clavier pour réordonner.
- [x] **8.2.2** Carte d'élément dépliable : icône et couleur du type, résumé replié, boutons Supprimer / Replier. [ACT-03, Brief §2.6]
  - Note : ✅ Décision (Allan) : un clic n'importe où sur l'en-tête déplie / replie la carte (pas seulement la flèche) : la zone de clic du bouton flèche (`.card__toggle::after`) couvre l'en-tête, poignée et Supprimer passent au-dessus ; le bouton reste le seul élément focalisable. Non testable dans jsdom (pas de calcul de position).
- [x] **8.2.3** Menu « Ajouter un élément » (8 types). [ACT-03]
  - Note : ✅ Décision (Allan) : à l'ajout, tous les autres éléments se replient (seul le nouvel élément est déplié).

## 8.3 Formulaires des éléments

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

## 8.4 Validation et finitions

- [x] **8.4.1** Validation globale (champs obligatoires, valeurs numériques) avant enregistrement. [—]
  - Note : ✅ Décision : une cible **supprimée** (scène, son, battlemap) n'empêche pas l'enregistrement : elle reste signalée (PRS-07, décision d'Allan) ; seule une cible jamais choisie bloque. ⚠️ Alerte : Signal Forms marque les objets des listes d'une clé `Symbol` ; l'éditeur renvoie une copie (`structuredClone`).
- [x] **8.4.2** Mise à jour immédiate de la zone centrale et du volet de l'éditeur de scène après enregistrement. [SCN-07]
  - Note : —
- [x] **8.4.3** Vérifier le rendu dans les deux thèmes. [Brief §11]
  - Note : —
- [x] **8.4.4** Jalon J3 : saisir un scénario de test (≥ 10 scènes, battlemaps, sons, actions). [PRD §7]
  - Note : ℹ️ Info : la carte de l'accueil ne compte que les sons du projet, pas ceux de la bibliothèque globale.

> ✅ Lot 8 validé : éditeur d'action complet (nom, déclencheur, éléments réordonnables, formulaires des 8 types, validation globale) vérifié dans Chromium dans les deux thèmes ; jalon **J3** atteint avec un scénario de 11 scènes saisi par l'interface (cf. 8.4.4). `ng build` (sans avertissement), `ng test` (289 tests), `ng lint`, `npm run lint:styles` et `npm run format:check` passent. Ajouts : `ActionEditor`, `ElementCard`, `ElementForm`, `element-types.ts`, `element-validation.ts`, `sound-choice.ts` ; fenêtres empilées (fond opaque sur la première seulement). Pas de nouvelle dépendance, rien à faire côté Allan. Pas d'écart au TRD.
