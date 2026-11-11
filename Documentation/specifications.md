# JDR Manager — Synthèse des idées

> Outil d'aide au Maître du Jeu (MJ) pour préparer puis animer une partie de jeu de rôle.
>
> Maquettes de référence : artifact « JDR Manager — Maquettes » (https://claude.ai/artifact/6okmitt29oTdimnuJDEaqk).
>
> Charte graphique : [`Brief_UI_UX.md`](./Brief_UI_UX.md).

---

## 1. Vue d'ensemble

L'outil permet de gérer **plusieurs projets** (un projet = un scénario / une campagne).

Chaque projet peut être ouvert selon deux modes :

| Mode | Rôle |
|---|---|
| **Édition** | Créer et paramétrer le contenu du projet : scènes, battlemaps, actions, sons… |
| **Présentation** | Utilisé pendant la partie : affiche la scène courante et propose au MJ les actions paramétrées. |

Deux ressources transverses :

- une **bibliothèque de sons** (upload de fichiers audio depuis le PC) ;
- les **images de battlemap** (importées dans chaque scène).

---

## 2. Gestion des projets

- Lister, créer, renommer, supprimer un projet.
- La page d'accueil affiche les projets sous forme de **cartes** (grille dont le nombre de colonnes s'adapte à la largeur de l'écran). La création se fait par une carte **« Créer un projet »**, toujours en dernière position (pas de bouton séparé dans l'en-tête).
- Ouvrir un projet en mode **Édition** ou en mode **Présentation**.
- **Paramètres › Apparence** (icône réglages dans l'en-tête de l'accueil) : choix du **thème** de l'application parmi des cartes d'aperçu — **Nuit dorée** (par défaut) ou **Automne**. Changement immédiat, mémorisé comme préférence d'affichage (cf. Brief UI/UX §11, TRD §10).
- *(Version future)* Bouton **Exporter** : génère un `.zip` **autonome** contenant :
  - des fichiers HTML permettant de lire le projet en mode Présentation, sans l'application ;
  - **toutes** les ressources nécessaires (images, sons du projet **et** sons de la bibliothèque globale utilisés par le projet, scripts, styles…).
  - Objectif : pouvoir lire le projet sur une **tablette non connectée à Internet** (aucun appel réseau, aucune dépendance CDN).

---

## 3. Bibliothèque de sons

- Deux niveaux de bibliothèque :
  - une **bibliothèque globale**, partagée par tous les projets ;
  - une **bibliothèque propre à chaque projet**.
- Chaque bibliothèque est organisée en **arborescence de dossiers**, gérée par le même composant générique que l'arborescence des scènes (cf. §8.4).
- Import de fichiers audio depuis le PC (upload), de deux façons :
  - bouton **« Importer des sons »**, qui ouvre le sélecteur de fichiers (sélection multiple possible) ;
  - **glisser-déposer** de fichiers depuis le disque : dès qu'un fichier entre dans la fenêtre, un calque couvre tout l'écran et indique le nombre de fichiers, le dossier de destination (le dossier ouvert) et les formats acceptés. Le calque disparaît au dépôt ou si le fichier ressort de la fenêtre. Un fichier au format refusé est signalé.
- Chaque son a au minimum un nom et un fichier.
- Plusieurs sons peuvent être joués **simultanément**.
- Les paramètres de lecture **ne sont pas portés par le son** mais par chaque élément « Lancer un son » (cf. §4.3).
- Les sons des bibliothèques sont utilisables :
  - dans les actions (lancer / arrêter un son) ;
  - directement en mode Présentation (lancement manuel).

---

## 4. Mode Édition

### 4.1 Scènes

- Un projet est découpé en **scènes**, organisées dans une **arborescence** :
  - les nœuds parents sont des **dossiers** (ils ne sont pas des scènes) ;
  - les feuilles sont des **scènes**.
- Une scène peut être marquée comme **première scène** du projet (une seule par projet).
- Actions disponibles dans l'arborescence :
  - en haut du panneau : **nouveau dossier**, **nouvelle scène** (créés dans le dossier sélectionné, sinon à la racine) ;
  - sur chaque ligne, un **menu contextuel**, ouvert par un bouton « ⋯ » visible au survol ou par un **clic droit** ;
  - sur un dossier : clic = plier / déplier ; menu : nouvelle scène, nouveau sous-dossier, renommer, supprimer (avec confirmation, le contenu est supprimé aussi) ;
  - sur une scène : clic = ouvrir dans l'éditeur ; menu : renommer, définir comme première scène, dupliquer, supprimer (avec confirmation) ;
  - **glisser-déposer** pour déplacer ou réordonner dossiers et scènes.
