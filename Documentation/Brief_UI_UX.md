# JDR Manager — Brief UI / UX

| | |
|---|---|
| **Produit** | JDR Manager |
| **Auteur** | Allan Renou |
| **Version du document** | 1.0 — 6 novembre 2026 |
| **Statut** | Brouillon |
| **Documents liés** | [`PRD.md`](./PRD.md) · [`TRD.md`](./TRD.md) · [`specifications.md`](./specifications.md) · [Maquettes](https://claude.ai/artifact/6okmitt29oTdimnuJDEaqk) |

Ce document est la **référence unique** pour l'apparence de l'application : couleurs, typographie, espacements, composants et mise en page. Toute nouvelle page doit s'y conformer. Les valeurs sont celles des maquettes ; en cas d'écart, **ce document fait foi** et les maquettes sont à corriger.

---

## 1. Principes

1. **Chaleureux.** L'outil sert autour d'une table, souvent en lumière tamisée. Le thème par défaut est sombre (texte clair légèrement chaud, un seul accent doré) ; un thème clair aux couleurs automnales est aussi proposé (§11).
2. **Le récit d'abord.** En Présentation, le texte lu par le MJ est l'élément le plus lisible de l'écran. Les contrôles sont présents mais secondaires.
3. **Un geste = un clic.** Les actions fréquentes en partie (continuer, scène suivante, pause des sons) sont accessibles en un clic, avec de grandes cibles.
4. **Contenu au centre, configuration à droite.** En Édition comme en Présentation : zone centrale pour le contenu, volet droit pour les réglages et contrôles.
5. **Sobriété.** Pas de dégradés décoratifs, pas d'emoji, pas d'animations superflues. Les ombres sont réservées aux éléments flottants.

---

## 2. Couleurs

Les couleurs sont définies par des **jetons** : un nom (variable CSS) et un rôle. Ce chapitre décrit **le rôle** de chaque jeton et ses règles d'usage, communs à tous les thèmes. **Les valeurs** de chaque thème sont uniquement au §11.3. Aucune couleur n'est écrite en dur dans un composant (cf. §10).

### 2.1 Fonds et surfaces

| Jeton | Usage |
|---|---|
| `--bg-app` | Fond de page, champs de saisie posés sur une carte |
| `--bg-backdrop` | Fond derrière une fenêtre modale |
| `--bg-panel` | En-têtes, volets latéraux, arborescences |
| `--bg-card` | Cartes, textes du fil, champs de texte |
| `--bg-raised` | Carte sélectionnée ou dépliée, éléments d'action |
| `--bg-control` | Boutons secondaires pleins, pastilles, menus |
| `--bg-control-hover` | Survol d'une option de menu / liste |
| `--overlay-drop` | Calque de glisser-déposer de fichiers (translucide) |

### 2.2 Bordures

| Jeton | Usage |
|---|---|
| `--border-subtle` | Séparateurs, bordure des cartes |
| `--border-default` | Champs, boutons secondaires, menus |
| `--border-strong` | Boutons « contour », zones en pointillés |

### 2.3 Texte

| Jeton | Usage |
|---|---|
| `--text-primary` | Texte principal |
| `--text-secondary` | Libellés, métadonnées, icônes neutres |
| `--text-tertiary` | Aides, sous-titres de section, compteurs |
| `--text-on-accent` | Texte et icônes posés sur `--accent` |
| `--text-on-danger` | Texte posé sur `--danger-strong` |

### 2.4 Accent

| Jeton | Usage |
|---|---|
| `--accent` | Bouton principal, sélection, focus, liens, bordure de l'élément en cours d'édition |
| `--accent-hover` | Survol d'un lien ou d'un bouton principal |
| `--accent-text` | Texte d'un élément sélectionné |
| `--accent-tint` | Fond d'une ligne sélectionnée (arborescence, liste) |
| `--accent-tint-strong` | Pastilles d'accent, cercles d'icônes |
| `--accent-surface` | Bloc « Clic de l'utilisateur » |

### 2.5 États

| Jetons | Usage |
|---|---|
| `--active-text`, `--active-bg`, `--active-border` | Actif / en cours : action en cours, son qui joue, fenêtre joueurs ouverte |
| `--danger-text`, `--danger-bg`, `--danger-border` | Danger : suppression, avertissements, messages d'erreur |
| `--danger-strong` | Fond du bouton de confirmation destructive (« Effacer et recommencer ») |

### 2.6 Types d'éléments d'action

Chaque type a une couleur d'icône (`-fg`) et une couleur de fond (`-bg`), utilisées pour l'icône de l'élément (carré arrondi) et pour les pastilles d'actions.

| Type | Jetons |
|---|---|
| Afficher une battlemap | `--el-battlemap-fg`, `--el-battlemap-bg` |
| Lancer / arrêter un son | `--el-sound-fg`, `--el-sound-bg` |
| Arrêter tous les sons | `--el-stop-all-fg`, `--el-stop-all-bg` |
| Ajouter un texte | `--el-text-fg`, `--el-text-bg` |
| Attendre | `--el-wait-fg`, `--el-wait-bg` |
| Clic de l'utilisateur | `--el-click-fg`, `--el-click-bg` |
| Changer de scène | `--el-scene-fg`, `--el-scene-bg` |

### 2.7 Dossiers et visuels de remplacement

| Jeton | Usage |
|---|---|
| `--folder-project` | Icône de dossier d'un projet (scènes, sons du projet) |
| `--folder-global` | Icône de dossier de la bibliothèque globale |
| `--placeholder-bg`, `--placeholder-grid` | Visuel de remplacement principal (battlemap par défaut, vignette de projet) — cf. §6.15 |
| `--placeholder-alt-bg`, `--placeholder-alt-grid` | Second visuel de remplacement, pour distinguer deux miniatures voisines |
| `--player-bg`, `--player-text` | Fenêtre joueurs : fond **noir** dans tous les thèmes (§2.8) et message d'attente discret |

### 2.8 Règles (tous thèmes)

- Contraste minimal **4,5:1** pour tout texte (3:1 pour le texte ≥ 24 px et pour les icônes porteuses de sens). Chaque thème doit le vérifier (§11.4).
- Une information n'est jamais portée par la couleur seule : toujours une icône ou un libellé en plus.
- L'accent est réservé à **une** action principale par zone d'écran.
- La fenêtre joueurs garde un **fond noir** quel que soit le thème, pour ne pas éblouir les joueurs ni dénaturer la battlemap.

---

## 3. Typographie

Trois familles, chargées depuis Google Fonts (à auto-héberger pour l'export hors ligne).

| Famille | Rôle | Graisses |
|---|---|---|
| **Cinzel** (serif à capitales) | Titres de page, de scène, de section de volet, nom de l'application | 600, 700 |
| **Inter** (sans-serif) | Toute l'interface : boutons, libellés, listes, formulaires | 400, 500, 600 |
| **Lora** (serif de lecture) | Textes narratifs du fil d'actualité en Présentation | 400, 500 |

### Échelle

| Style | Famille | Taille / interligne | Graisse | Usage |
|---|---|---|---|---|
| Titre de page | Cinzel | 34 px | 700 | « Mes projets » |
| Titre d'écran | Cinzel | 28 px | 700 | Nom de la scène en Édition |
| Titre de fenêtre | Cinzel | 20–26 px | 700 | Modales, lancement de partie |
| Titre de volet | Cinzel | 17–18 px | 700 | Actions, Battlemaps, Enchaînement, scène en Présentation |
| Logo | Cinzel | 20–22 px | 700, espacement 0,04em | « JDR Manager » |
| Texte narratif | Lora | 20 px / 1,6 (PC), 18 px / 1,6 (tablette) | 400 | Fil d'actualité |
| Texte de saisie | Inter | 15 px / 1,55 | 400 | Champs de texte de scène |
| Corps | Inter | 14 px | 400–600 | Listes, boutons, contenu courant |
| Libellé | Inter | 12–13 px | 500–600 | Libellés de champs, métadonnées |
| Surtitre | Inter | 11–12 px, MAJUSCULES, espacement 0,08em | 600 | « À l'ouverture de la scène », « Sons en cours » |

### Règles

- Casse de phrase partout (« Nouvelle scène », pas « Nouvelle Scène »). Seuls les surtitres sont en majuscules.
- Les aides et précisions sont en *italique*, couleur `--text-tertiary`.
- Pas de texte d'interface en dur : tout passe par les fichiers de traduction (TRD TEC-70).

---

## 4. Espacements, rayons, ombres

### Espacements

Grille de base **4 px**. Valeurs utilisées : 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64.

| Contexte | Valeur |
|---|---|
| Écart entre éléments d'une liste | 6–10 px |
| Écart entre sections d'un écran | 20–28 px |
| Marge intérieure d'une carte | 14–24 px |
| Marge intérieure d'une zone centrale | 28–32 px (Édition), 56 px latéral (fil de Présentation) |

### Rayons

| Jeton | Valeur | Usage |
|---|---|---|
| `--radius-sm` | 8 px | Petits boutons icône, options de menu, miniatures |
| `--radius-md` | 10 px | Boutons, champs de saisie |
| `--radius-lg` | 12 px | Cartes de liste, éléments d'action, cartes de son |
| `--radius-xl` | 14 px | Cartes de projet, blocs du fil, bouton flottant |
| `--radius-2xl` | 16–18 px | Fenêtres modales |
| `--radius-pill` | 999 px | Pastilles, puces de scène, filtres |

### Ombres

Seuls les éléments **flottants** ont une ombre :

| Jeton | Valeur | Usage |
|---|---|---|
| `--shadow-float` | Valeur par thème (§11.3) | Bouton « Scène suivante », « Revenir au dernier élément » |
| `--shadow-popover` | Valeur par thème (§11.3) | Listes déroulantes, menus contextuels |

---

## 5. Icônes

- Style **trait** (contour), grille 24 × 24, épaisseur 1,75 (2 pour les flèches et le « + »), extrémités arrondies, couleur `currentColor`.
- Bibliothèque recommandée : **Lucide** (`@lucide/angular`, paquet officiel compatible Angular 22 ; `lucide-angular` ne supporte pas au-delà d'Angular 21), dont le style correspond aux maquettes.
- Tailles : 14 px (dans un texte ou une pastille), 16 px (standard), 18–20 px (en-têtes, boutons importants), 40 px (calque de dépôt).
- Icônes pleines uniquement pour la lecture (▶), la pause (⏸) et l'arrêt (■).
- Pas d'emoji. Un bouton qui n'a qu'une icône a toujours un `aria-label` (et un `title` si l'icône n'est pas évidente).

---

## 6. Composants

### 6.1 Boutons

| Variante | Apparence | Usage |
|---|---|---|
| **Principal** | Fond `--accent`, texte `--text-on-accent`, 600 | Une action principale par zone : Présenter, Enregistrer, Valider, Continuer la partie |
| **Secondaire** | Contour 1 px `--border-strong`, fond transparent | Éditer, Annuler, Recommencer |
| **Secondaire plein** | Fond `--bg-control` | Nouvelle action, Importer (dans un volet) |
| **Discret** | Texte `--accent`, sans fond | « Voir toutes les actions », « Changer » |
| **Ajout** | Contour pointillé `--border-strong` ou `--accent`, texte doré | « + Ajouter », « Lancer un son », « Ajouter un élément » |
| **Danger** | Texte `--danger`, sans fond | « Supprimer l'action » |
| **Danger fort** | Fond `--danger-strong`, texte `--text-on-danger` | Confirmation d'une action irréversible |
| **Icône** | Carré 36 px (40 px en en-tête), rayon 8, fond `--bg-control` ou transparent | Pause, supprimer, replier, fermer |

Hauteurs : **44 px** (standard), 40 px (en-tête), 34–36 px (dans un volet), 46–54 px (actions de Présentation), **≥ 48 px** sur tablette (60 px pour « Scène suivante »).

### 6.2 Champs de formulaire

- Hauteur 40–44 px, rayon 10, bordure `--border-default`, fond `--bg-app` (dans une carte) ou `--bg-card` (sur la page).
- Zone de texte : marge intérieure 14 × 16, Inter 15 px / 1,55, pas de redimensionnement manuel.
- Libellé au-dessus, Inter 12–13 px, `--text-secondary`. Exception : le texte de scène, sans libellé visible (libellé d'accessibilité uniquement).
- Cases à cocher, boutons radio, curseurs : couleur d'accent `--accent`.
- Sélecteur de son ou de scène : bouton qui affiche le chemin (« Ce projet › Ambiances › Taverne animée ») et « Changer » à droite ; il ouvre une fenêtre de sélection.
- Champ obligatoire : mention « (obligatoire) » en `--accent-hover`.
- Zone de texte Markdown (textes de scène et d'action) : barre d'outils entre le libellé et le champ, boutons icône 32 px (gras, italique, titre, liste à puces, liste numérotée, citation), libellé et raccourci en infobulle. Hors focus, le champ montre le texte mis en page (`.app-markdown`) ; au focus, le texte source : marqueurs en `--text-tertiary`, texte gras / italique, titres en `--accent-text`, citation en `--text-secondary` italique, même taille et même police que le champ.

### 6.3 Contrôle segmenté et onglets

- Contrôle segmenté (ex. déclencheur d'une action) : conteneur `--bg-app` avec bordure, option active en fond doré.
- Onglets (tablette) : conteneur `--bg-app`, onglet actif en fond `--bg-control`, hauteur 48 px.

### 6.4 Cartes

- **Carte de projet** : fond `--bg-card`, bordure `--border-subtle`, rayon 14, vignette de 150 px en haut, actions en bas (Éditer / Présenter).
- **Carte de liste** (action, son) : rayon 10–12, marge 10–14 px ; la carte sélectionnée ou en cours d'édition prend une bordure `--accent`.
- **Carte « Créer »** : contour pointillé 2 px, contenu centré, toujours en dernière position de la grille.

### 6.5 Pastilles

- Rayon 999, Inter 12 px 600, marge 3 × 10 px.
- Pastille d'action : couleurs de §2.6 selon le type d'action ou un code couleur par action.
- Pastille de scène suivante : fond `--bg-control`, avec bouton « × » pour retirer.
- Badge « Par défaut » sur une miniature : fond doré, texte foncé, 11 px 700.

### 6.6 Sections repliables

- En-tête de 44–48 px : chevron (bas = ouvert, droite = fermé), titre, **résumé** en `--text-primary` (« · 2 en cours »), action éventuelle à droite.
- Séparateur `--border-subtle` entre les sections.
- Ouvertes par défaut sur les maquettes ; l'état est mémorisé comme préférence d'affichage.

### 6.7 Arborescence

- Ligne de 36–38 px, Inter 14 px ; dossier en 600 avec chevron et icône dossier ; élément indenté de 30 px par niveau.
- Ligne sélectionnée : fond `--accent-tint`, texte `--accent-text`, filet doré de 2 px à gauche.
- Bouton « ⋯ » visible au survol ou au focus ; même menu au clic droit.
- En mode sélection : case à cocher (multiple) ou bouton radio (unique) à gauche du nom ; élément désactivé grisé avec mention en italique.

### 6.8 Menus et listes déroulantes

- Fond `--bg-control`, bordure `--border-default`, rayon 12, marge 6–8 px, ombre `--shadow-popover`.
- Options de 38–48 px, rayon 8 ; option survolée ou sélectionnée en `--bg-control-hover`.

### 6.9 Fenêtres modales

- Fond derrière : `--bg-backdrop` à 90 % d'opacité (décision d'Allan, retours de test).
- Fenêtre : fond `--bg-card`, bordure `--border-subtle`, rayon 16–18.
- Largeurs : 560 px (sélection, confirmation), 620 px (lancement), 900 px (édition d'une action).
- En-tête : titre Cinzel + sous-titre de contexte + bouton fermer ; pied : action destructive à gauche, Annuler + action principale à droite.
- Confirmation destructive : bordure `--danger-border`, icône d'alerte dans un cercle `--danger-bg`, bouton « Danger fort ».

### 6.10 Fil d'actualité (Présentation)

- Colonne centrée, largeur maximale **760 px**.
- **Texte** : carte `--bg-card`, rayon 14, marge 22 × 24, Lora 20 px. Markdown interprété (classe `.app-markdown`) : titres en Cinzel `--accent-text`, citation avec filet gauche `--accent` 3 px en `--text-secondary` italique, liens `--accent-text`.
- **Battlemap** : miniature cliquable (curseur loupe) qui ouvre la battlemap en grand dans une modale.
- **Clic de l'utilisateur** : fond `--accent-surface`, bordure dorée 2 px ; icône dans un cercle doré, texte Inter 19 px 500, bouton principal « Cliquer pour continuer » **en bas à droite** du bloc. Une fois validé : style neutre, coche turquoise, mention « Validé ».
- Éléments précédents estompés en haut (opacité 65 %, pleine opacité au survol ou au focus) et pastille « N éléments précédents ».
- Bouton flottant « Revenir au dernier élément » quand le MJ a remonté le fil.

### 6.11 Bouton « Scène suivante »

- Bouton principal **flottant en bas à droite** de la zone du fil, 54 px de haut, rayon 14, ombre `--shadow-float`.
- Une seule scène suivante : le bouton affiche **le nom de cette scène** (tronqué s'il est long) et une flèche ; l'ouvre directement.
- Plusieurs scènes suivantes : un chevron, et la liste s'ouvre au-dessus du bouton (style §6.8).

### 6.12 Sons en cours

- Carte de son repliée : 48 px, icône haut-parleur turquoise, nom, « boucle » si applicable, bouton **Pause / Lecture** à droite.
- Carte dépliée (clic sur la carte) : fond `--bg-raised`, bordure `--border-default`, curseur de volume et valeur en %.
- Bouton global lecture / pause dans l'en-tête de la section : une seule icône selon l'état.

### 6.13 Glisser-déposer de fichiers

- Calque plein écran `--overlay-drop`, marge 20 px, cadre en pointillés dorés 3 px, rayon 20, fond doré à 6 %.
- Au centre : grande icône d'import dans un cercle, titre Cinzel 30 px, nombre de fichiers et destination, formats acceptés.

### 6.14 Messages et erreurs

- Message d'erreur (média manquant, format refusé, quota dépassé) : bloc ou notification aux couleurs **Danger** (§2.5), icône d'alerte, texte court qui dit quoi faire.
- Une erreur n'interrompt jamais la partie (PRD NF-25).
- Informations neutres et aides : texte `--text-tertiary` en italique.

### 6.15 Visuels de remplacement

Tant qu'aucune image n'est importée, une battlemap ou une vignette de projet est représentée par un fond uni avec une **grille** fine (lignes à 14–16 % d'opacité, pas de 12–22 px).

---

## 7. Mise en page des écrans

### 7.1 Structure commune (PC)

| Zone | Dimensions | Contenu |
|---|---|---|
| En-tête | 64 px (Édition, accueil), 60 px (Présentation), fond `--bg-panel` | Logo ou retour, fil d'Ariane, icône de mode, navigation, action principale |
| Volet gauche | 290 px, fond `--bg-panel` | Arborescence (scènes, sons) |
| Zone centrale | Flexible | Contenu (textes, fil, tableau) |
| Volet droit | 380 px (Édition), 420 px (Présentation), fond `--bg-panel` | Sections repliables, défilement indépendant |

- Largeur cible : **1280 px et plus** (maquettes en 1440 × 900).
- Grilles de cartes : `repeat(auto-fill, minmax(320px, 1fr))`, alignées à gauche (TRD TEC-93).

### 7.2 Écrans

| Écran | Organisation |
|---|---|
| **Accueil** | En-tête + titre « Mes projets » + grille de cartes, carte « Créer un projet » en dernier |
| **Édition — scène** | Arborescence à gauche ; textes au centre (texte de scène puis textes d'action, chacun sous le nom de l'action en sous-titre) ; volet droit Actions / Battlemaps / Enchaînement |
| **Édition — action** | Modale 900 px : nom, déclencheur (contrôle segmenté), éléments dépliables réordonnables, « Ajouter un élément » |
| **Bibliothèque de sons** | Arborescence « Ce projet » + « Bibliothèque globale » à gauche (dossiers et sons ; choisir un son ouvre son dossier et le met en évidence) ; tableau des sons avec pré-écoute ; bouton « Importer des sons » ; calque de dépôt au glisser |
| **Présentation — lancement** | Modale : dernière scène, choix d'affichage (cartes radio), Recommencer (appui long de 3 s, fond qui se remplit de gauche à droite en `--danger-border`, message sous le bouton si clic simple) / Continuer |
| **Présentation — MJ (PC)** | En-tête avec scène et « Aller à une scène » ; fil au centre avec bouton flottant « Scène suivante » ; volet droit Battlemap / Actions / Sons |
| **Présentation — MJ (tablette)** | Fil à gauche, volet à onglets à droite, « Scène suivante » en bas, cibles ≥ 48 px |
| **Fenêtre joueurs** | Fond noir, battlemap seule en plein écran, aucun contrôle |

### 7.3 Tablette

- Cible : 1180 × 820 (paysage).
- Toutes les zones tactiles ≥ **48 px** ; boutons d'action 56–64 px.
- Onglets au lieu de sections repliables ; pas de survol (le bouton « ⋯ » est toujours visible).

---

## 8. Interactions, états et accessibilité

| État | Règle |
|---|---|
| Survol | Bouton principal → `--accent-hover` ; option de liste → `--bg-control-hover` ; lien → `--accent-hover` |
| Focus clavier | Contour 2 px `--accent`, décalé de 2 px, toujours visible au clavier |
| Sélectionné | Fond `--accent-tint`, texte `--accent-text`, filet ou bordure dorée |
| Désactivé | Texte `--text-tertiary`, aucune interaction, mention de la raison si utile |
| En cours | Couleurs « Actif » (§2.5), point ou icône de cette couleur |

- **Animations** : transitions courtes (150–200 ms, `ease-out`) pour les survols, l'ouverture des sections et des menus. Défilement automatique du fil en douceur. En Présentation, chaque élément du fil apparaît en fondu de 1 s (jeton `duration(appear)`). Respecter `prefers-reduced-motion`.
- **Accessibilité** : vrais `<button>` / `<a>` / `<input>` avec libellés ; `aria-label` sur les boutons icône ; `aria-expanded` sur les sections et menus ; contrastes de §2.8 ; navigation complète au clavier.

---

## 9. Ton et rédaction

- Interface en **français**, casse de phrase.
- Boutons à l'**infinitif** ou au nom court : « Importer des sons », « Cliquer pour continuer », « Nouvelle scène ».
- Messages courts et concrets : dire ce qui se passe et quoi faire. Ex. : « Tout ce qui a été fait dans cette partie sera perdu. »
- Le contenu saisi par le MJ (noms, textes) n'est jamais modifié ni traduit.

---

## 10. Mise en œuvre (Angular)

- Styles écrits en **SCSS**. Détail technique : TRD §10.
- Chaque thème est **un seul fichier** (`src/styles/themes/_nuit-doree.scss`, `_automne.scss`…) qui contient une map SCSS donnant une valeur à chaque jeton de §2 (couleurs), aux ombres et aux polices — soit une colonne des tableaux de §11.3. Changer ou ajouter un thème = modifier ou ajouter ce fichier.
- Ces maps sont converties en **variables CSS** (`--bg-app`, `--accent`…), appliquées selon l'attribut `data-theme` de `<html>` ; le changement de thème se fait donc à la volée, sans rechargement.
- Les jetons communs à tous les thèmes (espacements, rayons, ombres, tailles de texte) sont dans `src/styles/_tokens.scss`.
- Les composants n'utilisent **que** ces variables (via des fonctions SCSS d'accès), jamais de valeur en dur : couleur, taille de police, rayon, espacement, ombre.
- Le thème **Angular Material** est personnalisé à partir de ces jetons ; aucun composant ne définit ses propres couleurs.
- Les composants récurrents (boutons, pastilles, section repliable, carte de son, bloc du fil, modale) sont des composants partagés dans `shared/ui`.
- Toute nouvelle valeur (couleur, taille) est d'abord ajoutée à ce document et aux jetons, puis utilisée.
- Les polices sont auto-hébergées dans le build (nécessaire pour l'export hors ligne, PRD PRJ-04).

---

## 11. Thèmes

### 11.1 Principe

- Le MJ choisit le thème de l'application dans **Paramètres › Apparence**, accessible depuis l'en-tête de l'accueil (icône réglages). Chaque thème est présenté par une **carte d'aperçu** (fond, carte, bouton principal, texte).
- Le changement est **immédiat**, sans rechargement, et s'applique à tous les écrans, y compris la fenêtre joueurs.
- Le choix est une **préférence d'affichage** du MJ (mémorisée dans le navigateur), commune à tous les projets.
- Tous les thèmes définissent **les mêmes jetons** (§2) et respectent les mêmes règles de contraste (§2.8).
- Seules les couleurs, les ombres (et éventuellement les polices) changent d'un thème à l'autre ; la mise en page, les espacements, les rayons et les composants restent identiques.

### 11.2 Thèmes disponibles en V1

| Thème | Ambiance | Statut |
|---|---|---|
| **Nuit dorée** | Sombre, accent or, ambiance de crypte et de taverne aux chandelles | Par défaut |
| **Automne** | **Clair** et chaleureux : fond parchemin, bruns, accent rouille, touches de sauge, d'ocre et d'ardoise | Second thème |

### 11.3 Valeurs des jetons par thème

C'est le **seul endroit** du document où figurent les valeurs des couleurs. Chaque colonne correspond à un fichier de thème (`src/styles/themes/_<thème>.scss`, TRD §10) ; tous les jetons sont obligatoires.

- **Nuit dorée** : fonds bleu-nuit très sombres, texte ivoire, accent **or**, état actif turquoise. Référence : toutes les maquettes sauf la suivante.
- **Automne** (clair) : fonds parchemin et crème, texte brun foncé, accent **rouille** (assez foncé pour rester lisible, texte blanc sur les boutons), état actif vert mousse. Référence : maquette « 2 · Édition — scène (PC) · thème Automne ».

**Fonds et surfaces**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--bg-app` | `#15161B` | `#F6EEE3` |
| `--bg-backdrop` | `#0D0E11` | `#CBB89E` |
| `--bg-panel` | `#1A1B21` | `#EFE3D2` |
| `--bg-card` | `#1E2028` | `#FFFAF2` |
| `--bg-raised` | `#24252D` | `#FBF1E4` |
| `--bg-control` | `#272A34` | `#E8D8C3` |
| `--bg-control-hover` | `#33363F` | `#DFCBB2` |
| `--overlay-drop` | `rgba(13,14,17,.86)` | `rgba(246,238,227,.92)` |

**Bordures**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--border-subtle` | `#343844` | `#E0CFB8` |
| `--border-default` | `#3E4350` | `#CDB79C` |
| `--border-strong` | `#4A4F5D` | `#B49A7C` |

**Texte**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--text-primary` | `#ECE6D9` | `#2E1F14` |
| `--text-secondary` | `#A8A090` | `#6B5240` |
| `--text-tertiary` | `#8E887B` | `#7A5F4A` |
| `--text-on-accent` | `#1A1408` | `#FFFFFF` |
| `--text-on-danger` | `#FFFFFF` | `#FFFFFF` |

**Accent**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--accent` | `#D4A94F` | `#A84A14` |
| `--accent-hover` | `#E8C377` | `#8F3D0F` |
| `--accent-text` | `#F2D79A` | `#8A3A0C` |
| `--accent-tint` | `#2E2A1F` | `#F6DCC4` |
| `--accent-tint-strong` | `#3A3220` | `#EFCBA8` |
| `--accent-surface` | `#2A2517` | `#FCE9D6` |

**États**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--active-text` | `#8FD3C8` | `#4F6B2A` |
| `--active-bg` | `#233436` | `#E3EAD2` |
| `--active-border` | `#2F5A55` | `#B9C79A` |
| `--danger-text` | `#EBA9A0` | `#9A3A2A` |
| `--danger-bg` | `#3A2626` | `#F4D9D2` |
| `--danger-border` | `#5A3A36` | `#E3B3A6` |
| `--danger-strong` | `#B04436` | `#A8402F` |

**Types d'éléments d'action** (`-fg` / `-bg`)

| Jetons | Nuit dorée | Automne |
|---|---|---|
| `--el-battlemap-*` | `#E3A9C4` / `#33282E` | `#8E3B5C` / `#F2DDE5` |
| `--el-sound-*` | `#8FD3C8` / `#233436` | `#4F6B2A` / `#E3EAD2` |
| `--el-stop-all-*` | `#EBA9A0` / `#3A2626` | `#9A3A2A` / `#F4D9D2` |
| `--el-text-*` | `#A9C2E8` / `#2B3140` | `#3E5675` / `#DCE4EE` |
| `--el-wait-*` | `#C8C2B5` / `#2C2C33` | `#6B5240` / `#EDE3D6` |
| `--el-click-*` | `#E8C377` / `#3A3220` | `#8A5A0C` / `#F6E4BE` |
| `--el-scene-*` | `#E8C377` / `#2E2A1F` | `#A84A14` / `#F6DCC4` |

**Dossiers et visuels de remplacement**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--folder-project` | `#C9A55C` | `#B87A2A` |
| `--folder-global` | `#8FB5C9` | `#5B7A9A` |
| `--placeholder-bg` | `#2A2822` | `#EADCC6` |
| `--placeholder-grid` | `rgba(212,169,79,.16)` | `rgba(168,74,20,.18)` |
| `--placeholder-alt-bg` | `#262A2C` | `#E3E3CF` |
| `--placeholder-alt-grid` | `rgba(150,170,170,.14)` | `rgba(110,130,70,.20)` |
| `--player-bg` | `#000` | `#000` |
| `--player-text` | `#8c8576` | `#8a8070` |

**Ombres**

| Jeton | Nuit dorée | Automne |
|---|---|---|
| `--shadow-float` | `0 8px 22px rgba(0,0,0,.45)` | `0 8px 22px rgba(46,31,20,.22)` |
| `--shadow-popover` | `0 10px 28px rgba(0,0,0,.5)` | `0 10px 28px rgba(46,31,20,.25)` |

**Polices** : identiques dans les deux thèmes (Cinzel, Inter, Lora, cf. §3). Les familles de polices sont aussi des jetons de thème (`--font-title`, `--font-ui`, `--font-narrative`) : un thème futur pourra en changer.

### 11.4 Ajouter un thème

1. Copier un fichier de thème existant et changer les valeurs (tous les jetons sont obligatoires).
2. Vérifier les contrastes (§2.8).
3. Déclarer le thème dans la liste des thèmes (nom affiché, clé, couleurs de la carte d'aperçu).
4. Mettre à jour ce document : une ligne au §11.2 et **une colonne** dans les tableaux du §11.3. Le §2 ne change pas, sauf si un nouveau jeton est créé (il faut alors l'ajouter au §2 et donner sa valeur dans **tous** les thèmes).
