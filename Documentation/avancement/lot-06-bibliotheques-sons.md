# Lot 6 — Bibliothèques de sons

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

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