- La bibliothèque de sons utilise la même arborescence et les mêmes interactions (sans « première scène » ni « dupliquer »).
- Organisation de l'éditeur de scène :
  - **zone centrale** : uniquement les textes lus par le MJ — le texte de scène, puis les textes ajoutés par les actions (cf. §4.4 et §4.5) ;
  - **volet droit**, en trois parties **repliables** (ouvertes par défaut) : **Actions** (rangées par déclencheur, bouton « Nouvelle »), **Battlemaps** (miniatures, badge « Par défaut », bouton « Importer ») et **Enchaînement** (case « Première scène du projet », scènes suivantes et bouton « + Ajouter ») ;
  - si le contenu dépasse la hauteur de l'écran, le volet droit **défile** indépendamment de la zone centrale.
- Les **scènes suivantes** se choisissent dans une **fenêtre de sélection** : arborescence des scènes en lecture seule avec recherche, cases à cocher (sélection multiple), scènes déjà suivantes pré-cochées (les décocher les retire), scène actuelle grisée. La même fenêtre, en sélection unique, sert à choisir la cible de l'élément « Changer de scène ».
- Une scène possède :
  - un **nom** ;
  - un **texte de scène**, lu par le MJ pendant la présentation (cf. §4.4) ;
  - une ou plusieurs **battlemaps**, dont une **par défaut** ;
  - une liste d'**actions** ;
  - une ou plusieurs **scènes suivantes**.

### 4.2 Battlemaps

- V1 : une battlemap est une **image importée**.
- Import par le bouton **« Importer »** de la partie Battlemaps, ou par **glisser-déposer** d'images depuis le disque sur l'éditeur de scène (même calque plein écran que pour les sons) : les images sont ajoutées aux battlemaps de la scène ouverte.
- Plusieurs battlemaps par scène ; l'une d'elles est la battlemap par défaut.

### 4.3 Actions

Une action est composée de :

- un **nom** ;
- un **déclencheur** ;
- une **liste ordonnée d'éléments**, exécutés **les uns à la suite des autres**.

#### Déclencheurs

| Déclencheur | Description |
|---|---|
| Ouverture de la scène | L'action se lance automatiquement quand la scène s'ouvre. |
| Clic manuel | L'action apparaît dans la liste des actions disponibles ; le MJ la lance en cliquant. |

#### Éléments d'action

