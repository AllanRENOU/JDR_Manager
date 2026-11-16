# JDR Manager — Avancement de l'implémentation (V1)

Suivi du [plan d'implémentation](./Plan_implementation.md). Chaque lot est découpé en sous-tâches vérifiables, détaillées dans un fichier par lot du dossier [`avancement/`](./avancement/).

## Mode d'emploi

- Ce fichier donne la vue d'ensemble : synthèse, description de chaque lot, points ouverts. **N'ouvrir le fichier d'un lot que si nécessaire** : lot en cours, ou recherche d'une décision / d'une note précise d'un lot passé.
- Une sous-tâche terminée est cochée dans le fichier du lot : `- [ ]` → `- [x]`.
- La ligne **Note** reste à `—` tant qu'il n'y a rien à signaler. Sinon, on y écrit une information, une remarque ou une alerte, préfixée si besoin par :
  - `ℹ️ Info :` choix d'implémentation, précision utile pour la suite ;
  - `⚠️ Alerte :` écart avec les documents, problème, risque, dette technique ;
  - `❓ Question :` décision à prendre par le porteur du projet.
- Une note qui modifie un comportement décrit dans le PRD, le TRD ou le brief doit aussi être reportée dans le document concerné.
- Les références entre crochets renvoient aux exigences (PRD / TRD) ou aux sections des documents.
- En fin de lot, la ligne `> ✅ Lot N validé : …` est ajoutée sous le « Critère de fin » du fichier du lot.
- Le tableau de synthèse ci-dessous (nombre de sous-tâches terminées, état, total) est mis à jour après chaque sous-tâche.

## Synthèse

| Lot | Intitulé | Sous-tâches | Terminées | État | Détail |
|---|---|---|---|---|---|
| 0 | Initialisation du projet | 12 | 12 | Terminé | [lot-00-initialisation.md](./avancement/lot-00-initialisation.md) |
| 1 | Styles, thèmes et internationalisation | 17 | 17 | Terminé | [lot-01-styles-themes-i18n.md](./avancement/lot-01-styles-themes-i18n.md) |
| 2 | Couche de données et médias | 17 | 17 | Terminé | [lot-02-donnees-medias.md](./avancement/lot-02-donnees-medias.md) |
| 3 | Composants partagés | 22 | 22 | Terminé | [lot-03-composants-partages.md](./avancement/lot-03-composants-partages.md) |
| 4 | Tranche verticale | 9 | 9 | Terminé | [lot-04-tranche-verticale.md](./avancement/lot-04-tranche-verticale.md) |
| 5 | Projets et paramètres | 9 | 9 | Terminé | [lot-05-projets-parametres.md](./avancement/lot-05-projets-parametres.md) |
| 6 | Bibliothèques de sons | 11 | 11 | Terminé | [lot-06-bibliotheques-sons.md](./avancement/lot-06-bibliotheques-sons.md) |
| 7 | Éditeur de scène | 17 | 17 | Terminé | [lot-07-editeur-scene.md](./avancement/lot-07-editeur-scene.md) |
| 8 | Éditeur d'action | 18 | 18 | Terminé | [lot-08-editeur-action.md](./avancement/lot-08-editeur-action.md) |
| 9 | Moteur de présentation et audio | 27 | 27 | Terminé | [lot-09-moteur-presentation.md](./avancement/lot-09-moteur-presentation.md) |
| 10 | Écran de Présentation (PC) | 21 | 21 | Terminé | [lot-10-ecran-presentation.md](./avancement/lot-10-ecran-presentation.md) |
| 11 | Fenêtre joueurs | 7 | 7 | Terminé | [lot-11-fenetre-joueurs.md](./avancement/lot-11-fenetre-joueurs.md) |
| 12 | Reprise et cohérence des données | 6 | 6 | Terminé | [lot-12-reprise-donnees.md](./avancement/lot-12-reprise-donnees.md) |
| 12 ter | Vidéos (fait avant le 12 bis) | 13 | 13 | Terminé | [lot-12ter-videos.md](./avancement/lot-12ter-videos.md) |
| 13 | Robustesse, performance, accessibilité | 16 | 15 | En cours | [lot-13-robustesse.md](./avancement/lot-13-robustesse.md) |
| 15 | Fiches (fait avant le 12 bis) | 11 | 11 | Terminé | [lot-15-fiches.md](./avancement/lot-15-fiches.md) |
| 16 | Export / import de projet (fait avant le 12 bis) | 7 | 7 | Terminé | [lot-16-export-import-projet.md](./avancement/lot-16-export-import-projet.md) |
| 12 bis | Hors ligne et tablette (fait après le 16) | 6 | 0 | À faire | [lot-12bis-hors-ligne-tablette.md](./avancement/lot-12bis-hors-ligne-tablette.md) |
| 14 | Recette V1 | 6 | 0 | À faire | [lot-14-recette-v1.md](./avancement/lot-14-recette-v1.md) |
| **Total** | | **252** | **239** | | |

---

## Lots

### Lot 0 — Initialisation du projet

Création du projet Angular 22 (zoneless, standalone), outillage (TypeScript strict, ESLint, Prettier, Stylelint, Vitest), arborescence du code et routes de base. — **Terminé** · [détail](./avancement/lot-00-initialisation.md)

### Lot 1 — Styles, thèmes et internationalisation

Jetons et fonctions SCSS, moteur de thèmes (Nuit dorée, Automne), Angular Material branché sur les jetons, polices auto-hébergées, icônes Lucide, services `UiPreferences` et `Theme`, Transloco. — **Terminé** · [détail](./avancement/lot-01-styles-themes-i18n.md)

### Lot 2 — Couche de données et médias

Modèle de données, contrat `DataRepository` et implémentation IndexedDB (`idb`), cascades de suppression, médias (`uploadMedia`, quota, `MediaUrls`), stockage persistant. — **Terminé** · [détail](./avancement/lot-02-donnees-medias.md)

### Lot 3 — Composants partagés

Composants d'interface de base (`shared/ui`), arborescence générique `app-tree`, fenêtre de sélection, dépôt de fichiers depuis le disque. — **Terminé** · [détail](./avancement/lot-03-composants-partages.md)

### Lot 4 — Tranche verticale

Premier parcours complet : accueil, éditeur minimal (texte de scène, enregistrement automatique), moteur et écran de Présentation minimaux. Jalon J2. — **Terminé** · [détail](./avancement/lot-04-tranche-verticale.md)

### Lot 5 — Projets et paramètres

Accueil complet (cartes de projet, renommer, supprimer) et Paramètres › Apparence (choix du thème). — **Terminé** · [détail](./avancement/lot-05-projets-parametres.md)

### Lot 6 — Bibliothèques de sons

Écran des sons (devenu « Bibliothèque » au lot 12 ter) : bibliothèque du projet et globale, import, durée, renommage, suppression, pré-écoute, test de quota. — **Terminé** · [détail](./avancement/lot-06-bibliotheques-sons.md)

### Lot 7 — Éditeur de scène

Éditeur de scène : arborescence des scènes, zone centrale (titre, textes), volet droit (actions, battlemaps, enchaînement). — **Terminé** · [détail](./avancement/lot-07-editeur-scene.md)

### Lot 8 — Éditeur d'action

Éditeur d'action : fenêtre, liste d'éléments réordonnable, formulaires des types d'éléments (Signal Forms), validation globale. Jalon J3. — **Terminé** · [détail](./avancement/lot-08-editeur-action.md)

### Lot 9 — Moteur de présentation et audio (sans interface)

Moteur de présentation sans interface : `ActionRunner`, `PresentationEngine`, `PlaySessionStore`, `AudioPlayer` (Web Audio) et leurs tests. — **Terminé** · [détail](./avancement/lot-09-moteur-presentation.md)

### Lot 10 — Écran de Présentation (PC)

Écran de Présentation PC : lancement (Continuer / Recommencer), en-tête, fil d'actualité, scène suivante, panneau de contrôle (battlemap, actions, sons). — **Terminé** · [détail](./avancement/lot-10-ecran-presentation.md)

### Lot 11 — Fenêtre joueurs

Fenêtre joueurs : ouverture par `window.open`, synchronisation par `BroadcastChannel`, battlemap plein écran, thème. — **Terminé** · [détail](./avancement/lot-11-fenetre-joueurs.md)

### Lot 12 — Reprise et cohérence des données

Reprise de partie et cohérence des données (fermeture brutale, sons restaurés, suppressions entre deux séances). Jalon J4. — **Terminé** · [détail](./avancement/lot-12-reprise-donnees.md)

### Lot 12 ter — Vidéos

Vidéos : import dans la « Bibliothèque », éléments « Lancer / Arrêter la vidéo », lecture dans la fenêtre joueurs avec coupure des sons, carte « Vidéo en cours ». — **Terminé** · [détail](./avancement/lot-12ter-videos.md)

### Lot 13 — Robustesse, performance, accessibilité

Robustesse, performance, accessibilité : quota, mesures de performance, clavier / ARIA / contrastes, compatibilité navigateurs, ajouts demandés en cours de route (mode démo, texte d'attente, actions masquées). — **En cours** · [détail](./avancement/lot-13-robustesse.md)

### Lot 15 — Fiches

Fiches du MJ (titre + texte Markdown) : onglet « Fiches », élément « Afficher une fiche », ouverture en Présentation (fil, bouton « Fiches », touche F). Intégré à la V1, fait avant le lot 12 bis. — **Terminé** · [détail](./avancement/lot-15-fiches.md)

### Lot 16 — Export / import de projet

Export d'un projet en `.zip` (JSON + fichiers son, vidéo et image, avec `@zip.js/zip.js`) depuis l'accueil, vidéos de plus de 500 Mo décochées par défaut ; import qui conserve les identifiants (sauvegarde / restauration, transfert vers la tablette) ; vidéos sans fichier complétées depuis la Bibliothèque. Sorti du lot 12 bis, fait avant lui. — **Terminé** · [détail](./avancement/lot-16-export-import-projet.md)

### Lot 12 bis — Hors ligne et tablette

Hors ligne et tablette Android : lancement depuis un fichier HTML, mise en page tablette, lecteur `.zip` (fiches comprises). Le transfert du projet utilise l'export / import du lot 16. Fait après le lot 16. — **À faire** · [détail](./avancement/lot-12bis-hors-ligne-tablette.md)

### Lot 14 — Recette V1

Recette V1 : scénario réel, séance de 4 heures, reprise, corrections, étiquette `v1.0.0`. Jalon J5. — **À faire** · [détail](./avancement/lot-14-recette-v1.md)
---

## Points ouverts

| Sujet | Statut | Note |
|---|---|---|
| Fiches du MJ (lot 15) | ✅ Fait (2026-11-16), intégré à la V1 | ✅ Demande (Allan) : notion de fiche (titre + texte Markdown) dans un onglet « Fiches » inspiré de la Bibliothèque, élément d'action « Afficher une fiche », ouverture manuelle en Présentation, fenêtre avec le contenu mis en forme. Décisions d'Allan : voir l'en-tête du lot 15. Documents mis à jour : PRD (§5.10 FCH-01 à FCH-09, ACT-16, FIL-11, CTL-14, glossaire), TRD (§1.5 TEC-54 à TEC-57, §2.2, §2.3, §3, §4.1, §4.2, §6.2, D12), Brief (§2.6, §6.9, §6.10, §7.2, §11.3), spécifications (§3.2), plan (lot 15, jalon J5). ✅ Décision (Allan) : lot 15 intégré à la V1, fait avant le lot 12 bis, puis la recette (lot 14). ✅ Lot terminé (voir la validation du lot 15) : choix techniques proposés retenus (`Sheet`, `features/sheets`, `show-sheet`, `ScrollText`, pause d'affichage, une fiche ouverte à la fois) ; ✅ Décision (Allan) : raccourcis ignorés tant qu'une fiche est ouverte. ❓ À valider : couleurs `--el-sheet-*` (`/dev/themes`). |
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
| Export / import de projet (lot 16) | ✅ Décisions (Allan, 16/11/2026) | Zip = JSON + fichiers, bibliothèque `@zip.js/zip.js` ; vidéos de plus de 500 Mo décochées par défaut ; identifiants conservés à l'import (média existant non réimporté, autres objets écrasés, rien de local supprimé, confirmation si le projet existe) ; tous les sons et vidéos dans la bibliothèque du projet ; vidéo absente du zip : alerte dans la Bibliothèque et import du fichier plus tard sous le même identifiant ; parties sauvegardées non exportées. « Dupliquer un projet » : idée d'évolution après la V1. ✅ Décision (Allan, 16/11/2026) : sorti du lot 12 bis dans un **lot 16**, fait avant le 12 bis. Détail : en-tête et notes du lot 16. |
| Lancement hors ligne depuis un fichier HTML | ❓ Conception à valider (12b.1) | Vérifié : le build actuel ouvert en `file://` ne démarre pas (modules JavaScript bloqués par le navigateur, traductions chargées par requête). |
