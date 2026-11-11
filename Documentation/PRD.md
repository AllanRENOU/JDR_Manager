# JDR Manager — Product Requirements Document (PRD)

| | |
|---|---|
| **Produit** | JDR Manager |
| **Auteur** | Allan Renou |
| **Version du document** | 1.0 — 5 novembre 2026 |
| **Statut** | Brouillon, à valider avant le début du développement |
| **Documents liés** | [`specifications.md`](./specifications.md) (détail fonctionnel) · [`TRD.md`](./TRD.md) (exigences techniques et architecture) · [Maquettes](https://claude.ai/artifact/6okmitt29oTdimnuJDEaqk) (écrans de référence) · [`Brief_UI_UX.md`](./Brief_UI_UX.md) (charte graphique) · [`Plan_implementation.md`](./Plan_implementation.md) (plan de réalisation) |

---

## 1. Contexte et problème

Pendant une partie de jeu de rôle, le Maître du Jeu (MJ) doit jongler en même temps entre ses notes de scénario, les cartes (battlemaps) à montrer aux joueurs et l'ambiance sonore. Ces éléments sont dispersés entre plusieurs outils (documents, visionneuse d'images, lecteur audio), ce qui casse le rythme de la partie et demande une préparation manuelle à chaque séance.

**JDR Manager** permet au MJ de **préparer** son scénario à l'avance sous forme de scènes enchaînées et d'actions scénarisées, puis de le **dérouler** pendant la partie depuis une interface unique.

## 2. Objectifs

| # | Objectif |
|---|---|
| O1 | Réunir dans un seul outil le texte, les battlemaps et l'ambiance sonore d'un scénario. |
| O2 | Permettre au MJ d'animer une partie en quelques clics, sans quitter l'outil ni chercher ses ressources. |
| O3 | Automatiser les enchaînements récurrents (texte + carte + son) grâce aux actions. |
| O4 | Ne jamais perdre l'avancement d'une partie : reprendre exactement là où on s'était arrêté. |
| O5 | Poser une base technique prête pour une ouverture au public (API, traduction, export hors ligne). |

### Non-objectifs (V1)

- Gestion des joueurs, des fiches de personnage ou des jets de dés.
- Jeu à distance / multi-utilisateurs en temps réel.
- Battlemaps interactives (pions, brouillard de guerre, grille…).
- Stockage sur un serveur ou synchronisation entre appareils.

## 3. Utilisateurs cibles

| Phase | Utilisateurs |
|---|---|
| **V1** | Usage personnel : l'auteur et éventuellement quelques MJ de son entourage. |
| **Plus tard** | Ouverture au public : tout MJ souhaitant préparer et animer ses parties. |

### Persona principal — le MJ

- Prépare ses scénarios sur PC, en amont de la séance.
- Anime en présentiel, avec son PC, éventuellement relié à un second écran (TV / projecteur) pour montrer les cartes aux joueurs.
- Veut garder les yeux sur la table, pas sur l'outil : l'interface de Présentation doit être simple et rapide.

## 4. Parcours utilisateur clés

1. **Préparer un scénario** : créer un projet → importer des sons → créer l'arborescence des scènes → pour chaque scène, écrire le texte, importer les battlemaps, paramétrer les actions et les scènes suivantes → définir la première scène.
2. **Lancer une partie** : ouvrir le projet en Présentation → choisir l'affichage (un écran ou deux fenêtres) → la première scène s'ouvre et ses actions d'ouverture se lancent.
3. **Animer une scène** : lire le fil d'actualité → déclencher des actions manuelles → valider les « clics de l'utilisateur » → changer de battlemap ou de son si besoin → passer à la scène suivante.
4. **Reprendre une partie** : rouvrir le projet en Présentation → choisir « Continuer » → retrouver la dernière scène dans l'état exact où elle était.
5. **Recommencer une partie** : choisir « Recommencer » → confirmer l'avertissement → la partie repart de la première scène.

---

## 5. Exigences fonctionnelles

