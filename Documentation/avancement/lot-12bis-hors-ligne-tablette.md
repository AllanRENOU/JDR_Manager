# Lot 12 bis — Hors ligne et tablette

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

> Ajouté après le jalon J4 (décision d'Allan) : Présentation sur tablette Android (Chrome) en V1, application utilisable sans connexion internet et lancée depuis un fichier HTML, transfert des projets du PC vers la tablette.
>
> ✅ Décision (Allan, 16/11/2026) : lot fait **après le lot 15** (Fiches) : l'export, l'import et le lecteur hors ligne emportent aussi les fiches.
>
> ✅ Décisions (Allan, 16/11/2026) sur l'export / import de projet (12b.2, 12b.3) :
>
> - **Format** : un `.zip` contenant un fichier JSON (toutes les données du projet) et chaque fichier son, vidéo et image de battlemap. Pas de partie sauvegardée dans l'export.
> - **Bibliothèque zip** : **`@zip.js/zip.js`** (export et import en flux ; étude dans la note de 12b.2).
> - **Vidéos lourdes exclues par défaut** : une vidéo de **plus de 500 Mo** (`LARGE_VIDEO_BYTES`) n'est pas cochée par défaut dans l'export (le MJ peut la cocher).
> - **Identifiants conservés** à l'import (pas de nouveaux `id`). Un **média** dont l'`id` existe déjà n'est **pas réimporté** (un média ne change jamais après son import). Les autres objets dont l'`id` existe déjà sont **écrasés**.
> - **Bibliothèque** : à l'import, tous les sons et vidéos du zip (bibliothèque du projet **et** bibliothèque globale à l'export) vont dans la **bibliothèque du projet**. Un média déjà présent n'est pas réimporté.
> - **Projet déjà présent** : l'import demande confirmation (« Le projet « X » existe déjà et sera remplacé », avec les dates de modification).
> - **Tout le zip est importé** ; les objets locaux du projet absents du zip ne sont **pas** supprimés.
> - **Vidéo référencée mais absente du zip** : la vidéo est créée dans la bibliothèque du projet (même identifiant, sans fichier) ; la Bibliothèque affiche une **alerte** sur cette vidéo et permet d'**importer son fichier plus tard**. La vidéo garde son identifiant : les actions qui la lancent liront la vidéo importée.
> - **Parties sauvegardées** : ni exportées, ni modifiées par l'import.
> - **Dupliquer un projet** : noté dans les idées d'évolution (après la V1), pas fait maintenant.

- [ ] **12b.1** Conception : lancement hors ligne depuis un fichier HTML (fichier unique, application installable, ou autre), validée par Allan après prototypes sur PC et sur tablette Android. [O5, PRJ-04, NF-04]
  - Note : —
