# Lot 3 — Composants partagés

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 3.1 Composants d'interface de base (`shared/ui`)

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

## 3.2 Composant d'arborescence générique

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

## 3.3 Fenêtre de sélection

- [x] **3.3.1** Fenêtre réutilisable : arborescence en lecture seule + champ de recherche + compteur. [SCN-04]
  - Note : —
- [x] **3.3.2** Modes sélection multiple (pré-cochés, éléments désactivés) et sélection unique. [SCN-04, ACT-09]
  - Note : —

## 3.4 Dépôt de fichiers

- [x] **3.4.1** Directive `appFileDrop` : événements de glisser au niveau de la fenêtre, uniquement pour les fichiers (`dataTransfer.types`), compteur d'entrées / sorties. [TEC-35]
  - Note : —
- [x] **3.4.2** Calque plein écran (nombre de fichiers, destination, formats). [Brief §6.13]
  - Note : —
- [x] **3.4.3** Filtrage des formats acceptés et signalement des fichiers refusés. [TEC-34]
  - Note : ℹ️ Info : ajouts au TRD : sortie `filesRejected` et entrée `appFileDropNotify` (notification d'erreur qui nomme les fichiers refusés, désactivable).

**Critère de fin** : arborescence et fenêtre de sélection fonctionnent avec des données de test ; le calque de dépôt s'affiche et filtre les formats.

> ✅ Lot 3 validé : `ng build`, `ng test` (142 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Tous les composants sont réunis sur la page temporaire `/dev/components` avec des données de test, vérifiés dans les deux thèmes. Écarts au TRD : noms CLI sans suffixe (`Tree`, `SelectionDialog`, `Selections`), option `hidden` des entrées de menu, sorties `filesRejected` et entrées `appFileDropKinds` / `appFileDropNotify` de la directive de dépôt.