**Priorités (MoSCoW)** :
**M** = Must (indispensable en V1) · **S** = Should (important, V1 si possible) · **C** = Could (souhaitable, si le temps le permet) · **W** = Won't (pas en V1, version future).

### 5.1 Projets

| ID | Exigence | Priorité |
|---|---|---|
| PRJ-01 | L'utilisateur peut lister, créer, renommer et supprimer des projets. Les projets sont affichés en cartes, sur une grille qui s'adapte à la largeur de l'écran ; la création se fait par une carte « Créer un projet » placée en dernier. | M |
| PRJ-02 | La suppression d'un projet demande une confirmation. | M |
| PRJ-03 | Un projet peut être ouvert en mode **Édition** ou en mode **Présentation**. | M |
| PRJ-04 | Export d'un projet en `.zip` autonome (HTML + toutes les ressources, y compris les sons de la bibliothèque globale utilisés), lisible hors ligne sur une tablette. | W |
| PRJ-05 | Sauvegarde / restauration d'un projet (`.zip` données + médias). Conception préalable nécessaire. | W |

### 5.2 Bibliothèques de sons

| ID | Exigence | Priorité |
|---|---|---|
| SON-01 | Il existe une **bibliothèque globale** (partagée par tous les projets) et une **bibliothèque par projet**. | M |
| SON-02 | L'utilisateur peut importer des fichiers audio depuis son PC avec un bouton qui ouvre le sélecteur de fichiers (sélection multiple). | M |
| SON-03 | Chaque son a un nom (modifiable) et un fichier. | M |
| SON-04 | Les bibliothèques sont organisées en arborescence de dossiers (créer, renommer, supprimer, déplacer), avec les mêmes interactions que l'arborescence des scènes (SCN-08 à SCN-11). | M |
| SON-05 | L'utilisateur peut pré-écouter un son depuis la bibliothèque. | S |
| SON-06 | L'utilisateur peut aussi importer des sons en les **glissant-déposant depuis son disque**. Pendant le glisser, un calque couvre tout l'écran et indique le nombre de fichiers, le dossier de destination (dossier ouvert) et les formats acceptés ; il disparaît au dépôt ou si le fichier ressort de la fenêtre. | M |

### 5.3 Scènes (Édition)

| ID | Exigence | Priorité |
|---|---|---|
| SCN-01 | Les scènes sont organisées en arborescence : les nœuds parents sont des **dossiers**, les feuilles sont des **scènes**. | M |
| SCN-02 | L'utilisateur peut créer, renommer, supprimer et déplacer (glisser-déposer) scènes et dossiers. | M |
| SCN-03 | Une scène (une seule par projet) peut être marquée comme **première scène**. | M |
| SCN-04 | Une scène peut avoir **une ou plusieurs scènes suivantes**, choisies dans une fenêtre de sélection (arborescence avec recherche, sélection multiple, scènes déjà suivantes pré-cochées, scène actuelle non sélectionnable). | M |
| SCN-05 | Une scène a un champ **« Texte de scène »**. Sa première saisie crée automatiquement l'action « Texte de scène » (déclencheur : ouverture de la scène ; élément : ajouter un texte). | M |
| SCN-06 | L'action « Texte de scène » est visible, non supprimable, se lance en premier parmi les actions d'ouverture, et peut recevoir d'autres éléments. | M |
| SCN-07 | Sous le texte de scène, chaque texte que les actions peuvent ajouter est un champ modifiable présenté comme le texte de scène, surmonté du nom de l'action en sous-titre (plus petit que le titre de la scène) ; aucun autre libellé. | M |
| SCN-08 | En haut de l'arborescence, des boutons **Nouveau dossier** et **Nouvelle scène** créent l'élément dans le dossier sélectionné (sinon à la racine). | M |
| SCN-09 | Chaque ligne de l'arborescence a un **menu contextuel**, ouvert par un bouton « ⋯ » au survol ou par un clic droit. Dossier : nouvelle scène, nouveau sous-dossier, renommer, supprimer. Scène : renommer, définir comme première scène, supprimer. | M |
| SCN-10 | Un clic sur un dossier le plie / déplie ; un clic sur une scène l'ouvre dans l'éditeur. | M |
| SCN-11 | La suppression d'un dossier ou d'une scène demande une confirmation ; pour un dossier, le message précise que son contenu sera supprimé. | M |
| SCN-12 | Le menu d'une scène propose **Dupliquer** (copie de la scène avec ses battlemaps et ses actions). | C |
| SCN-14 | Les textes (texte de scène, textes des actions, élément « Afficher un texte ») acceptent une mise en page **Markdown** ; une barre d'outils au-dessus du champ insère gras, italique, titre, listes à puces ou numérotées et citation (raccourcis Ctrl + B, Ctrl + I). Décision d'Allan. | S |
| SCN-13 | L'éditeur de scène sépare le contenu de la configuration : la zone centrale ne contient que les textes ; un volet droit regroupe trois parties repliables, ouvertes par défaut — **Actions**, **Battlemaps**, **Enchaînement** (première scène, scènes suivantes). Le volet défile s'il dépasse la hauteur de l'écran. | M |