- [ ] **12b.2** Format d'export d'un projet (scènes, actions, fiches, battlemaps, sons et vidéos du projet, sons et vidéos de la bibliothèque globale utilisés) et « Exporter le projet » depuis l'accueil, avec la case « Inclure les vidéos » (cochée par défaut, poids affiché). [PRJ-04, PRJ-05, VID-13]
  - Note : ✅ Décisions (Allan, 16/11/2026) : voir l'en-tête du lot (zip = JSON + fichiers, `@zip.js/zip.js`, vidéos de plus de 500 Mo décochées par défaut, pas de partie sauvegardée).
    - ℹ️ Une vidéo exclue : son `LibraryNode` est écrit dans le JSON, son média est marqué « non inclus » (`id`, nom, type, taille, durée) et son fichier n'est pas dans le zip. Import : voir 12b.3.
    - ℹ️ Code actuel : le dépôt relit déjà toutes les données d'un projet, mais ne donne pas le contenu d'un média (seulement une URL) : ajouter `getMediaBlob(id)` au contrat. Aucune bibliothèque zip installée.
    - ℹ️ Bibliothèques zip étudiées (16/11/2026, versions npm du jour) :
      - **fflate** 0.8.3 (MIT) : rapide, léger, découpable (tree-shaking), lecture et écriture, flux (`Zip` / `Unzip`), Web Workers. Faille CVE-2026-45820 (boucle infinie dans `unzipSync` sur une archive ZIP64 malformée, déni de service), corrigée en **0.8.3** : imposer `>= 0.8.3`, préférer l'API en flux à `unzipSync` pour l'import.
      - **@zip.js/zip.js** 2.25.0 (BSD-3-Clause) : conçu pour les gros volumes, flux natifs (`ReadableStream` / `WritableStream`), Web Workers, ZIP64, chiffrement ; lit un zip par morceaux depuis un `File` sans le charger (utile à l'import de plusieurs Go). Plus gros (paquet de 8,7 Mo, mais découpable), API plus large. Aucune faille connue (OSV, Snyk).
      - **client-zip** 2.5.1 (MIT) : très petit, écriture en flux seulement, sans compression (idéal pour des médias déjà compressés). **Ne lit pas** les zip : il faudrait une 2ᵉ bibliothèque pour l'import. Aucune faille connue.
      - **JSZip** 3.10.2 (MIT ou GPL-3.0) : la plus connue, API simple, mais tout en mémoire (pas de vrai flux), lente et gourmande sur les gros fichiers : inadaptée aux vidéos. Failles CVE-2021-23413 (pollution de prototype, corrigée en 3.7.0) et CVE-2022-48285 (traversée de chemin dans `loadAsync`, corrigée en 3.8.0).
      - ✅ Décision (Allan, 16/11/2026) : **@zip.js/zip.js** (export et import en flux avec une seule bibliothèque). Dans tous les cas, à l'import : ne jamais utiliser les chemins du zip comme chemins de fichiers, valider le JSON (version du format, types) avant d'écrire, et limiter les tailles.
    - ⚠️ Écriture d'un zip de plusieurs Go : en flux vers le disque avec `showSaveFilePicker()` (Chrome, Edge) ; Firefox n'a pas cette API (limite de taille ou autre solution, à trancher en 12b.1). Médias écrits sans compression.
- [ ] **12b.3** « Importer un projet » (nouveau projet ou remplacement confirmé, vidéos sans fichier à compléter dans la Bibliothèque, fichiers refusés expliqués, quota). [PRJ-05]
  - Note : ✅ Décisions (Allan, 16/11/2026) : identifiants conservés ; média déjà présent (même `id`) non réimporté ; autres objets de même `id` écrasés ; sons et vidéos importés dans la bibliothèque du projet (voir l'en-tête du lot).
    - ℹ️ Conséquences : réimporter un projet le **remplace** (sauvegarde / restauration, aller-retour PC ↔ tablette) ; on ne peut pas importer une copie à côté de l'original (il faudrait un « Dupliquer le projet »). Un nœud venu de la bibliothèque globale dont l'`id` existe déjà (réimport sur le PC d'origine, où il est resté dans la bibliothèque globale) n'est pas déplacé dans la bibliothèque du projet : il est traité comme un média déjà présent. `uploadMedia` crée un nouvel `id` : il faudra une méthode d'import qui garde l'`id` du média.
    - ✅ Décisions (Allan, 16/11/2026) : confirmation si le projet existe déjà (dates de modification affichées) ; tout le zip est importé, les objets locaux absents du zip sont conservés ; partie sauvegardée ni exportée ni modifiée.
    - ✅ Décision (Allan, 16/11/2026) : vidéo référencée mais absente du zip (exclue à l'export) et dont le média n'existe pas déjà : la vidéo est créée dans la bibliothèque du projet avec ses identifiants (nœud et média), sans fichier. La Bibliothèque affiche une **alerte** sur la ligne et propose d'**importer le fichier** plus tard ; le fichier choisi est enregistré sous l'identifiant de média prévu, si bien que les actions « Lancer la vidéo » liront la vidéo importée sans modification.
    - ℹ️ À prévoir : savoir qu'un média est absent (le dépôt ignore aujourd'hui les médias introuvables dans `getMediaInfo`) ; en Présentation, une vidéo sans fichier doit donner la notification `presentation.errors.missingVideo` et l'action continue (aujourd'hui, seul un nœud sans `mediaId` est détecté : sinon la fenêtre joueurs recevrait la vidéo et renverrait `video-error`) ; dans l'éditeur, signaler aussi l'élément qui lance une vidéo sans fichier (PRS-07).
- [ ] **12b.4** Build hors ligne selon 12b.1 : traductions, polices et médias embarqués, navigation sans serveur. [TEC-90]
  - Note : —
- [ ] **12b.5** Mise en page tablette : fil à gauche, onglets Actions / Cartes / Sons, « Scène suivante » en bas, cibles ≥ 48 px. [CTL-12, Brief §7.3]
  - Note : —
- [ ] **12b.6** Tablette : un seul écran (pas de fenêtre joueurs, donc vidéos non diffusées et signalées, VID-07), plein écran et son débloqués au toucher, stockage persistant. [NF-04, TEC-43]
  - Note : —
- [ ] **12b.7** Lecteur `.zip` hors ligne : Présentation seule d'un projet exporté, fiches comprises (fenêtre de fiche, bouton « Fiches »). [PRJ-04]
  - Note : —
- [ ] **12b.8** Vérification sur une tablette Android réelle (Allan) et en émulation : import, séance complète, reprise. [Plan §2]
  - Note : —

**Critère de fin** : un projet préparé sur le PC est présenté sur la tablette Android sans connexion internet.