| Élément | Paramètres |
|---|---|
| Afficher une battlemap | Choix parmi les battlemaps de la scène (par miniature) |
| Lancer un son | Choix dans une bibliothèque de sons ; **volume** ; **lecture en boucle** (oui/non) ; **fondu en entrée** et **fondu en sortie** (durées en secondes) |
| Arrêter un son | Choix dans une bibliothèque de sons. Le son s'arrête avec le fondu de sortie défini à son lancement. |
| Arrêter tous les sons | — (chaque son s'arrête avec son propre fondu de sortie) |
| Ajouter un texte | Texte à saisir (ajouté au fil d'actualité) |
| Changer de scène | Choix de la scène cible (fenêtre de sélection, cf. §4.1). Les éléments placés après celui-ci ne sont pas exécutés (l'action est interrompue au changement de scène). |
| Attendre | Durée en secondes (temporise les éléments suivants) |
| Clic de l'utilisateur | Texte à saisir (obligatoire). Met l'action en pause jusqu'au clic du MJ (cf. §5.4) |
| *(Version future)* Faire apparaître une action | Choix de l'action |

Dans l'éditeur d'action, chaque élément est une carte **dépliable** (poignée de déplacement, icône du type, boutons Supprimer et Replier) ; dépliée, elle affiche le formulaire de ses paramètres.

### 4.4 Texte de scène

Le texte de scène n'est **pas un champ à part** : c'est un texte ajouté par une action, comme les autres.

- Dans l'éditeur de scène, le **premier champ de texte** de la zone centrale (sans libellé visible) est le texte de scène : il permet de l'écrire directement, sans passer par l'écran des actions.
- Ce champ est un **raccourci** : à la première saisie, il crée automatiquement une action :
  - nom : **« Texte de scène »** ;
  - déclencheur : **ouverture de la scène** ;
  - premier élément : **ajouter un texte**, avec le texte saisi.
- Modifier le champ modifie le texte de cet élément ; l'action se lance **en premier** parmi les actions d'ouverture de la scène.
- L'action « Texte de scène » est **visible** dans la liste des actions de la scène, mais **ne peut pas être supprimée**.
- On peut lui **ajouter d'autres éléments** (ex. lancer un son d'ambiance, afficher une battlemap).
- En mode Présentation, rien ne la distingue : son texte arrive dans le fil d'actualité comme n'importe quel texte d'action.

### 4.5 Textes ajoutés par les actions

- Dans l'éditeur de scène, **sous le texte de scène**, chaque texte qu'une action peut ajouter est affiché comme un **champ de texte modifiable**, avec la même présentation que le texte de scène.
- Au-dessus de chaque texte, une **pastille** indique le **nom de l'action** qui l'affiche. Pas de titre de section ni de libellé supplémentaire.

---

## 5. Mode Présentation

### 5.1 Lancement et persistance

- Premier lancement du projet → ouverture de la **première scène**.
- Si une **partie sauvegardée** existe, le MJ choisit à l'ouverture du mode Présentation :
  - **Continuer** → réouverture de la **dernière scène ouverte**, dans **l'état exact où elle avait été laissée** ;
  - **Recommencer** → l'état sauvegardé est effacé et la partie repart de la **première scène**. Un message d'avertissement indique que **tout ce qui a été fait dans la partie sera perdu**, et demande confirmation.
- Une seule partie sauvegardée par projet (plusieurs sauvegardes : version future).
- L'**état de chaque scène** est conservé, même après avoir quitté puis rouvert l'application :
  - actions déjà effectuées ;
  - battlemap affichée ;
  - sons en cours (on mémorise **quels** sons jouaient, s'ils étaient **en pause** et leur **volume**, mais pas leur position de lecture) ;
  - fil d'actualité.
- Revenir sur une scène déjà visitée restaure son état (les actions d'ouverture déjà effectuées ne sont pas relancées). Les sons qui étaient en cours **reprennent depuis le début**.
- Les textes ne sont **pas éditables** en mode Présentation.

### 5.2 Affichage

- Au lancement, le MJ choisit :
  - **un seul écran** : tout est affiché sur l'écran du MJ ;
  - **deux fenêtres** : une fenêtre **joueurs** (projecteur / TV) n'affiche que la battlemap ; l'écran du MJ garde le texte, les actions et les contrôles audio.

### 5.3 Changement et ouverture d'une scène

En quittant une scène :

1. Les **actions en cours** (ex. pendant un « Attendre » ou un « Clic de l'utilisateur » en attente) sont **interrompues**.
2. Les **sons en cours** sont coupés **en fondu**.
3. Le fil d'actualité de la scène quittée est retiré de l'écran (il reste mémorisé avec l'état de la scène).

En ouvrant une scène **pour la première fois** :

1. La battlemap par défaut est affichée.
2. Les actions avec le déclencheur « Ouverture de la scène » se lancent, en commençant par l'action « Texte de scène » si elle existe : son texte devient le premier élément du fil d'actualité.

En ouvrant une scène **déjà visitée** : son état mémorisé est restauré (cf. §5.1).

### 5.4 Fil d'actualité

L'écran du MJ présente le déroulement de la scène sous forme de **fil d'actualité**. Chaque scène a **son propre fil**.

- Chaque **texte ajouté** par une action (y compris le texte de scène, cf. §4.4) est inséré **en dessous** des éléments déjà affichés.
- Chaque **changement de battlemap** (par une action ou via le sélecteur) ajoute la battlemap au fil, sous forme de miniature.
- Un élément **« Clic de l'utilisateur »** ajoute au fil un bloc qui :
  - affiche le **texte défini** dans l'élément ;
  - affiche en bas à droite du bloc un bouton **« Cliquer pour continuer »** ;
  - **suspend l'action** : les éléments suivants ne s'exécutent qu'après ce clic ;
  - une fois cliqué, reste dans le fil, marqué comme validé (le bouton n'est plus actif).
- Les lancements / arrêts de sons et les noms des actions déclenchées **ne sont pas** tracés dans le fil.
- À chaque nouvel élément, un **défilement automatique** amène ce nouvel élément **en haut de l'écran**.
- Le MJ peut remonter dans le fil pour relire les éléments précédents.
- Un **clic sur une battlemap** du fil l'ouvre **en grand dans une modale**.

### 5.5 Projet modifié pendant une partie

Si le projet est modifié en mode Édition alors qu'une partie est sauvegardée, l'état mémorisé s'adapte ainsi :

| Élément supprimé | Comportement en Présentation |
|---|---|
| Action | N'est plus visible (ni dans la liste des actions, ni dans « Voir toutes les actions ») |
| Battlemap | Un **message d'erreur** est affiché à la place de l'image (dans le fil et à l'affichage) |
| Son | Le son **n'est pas lancé** et un **message d'erreur** est affiché |

### 5.6 Interface pendant la scène

- **Fil d'actualité** (cf. §5.4) : textes ajoutés par les actions et battlemaps affichées.
- **Liste des actions** manuelles de la scène (visible directement, ou via un bouton qui la déploie) :
  - une action **déjà effectuée est masquée** ;
  - un bouton **« Voir toutes les actions »** affiche aussi les actions déjà effectuées et les actions masquées ;
  - une action déjà effectuée peut être **relancée** depuis cette liste. Si elle ajoute un texte déjà présent dans le fil, ce texte n'est pas dupliqué : le fil **défile jusqu'à lui**.
- **Bouton « Scène suivante »**, flottant **en bas à droite** de la zone du fil d'actualité (pas de pied de page) — c'est le moyen de navigation **principal** :
  - une seule scène suivante → le bouton l'ouvre directement (son nom peut être affiché dans le bouton) ;
  - plusieurs scènes suivantes → un clic ouvre une **liste**, comme un menu déroulant, dans laquelle le MJ choisit la scène à ouvrir.
- **Bouton de navigation libre** (usage occasionnel, plus discret) : ouvre l'arborescence des scènes pour aller vers n'importe quelle scène.
- **Sélecteur de battlemap** : choisir la battlemap affichée parmi celles de la scène.
- **Contrôle des sons** :
  - voir les sons en cours ;
  - **mettre en pause / reprendre** un son en particulier (le MJ ne peut pas arrêter un son à la main : l'arrêt se fait par les actions ou au changement de scène) ;
  - un **clic sur la carte d'un son** l'agrandit et affiche un **curseur de volume** ;
  - un bouton global **lecture / pause** : il affiche **Pause** tant qu'au moins un son est en cours de lecture (un clic met tous les sons en pause), et **Lecture** quand tous les sons sont en pause (un clic les fait tous reprendre) ;
  - lancer n'importe quel son des bibliothèques.
- **Organisation du panneau de contrôle (PC)** : trois parties **repliables** — **Battlemap**, **Actions**, **Sons** :
  - chaque en-tête affiche un **résumé** utile quand la partie est repliée (ex. « Rez-de-chaussée », « 2 disponibles », « 2 en cours ») ;
  - le bouton global lecture / pause reste dans l'en-tête de Sons, donc accessible même replié ;
  - l'état plié / déplié est mémorisé comme **préférence d'affichage** du MJ (pas dans la sauvegarde de partie) ;
  - le panneau défile si son contenu dépasse la hauteur de l'écran.
- **Sur tablette**, le panneau de contrôle utilise des **onglets** (Actions, Cartes, Sons) plutôt que des parties repliables, avec de grandes zones tactiles.

---

## 6. Feuille de route

### V1

- Gestion multi-projets
- Bibliothèques de sons (globale + projet) avec upload et arborescence
- Scènes en arborescence, première scène, scènes suivantes
- Battlemaps (images importées)
- Actions : déclencheurs « ouverture de scène » et « clic manuel » ; tous les éléments listés au §4.3 sauf « faire apparaître une action »
- Mode Présentation complet, avec persistance de l'état
- Stockage dans le navigateur (IndexedDB)

### Versions futures

- Export `.zip` HTML autonome (lisible hors ligne)
- Sauvegarde / restauration de projet (`.zip` données + médias) — **conception à faire** au préalable
- Plusieurs parties sauvegardées par projet (ex. une par groupe de joueurs)
- Élément d'action « Faire apparaître une action »
- Stockage via une API (à définir)
- Battlemaps plus riches que de simples images (à définir)

---

## 7. Questions ouvertes

1. **Présentation sur tablette en V1** : souhaitée, mais les projets sont enregistrés dans le navigateur du PC où ils ont été créés ; une tablette n'y a pas accès. Il faut choisir comment transférer un projet en V1 : avancer un export / import de projet, avancer l'export `.zip` lisible hors ligne, ou laisser la tablette hors V1.

---

## 8. Architecture technique

### 8.1 Stack

- **Angular — dernière version disponible** (v22 à date, novembre 2026).
- Utiliser les approches les plus récentes proposées par le framework :
  - composants **standalone** (pas de `NgModule`) ;
  - **signals** pour l'état (`signal`, `computed`, `effect`, `input()`, `output()`, `model()`) ;
  - application **zoneless** ;
  - nouveau **control flow** dans les templates (`@if`, `@for`, `@switch`, `@defer`) ;
  - **Signal Forms** pour les formulaires d'édition ;
  - `inject()` plutôt que l'injection par constructeur.
- Composants UI : **Angular Material / CDK** (dernière version), notamment CDK Drag & Drop pour réordonner les éléments d'action et l'arborescence.

- Styles en **SCSS**, entièrement basés sur des variables : chaque thème est un fichier unique de jetons, converti en variables CSS et appliqué par l'attribut `data-theme` (cf. TRD §10).

### 8.2 Persistance des données

- **V1** : données enregistrées dans une base de données **du navigateur** (**IndexedDB**), y compris les fichiers images et audio (stockés en `Blob`, cf. §8.3).
- **Version future** : enregistrement via une **API** (à définir).
- Pour préparer cette migration, **toutes les lectures et écritures passent par une couche d'accès dédiée** :
  - une **interface** (contrat) décrivant les opérations : projets, scènes, actions, battlemaps, sons, état de présentation ;
  - une **implémentation IndexedDB** pour la V1 ;
  - une future **implémentation API**, qui remplacera la première **sans modifier le reste de l'application** ;
  - le choix de l'implémentation se fait à un seul endroit (fournisseur Angular via un `InjectionToken`).
- Aucun composant n'accède directement à IndexedDB.
- Les méthodes de cette couche sont **asynchrones** (Promise / Observable), même en V1, pour que le passage à une API ne change pas les appels.

### 8.3 Stockage des fichiers médias (images, sons)

#### Choix retenu : copie des fichiers en `Blob` dans IndexedDB

Les fichiers importés sont **copiés** dans IndexedDB sous forme de `Blob`. Le chemin du fichier d'origine n'est **pas** utilisé, car :

- un navigateur n'expose jamais le chemin réel d'un fichier et ne peut pas le relire plus tard à partir d'un chemin ;
- l'alternative (*File System Access API*, poignées de fichiers) n'est disponible que sur Chrome / Edge, redemande souvent l'autorisation d'accès, et casse si le fichier est déplacé ou renommé ;
- la copie rend le projet **autonome**, ce qui est cohérent avec l'export `.zip` et la future API (qui recevra de toute façon une copie des fichiers).

Inconvénient accepté : les fichiers sont dupliqués sur le disque.

#### Points d'attention

1. **Séparer les médias des données** : les `Blob` sont rangés dans un espace de stockage dédié (table « médias » indexée par identifiant). Les scènes, battlemaps et sons ne contiennent que l'**identifiant** du média. Ainsi, lister les projets ou ouvrir une scène ne charge pas tous les fichiers.
2. **Pas de base64** : les fichiers restent en `Blob` natif (le base64 pèse environ 33 % de plus et doit être décodé à chaque lecture).
3. **Place disponible et effacement** :
   - appeler `navigator.storage.persist()` pour demander un stockage persistant (le navigateur n'efface alors plus les données de lui-même) ;
   - afficher la place utilisée avec `navigator.storage.estimate()` ;
   - attention à Safari, qui peut effacer les données d'un site non visité pendant 7 jours.
4. **Risque de perte** : si l'utilisateur vide les données du navigateur, tout est perdu. Une fonction de **sauvegarde / restauration de projet** (fichier `.zip` contenant données et médias) est prévue dans une **version future**, après une phase de conception dédiée ; elle partagera une partie du travail de l'export.
5. **Libérer la mémoire** : les médias sont affichés via `URL.createObjectURL(blob)` ; appeler `URL.revokeObjectURL()` quand l'image ou le son n'est plus utilisé.
6. **Lecture des sons** : utiliser une balise `<audio>` reliée à l'API Web Audio (nœud de volume) pour gérer volume et fondus, plutôt que de décoder entièrement le fichier (`decodeAudioData`), trop gourmand en mémoire pour les longues ambiances.
7. **Préparer la migration vers l'API** : la couche d'accès aux données ne renvoie pas un `Blob` aux composants, mais une **URL du média**. En V1 c'est une URL locale (`blob:`), avec l'API ce sera une adresse web : les composants n'ont rien à changer.

### 8.4 Composant générique d'arborescence

- Un **composant d'arborescence unique et générique**, utilisé pour :
  - l'arborescence des **scènes** ;
  - l'arborescence de la **bibliothèque de sons** (globale et projet) ;
  - la navigation libre entre scènes en mode Présentation ;
  - les **fenêtres de sélection** (scènes suivantes, cible de « Changer de scène », choix d'un son), en lecture seule avec sélection unique ou multiple.
- Fonctionnalités communes : dossiers et éléments, créer / renommer / supprimer, déplacer par glisser-déposer, plier / déplier, sélection.
- Le composant ne connaît pas le type des éléments : leur affichage et leurs actions spécifiques sont fournis par le composant parent (template personnalisable).