### 5.4 Battlemaps (Édition)

| ID | Exigence | Priorité |
|---|---|---|
| BTM-01 | L'utilisateur peut importer une ou plusieurs images de battlemap dans une scène. | M |
| BTM-04 | Les images de battlemap peuvent aussi être importées par **glisser-déposer depuis le disque** sur l'éditeur de scène, avec le même calque plein écran que pour les sons ; elles sont ajoutées à la scène ouverte. | M |
| BTM-02 | Une battlemap de la scène est définie comme **battlemap par défaut**. | M |
| BTM-03 | Battlemaps plus riches que des images (à définir). | W |

### 5.5 Actions (Édition)

| ID | Exigence | Priorité |
|---|---|---|
| ACT-01 | Une action a un nom, un déclencheur et une liste ordonnée d'éléments exécutés les uns après les autres. | M |
| ACT-02 | Déclencheurs disponibles : **ouverture de la scène**, **clic manuel**. | M |
| ACT-03 | L'utilisateur peut ajouter, modifier, supprimer et réordonner (glisser-déposer) les éléments d'une action. Chaque élément est une carte dépliable qui affiche son formulaire. | M |
| ACT-04 | Élément **Afficher une battlemap** (choix parmi les battlemaps de la scène). | M |
| ACT-05 | Élément **Lancer un son** (choix dans une bibliothèque) avec **volume**, **lecture en boucle**, **fondu en entrée** et **fondu en sortie**. | M |
| ACT-06 | Élément **Arrêter un son** (choix dans une bibliothèque). | M |
| ACT-07 | Élément **Arrêter tous les sons**. | M |
| ACT-08 | Élément **Ajouter un texte** (texte ajouté au fil d'actualité). | M |
| ACT-09 | Élément **Changer de scène** (choix de la scène cible dans la fenêtre de sélection, en sélection unique). Un avertissement indique que les éléments suivants de l'action ne seront pas exécutés. | M |
| ACT-10 | Élément **Attendre** (durée en secondes). En Présentation, pendant l'attente, une ligne en bas du fil affiche le temps restant (compte à rebours) ; elle disparaît à la fin de l'attente et n'est pas enregistrée. | M |
| ACT-11 | Élément **Clic de l'utilisateur** (texte obligatoire ; met l'action en pause jusqu'au clic du MJ). | M |
| ACT-12 | Élément **Faire apparaître une action**. | W |

### 5.6 Présentation — lancement et persistance

| ID | Exigence | Priorité |
|---|---|---|
| PRS-01 | Sans partie sauvegardée, la Présentation ouvre la **première scène**. | M |
| PRS-02 | Si une partie sauvegardée existe, le MJ choisit **Continuer** ou **Recommencer**. | M |
| PRS-03 | « Recommencer » affiche un avertissement (tout ce qui a été fait sera perdu) et demande confirmation. | M |
| PRS-04 | L'état de **chaque scène** est sauvegardé automatiquement : actions effectuées, battlemap affichée, sons en cours (avec leur état de pause et leur volume, sans la position de lecture), fil d'actualité. | M |
| PRS-05 | « Continuer » rouvre la dernière scène ouverte dans l'état exact où elle était ; les sons en cours reprennent depuis le début. | M |
| PRS-06 | Revenir sur une scène déjà visitée restaure son état, sans relancer ses actions d'ouverture. | M |
| PRS-07 | Si le projet a été modifié : une action supprimée n'est plus visible ; une battlemap supprimée affiche un message d'erreur ; un son supprimé n'est pas lancé et un message d'erreur s'affiche ; un élément « Changer de scène » dont la scène cible a été supprimée ne change pas de scène et un message d'erreur s'affiche (il est aussi signalé dans l'éditeur d'action). | M |
| PRS-08 | Plusieurs parties sauvegardées par projet (ex. une par groupe). | W |

### 5.7 Présentation — affichage

| ID | Exigence | Priorité |
|---|---|---|
| AFF-01 | Mode **un seul écran** : tout est affiché sur l'écran du MJ. | M |
| AFF-02 | Mode **deux fenêtres** : une fenêtre joueurs (TV / projecteur) n'affiche que la battlemap courante, synchronisée en temps réel avec l'écran du MJ. | S |
| AFF-03 | Le choix du mode d'affichage se fait au lancement de la Présentation. | S |

### 5.8 Présentation — fil d'actualité

| ID | Exigence | Priorité |
|---|---|---|
| FIL-01 | Chaque scène a son propre fil d'actualité ; au changement de scène, le fil de la scène quittée est retiré et celui de la nouvelle scène est affiché. | M |
| FIL-02 | Chaque texte ajouté par une action est inséré sous les éléments existants. | M |
| FIL-03 | Chaque changement de battlemap ajoute une miniature au fil. | M |
| FIL-04 | Un clic sur une miniature ouvre la battlemap en grand dans une modale. | M |
| FIL-05 | Un élément « Clic de l'utilisateur » affiche son texte, puis un bouton **« Cliquer pour continuer »** en bas à droite du bloc ; l'action reprend après le clic ; le bloc reste ensuite dans le fil, marqué comme validé. | M |
| FIL-06 | À chaque nouvel élément, le fil défile automatiquement pour placer cet élément en haut de l'écran. | M |
| FIL-07 | Le MJ peut remonter dans le fil pour relire les éléments précédents. | M |
| FIL-08 | Les sons et les noms des actions ne sont pas tracés dans le fil. | M |
| FIL-09 | Les textes ne sont pas modifiables en Présentation. | M |
| FIL-10 | Le Markdown des textes est interprété dans le fil (titres, gras, italique, listes, citations, liens, tableaux) ; un lien s'ouvre dans un nouvel onglet. | S |

### 5.9 Présentation — contrôles

| ID | Exigence | Priorité |
|---|---|---|
| CTL-01 | La liste des actions manuelles de la scène est accessible ; une action effectuée est masquée. | M |
| CTL-02 | Un bouton « Voir toutes les actions » affiche aussi les actions effectuées et masquées. | M |
| CTL-03 | Une action effectuée peut être relancée ; un texte déjà présent dans le fil n'est pas dupliqué, le fil défile jusqu'à lui. | M |
| CTL-04 | Un bouton **« Scène suivante »** flotte en bas à droite de la zone du fil d'actualité (pas de pied de page). Une seule scène suivante : le bouton l'ouvre directement. Plusieurs : un clic ouvre une liste, comme un menu déroulant, pour choisir la scène. | M |
| CTL-05 | Un bouton de **navigation libre**, plus discret, ouvre l'arborescence des scènes pour aller vers n'importe quelle scène. | M |
| CTL-06 | Au changement de scène, les actions en cours sont interrompues et les sons en cours sont coupés **en fondu**. | M |
| CTL-07 | Un sélecteur permet de choisir la battlemap affichée parmi celles de la scène. | M |
| CTL-08 | Le MJ voit les sons en cours, peut **mettre en pause / reprendre** chacun d'eux (pas d'arrêt manuel), et peut lancer n'importe quel son des bibliothèques. | M |
| CTL-09 | Un clic sur la carte d'un son en cours l'agrandit et affiche un **curseur de volume**. | M |
| CTL-10 | Un bouton global **lecture / pause** affiche Pause tant qu'au moins un son joue (met tout en pause) et Lecture quand tous sont en pause (fait tout reprendre). | M |
| CTL-11 | Sur PC, le panneau de contrôle a trois parties repliables (Battlemap, Actions, Sons), avec un résumé dans chaque en-tête ; le bouton lecture / pause global reste visible dans l'en-tête de Sons. L'état plié / déplié est mémorisé comme préférence d'affichage. | S |
| CTL-12 | Sur tablette, le panneau de contrôle utilise des onglets (Actions, Cartes, Sons) avec de grandes zones tactiles. | W |

---

## 6. Exigences non fonctionnelles

> Seules les exigences visibles par l'utilisateur figurent ici. Les choix techniques (framework, stockage, architecture, audio, tests…) sont dans le [TRD](./TRD.md).

### 6.1 Plateforme et compatibilité

| ID | Exigence | Priorité |
|---|---|---|
| NF-01 | L'outil est une application web utilisée dans un navigateur, sans installation ni création de compte. | M |
| NF-02 | Navigateurs supportés en V1 : **Chrome / Edge** et **Firefox**, dernières versions, sur **PC**. | M |
| NF-03 | Interface conçue pour des écrans d'ordinateur (à partir de 1280 px de large). | M |
| NF-04 | Safari, tablettes et usage tactile. | W |

### 6.2 Données et stockage

| ID | Exigence | Priorité |
|---|---|---|
| NF-10 | Les projets et leurs fichiers (images, sons) sont enregistrés **localement**, dans le navigateur, sans dépendre d'un serveur. | M |
| NF-11 | Les fichiers importés sont copiés dans l'outil : déplacer ou supprimer le fichier d'origine sur le PC n'a aucun effet sur le projet. | M |
| NF-12 | L'outil demande au navigateur de ne pas effacer ses données automatiquement (seule une action volontaire de l'utilisateur doit pouvoir les supprimer). | M |
| NF-14 | L'application affiche la place de stockage utilisée. | C |
| NF-15 | Stockage en ligne et accès depuis plusieurs appareils. | W |

### 6.3 Performance et fiabilité

| ID | Exigence | Priorité |
|---|---|---|
| NF-20 | Le changement de scène et le lancement d'une action sont perçus comme immédiats (< 300 ms hors temporisations prévues). | S |
| NF-21 | Plusieurs sons peuvent être joués simultanément sans coupure ni décalage audible. | M |
| NF-22 | Les longues ambiances sonores (plusieurs dizaines de minutes) sont lues sans ralentir l'application. | M |
| NF-23 | Une séance de 4 heures ne provoque pas de ralentissement progressif de l'application. | M |
| NF-24 | L'état de la partie est sauvegardé à chaque changement : une fermeture inattendue du navigateur ne fait rien perdre. | M |
| NF-25 | Une ressource manquante (battlemap, son) n'interrompt jamais la partie : un message d'erreur est affiché et la partie continue. | M |

### 6.4 Ergonomie

| ID | Exigence | Priorité |
|---|---|---|
| NF-30 | En Présentation, les actions courantes (action suivante, scène suivante, arrêter les sons) sont accessibles en un clic. | M |
| NF-31 | Toute suppression en Édition demande une confirmation. | M |
| NF-32 | Raccourcis clavier pour les commandes fréquentes de la Présentation. | C |
| NF-33 | Le MJ peut **changer le thème** de l'application (Paramètres › Apparence, cartes d'aperçu). Le changement est immédiat, s'applique à tous les écrans y compris la fenêtre joueurs, et est mémorisé comme préférence d'affichage. | M |
| NF-34 | Deux thèmes en V1 : **Nuit dorée** (par défaut) et **Automne** (thème clair, ambiance chaleureuse, couleurs automnales) — cf. Brief UI/UX §11. | M |
| NF-35 | Ajouter un thème ne demande que de créer un fichier de thème, sans modifier les écrans. | M |

### 6.5 Langue et évolutivité

| ID | Exigence | Priorité |
|---|---|---|
| NF-40 | Interface en **français** en V1. | M |
| NF-41 | L'interface doit pouvoir être traduite dans d'autres langues sans refonte. | M |
| NF-42 | Les arborescences (scènes, bibliothèques de sons, navigation libre) se manipulent toutes de la même façon. | M |
| NF-43 | Interface traduite dans d'autres langues. | W |

---

## 7. Critères de succès de la V1

- Un scénario complet (au moins 10 scènes, plusieurs battlemaps et sons) peut être préparé entièrement dans l'outil.
- Une séance réelle peut être animée de bout en bout **sans quitter l'outil** ni recourir à un autre lecteur audio ou visionneuse d'images.
- Après fermeture du navigateur en cours de partie, « Continuer » restaure la partie à l'identique.
- Aucune erreur bloquante pendant une séance de 4 heures.

## 8. Hypothèses, dépendances et risques

| Type | Description | Mitigation |
|---|---|---|
| Risque | **Perte de données** : vider les données du navigateur efface tous les projets. | Demande de stockage persistant (NF-12, TRD TEC-26) ; sauvegarde / restauration en version future (PRJ-05). |
| Risque | **Quota de stockage** atteint avec de nombreux sons ou grandes images. | Affichage de la place utilisée (NF-14) ; message clair en cas d'échec d'import. |
| Risque | **Lecture audio bloquée** : les navigateurs interdisent la lecture automatique de son avant une interaction de l'utilisateur. | Le lancement de la Présentation passe par un clic (choix Continuer / Recommencer / affichage), ce qui débloque l'audio. |
| Hypothèse | Le MJ anime en présentiel avec un PC (et éventuellement un second écran). | — |
| Question ouverte | **Présentation sur tablette en V1** : souhaitée, mais une tablette n'a pas accès aux projets enregistrés dans le navigateur du PC. | À décider : avancer un export / import de projet, avancer l'export `.zip` (PRJ-04), ou garder la tablette hors V1 (NF-04). |
| Dépendance | La future API n'est pas définie ; la couche d'accès aux données (TRD TEC-21) doit rester assez générique pour s'y adapter. | Revue de l'interface au moment de la conception de l'API. |

## 9. Hors périmètre V1 (récapitulatif)

- Export `.zip` autonome hors ligne (PRJ-04)
- Sauvegarde / restauration de projet (PRJ-05)
- Plusieurs parties sauvegardées par projet (PRS-08)
- Élément d'action « Faire apparaître une action » (ACT-12)
- Battlemaps enrichies (BTM-03)
- Stockage en ligne / multi-appareils (NF-15)
- Safari, tablettes, tactile (NF-04)
- Traduction dans d'autres langues (NF-43)

## 10. Glossaire

| Terme | Définition |
|---|---|
| **MJ** | Maître du Jeu : la personne qui anime la partie. |
| **Projet** | Un scénario ou une campagne, composé de scènes. |
| **Scène** | Un moment du scénario, avec son texte, ses battlemaps et ses actions. |
| **Battlemap** | Carte ou image montrée aux joueurs. |
| **Action** | Suite d'éléments (texte, carte, son, attente…) lancée à l'ouverture d'une scène ou par un clic du MJ. |
| **Fil d'actualité** | Zone de l'écran du MJ où s'affichent, dans l'ordre, les textes et battlemaps de la scène. |
| **Partie sauvegardée** | État de la Présentation d'un projet (scène courante et état de chaque scène). |
