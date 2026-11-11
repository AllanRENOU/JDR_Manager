# JDR Manager — Plan d'implémentation (V1)

| | |
|---|---|
| **Produit** | JDR Manager |
| **Auteur** | Allan Renou |
| **Version du document** | 1.0 — 6 novembre 2026 |
| **Statut** | Brouillon |
| **Documents liés** | [`PRD.md`](./PRD.md) (exigences produit) · [`TRD.md`](./TRD.md) (exigences techniques) · [`Brief_UI_UX.md`](./Brief_UI_UX.md) (charte graphique) · [`specifications.md`](./specifications.md) · [Maquettes](https://claude.ai/artifact/6okmitt29oTdimnuJDEaqk) |

Ce document découpe la V1 en **lots** ordonnés. Chaque lot liste ses tâches, les exigences qu'il couvre (identifiants du PRD et du TRD) et ses critères de fin. Les tailles sont relatives : **S** (petit), **M** (moyen), **L** (gros).

---

## 1. Stratégie

1. **Socle d'abord** : projet, outillage, thèmes, couche de données et composants partagés sont posés avant les écrans, car tout le reste en dépend.
2. **Tranche verticale tôt** : dès que le socle existe, on construit un parcours complet minimal (créer un projet → une scène avec du texte → la présenter). Il valide l'architecture de bout en bout avant d'élargir.
3. **Moteur avant interface** pour la Présentation : le moteur d'actions, la sauvegarde de partie et l'audio sont développés et testés sans écran, puis branchés sur l'interface.
4. **Une fonctionnalité est finie** quand elle respecte la définition de « terminé » (§5).
5. **Angular CLI** pour toute génération de code (TRD TEC-18, §2.4).

---

## 2. Jalons

| Jalon | Contenu | Lots |
|---|---|---|
| **J1 — Socle** | Projet configuré, thèmes, données, composants partagés | 0 à 3 |
| **J2 — Tranche verticale** | Créer un projet, une scène avec texte, la présenter | 4 |
| **J3 — Édition complète** | Projets, sons, scènes, battlemaps, actions | 5 à 8 |
| **J4 — Présentation complète** | Moteur, écran du MJ, fenêtre joueurs, reprise de partie | 9 à 12 |
| **J5 — V1** | Robustesse, accessibilité, recette sur un vrai scénario | 13 et 14 |

---

## 3. Lots

### Lot 0 — Initialisation du projet · S

| Tâche | Réf. |
|---|---|
| `ng new jdr-manager --style=scss --routing --ssr=false` (Angular 22, standalone, zoneless) | TEC-01 à 05, TEC-11, TEC-18 |
| Valeurs par défaut des schematics dans `angular.json` (`scss`, `OnPush`, tests, préfixe `app`) | TEC-04, TEC-18 |
| TypeScript `strict`, `ng add @angular-eslint/schematics`, Prettier, Stylelint (règle « pas de valeur en dur ») | TEC-09, TEC-14 |
| Vitest configuré (`ng test`), `fake-indexeddb` installé | TEC-80 |
| Arborescence des dossiers (`core/`, `shared/`, `features/`, `styles/`) | TRD §2.2 |
| Routes vides avec chargement paresseux | TEC-10, TRD §2.3 |
| Dépôt Git, README de démarrage | — |

**Fin du lot** : `ng serve`, `ng lint`, `ng test` et `ng build` passent sur un projet vide.

### Lot 1 — Styles, thèmes et internationalisation · M

| Tâche | Réf. |
|---|---|
| `_tokens.scss` (espacements, rayons, tailles de texte), `_functions.scss` (`color()`, `space()`…) | Brief §3, §4 ; TRD §10 |
| Moteur de thèmes : liste des jetons obligatoires, contrôle des maps, génération des variables CSS | TEC-12, TEC-13 |
| Fichiers de thème `_nuit-doree.scss` et `_automne.scss` | TEC-17, Brief §11.3 |
| Thème Angular Material (`ng add @angular/material`) branché sur les variables | TEC-08, TEC-15 |
| Polices auto-hébergées (Cinzel, Inter, Lora), icônes Lucide | Brief §3, §5 |
| Services `UiPreferences` (localStorage) et `Theme` (signal, application avant le premier affichage) | TEC-16, TEC-62 |
| Transloco (`ng add @jsverse/transloco`), `fr.json`, organisation des clés | TEC-70 à 72 |

**Fin du lot** : une page de démonstration change de thème à la volée ; un jeton manquant fait échouer la compilation.

### Lot 2 — Couche de données et médias · L

| Tâche | Réf. |
|---|---|
| Modèle de données (interfaces TypeScript) | TRD §3 |
| Contrat `DataRepository` + `InjectionToken` | TEC-21, TEC-22, TEC-24 |
| `IndexedDbRepository` avec `idb` : schéma v1, index, suppressions en cascade | TEC-20, TEC-25, TRD §4.2 |
| Stockage des médias en `Blob`, contrôle des formats, gestion du quota | TEC-30, TEC-31, TEC-34 |
| `MediaUrls` (URL `blob:` avec compteur de références) | TEC-32, TEC-33 |
| Demande de stockage persistant au démarrage | TEC-26, NF-12 |
| Tests unitaires du dépôt (fake-indexeddb) | TEC-81 |

**Fin du lot** : toutes les méthodes du contrat sont testées ; aucun autre code n'importe `idb`.

### Lot 3 — Composants partagés · L

| Tâche | Réf. |
|---|---|
| Composants d'interface de base (`shared/ui`) : boutons, pastilles, champ, section repliable, modale, confirmation, message d'erreur | Brief §6 |
| `TreeComponent<T>` générique : liste plate → arbre, plier/déplier, sélection, glisser-déposer (CDK), menu contextuel (« ⋯ » + clic droit), `labels`, `extraMenuItems`, `itemTemplate`, `selectionMode`, `disabledIds` | TEC-60, TEC-61, SCN-08 à 11 |
| Fenêtre de sélection réutilisable (arbre en lecture seule + recherche, sélection unique ou multiple) | SCN-04, ACT-09 |
| Directive `appFileDrop` + calque plein écran de dépôt | TEC-35, SON-06, BTM-04 |
| Tests unitaires du composant d'arborescence | TEC-82 |

**Fin du lot** : l'arborescence et la fenêtre de sélection fonctionnent avec des données de test ; le dépôt de fichiers affiche le calque et filtre les formats.

### Lot 4 — Tranche verticale · M

| Tâche | Réf. |
|---|---|
| Accueil minimal : créer et ouvrir un projet | PRJ-01, PRJ-03 |
| Éditeur de scène minimal : une scène, le texte de scène (création automatique de l'action « Texte de scène ») | SCN-05, SCN-06 |
| `ActionRunner` limité à « Ajouter un texte » ; `PresentationEngine` minimal | TEC-50 |
| Écran de Présentation minimal : ouverture de la première scène, fil d'actualité avec le texte | PRS-01, FIL-01, FIL-02 |

**Fin du lot** : on crée un projet, on écrit le texte d'une scène, on lance la Présentation et le texte apparaît dans le fil ; après rechargement, le projet est toujours là.

### Lot 5 — Projets et paramètres · S

| Tâche | Réf. |
|---|---|
| Accueil complet : grille de cartes adaptative, carte « Créer un projet », renommer, supprimer (confirmation), état « Partie en cours » | PRJ-01 à 03, TEC-93, NF-31 |
| Écran Paramètres › Apparence (cartes d'aperçu des thèmes) | NF-33 à 35 |

### Lot 6 — Bibliothèques de sons · M

| Tâche | Réf. |
|---|---|
| Écran Sons : arborescences « Ce projet » et « Bibliothèque globale » | SON-01, SON-04 |
| Import par bouton (sélection multiple) et par glisser-déposer | SON-02, SON-06 |
| Tableau des sons : nom, durée, format, utilisation ; renommer, supprimer | SON-03 |
| Pré-écoute (lecture simple, hors moteur audio de Présentation) | SON-05 |

### Lot 7 — Éditeur de scène · L

| Tâche | Réf. |
|---|---|
| Arborescence des scènes (dossiers, scènes, menu contextuel, première scène, dupliquer en option) | SCN-01 à 03, SCN-08 à 12 |
| Zone centrale : texte de scène + textes des actions (champs modifiables, pastilles) | SCN-05 à 07 |
| Volet droit à trois parties repliables : Actions (par déclencheur), Battlemaps, Enchaînement | SCN-13 |
| Battlemaps : import (bouton et glisser-déposer), battlemap par défaut, suppression | BTM-01, BTM-02, BTM-04 |
| Scènes suivantes via la fenêtre de sélection | SCN-04 |

### Lot 8 — Éditeur d'action · L

| Tâche | Réf. |
|---|---|
| Fenêtre d'édition : nom, déclencheur (contrôle segmenté), suppression | ACT-01, ACT-02 |
| Liste d'éléments réordonnables (CDK), cartes dépliables, menu « Ajouter un élément » | ACT-03 |
| Formulaires (Signal Forms) des 8 types d'éléments | ACT-04 à 11, TEC-06 |
| Validation : texte obligatoire du « Clic de l'utilisateur », avertissement de « Changer de scène » | ACT-09, ACT-11 |

**Fin du jalon J3** : un scénario complet (≥ 10 scènes, battlemaps, sons, actions) peut être saisi.

### Lot 9 — Moteur de présentation et audio (sans interface) · L

| Tâche | Réf. |
|---|---|
| `ActionRunner` complet : 8 éléments, séquence, `AbortController`, attente, clic utilisateur, relance sans doublon de texte | TEC-50, TEC-51, CTL-03 |
| `PresentationEngine` : ouverture / quitter une scène, actions d'ouverture dans l'ordre, restauration d'une scène visitée | TRD §6.3, PRS-06 |
| `PlaySessionStore` : sauvegarde à chaque événement, reprise, recommencer | TEC-52, PRS-02 à 05, NF-24 |
| `AudioPlayer` : `<audio>` + Web Audio, volume, boucle, fondus, pause / reprise, volume en direct, pause globale, arrêt en fondu au changement de scène | TEC-40 à 43, CTL-06, CTL-08 à 10 |
| Gestion des éléments supprimés (action ignorée, battlemap ou son manquant → erreur) | PRS-07, NF-25 |
| Tests unitaires du moteur, de la sauvegarde et de l'audio (Web Audio simulé) | TEC-81 |

**Fin du lot** : les scénarios du TRD §6 sont couverts par des tests.

### Lot 10 — Écran de Présentation (PC) · L

| Tâche | Réf. |
|---|---|
| Fenêtre de lancement (Continuer / Recommencer, choix d'affichage) + confirmation | PRS-02, PRS-03, AFF-01, AFF-03 |
| Fil d'actualité : textes (Lora), miniatures de battlemap + modale, bloc « Clic de l'utilisateur », défilement automatique, éléments précédents | FIL-01 à 09 |
| Bouton flottant « Scène suivante » (liste si plusieurs) ; « Aller à une scène » (navigation libre) | CTL-04, CTL-05 |
| Panneau de contrôle à parties repliables : Battlemap, Actions (masquage, « Voir toutes »), Sons (pause, volume, pause globale, lancer un son) | CTL-01 à 03, CTL-07 à 11 |

### Lot 11 — Fenêtre joueurs · M

| Tâche | Réf. |
|---|---|
| Route `/player`, `window.open`, synchronisation `BroadcastChannel` (battlemap, thème, ping initial) | AFF-02, TEC-53, TEC-16 |
| Affichage plein écran, fond noir quel que soit le thème | Brief §2.8 |

### Lot 12 — Reprise et cohérence des données · S

| Tâche | Réf. |
|---|---|
| Vérification de bout en bout : fermeture du navigateur en pleine partie, reprise à l'identique (sons, pauses, volumes, fil) | PRS-04, PRS-05, NF-24 |
| Modification du projet entre deux séances | PRS-07 |

**Fin du jalon J4** : une séance complète peut être animée sur PC, avec ou sans fenêtre joueurs.

### Lot 13 — Robustesse, performance, accessibilité · M

| Tâche | Réf. |
|---|---|
| Quota de stockage : message clair, affichage de la place utilisée | NF-14, risques PRD §8 |
| Performance : changement de scène < 300 ms, longues ambiances, libération des URL | NF-20 à 23, TEC-91, TEC-92 |
| Accessibilité : clavier, focus, `aria-*`, contrastes des deux thèmes | Brief §8 |
| Compatibilité Chrome, Edge, Firefox | NF-02, TEC-90 |
| Raccourcis clavier en Présentation (si le temps le permet) | NF-32 |

### Lot 14 — Recette V1 · S

| Tâche | Réf. |
|---|---|
| Saisie d'un scénario réel complet | Critères de succès PRD §7 |
| Séance réelle de 4 heures sans quitter l'outil ni erreur bloquante | PRD §7 |
| Corrections, puis étiquette `v1.0.0` | — |

**Fin du jalon J5** : les critères de succès du PRD sont atteints.

---

## 4. Dépendances

```
Lot 0 ──► Lot 1 ──► Lot 3 ──┬──► Lot 5
   │                        ├──► Lot 6 ──┐
   └────► Lot 2 ──► Lot 4 ──┴──► Lot 7 ──┴──► Lot 8 ──► Lot 9 ──► Lot 10 ──► Lot 11 ──► Lot 12 ──► Lot 13 ──► Lot 14
```

- Les lots 1 et 2 peuvent avancer en parallèle après le lot 0.
- Le lot 9 (moteur) peut commencer dès le lot 4, en parallèle des lots 5 à 8, avec des données de test.
- Le lot 6 (sons) doit précéder le lot 8, qui a besoin du sélecteur de son.

---

## 5. Définition de « terminé »

Une tâche est terminée quand :

- le code a été généré avec Angular CLI quand c'est possible (TEC-18) ;
- `ng lint` et Stylelint passent (aucune couleur ni taille en dur) ;
- les tests unitaires exigés par le TRD passent (`ng test`) ;
- les textes de l'interface sont dans `fr.json` ;
- l'écran respecte le Brief UI/UX et fonctionne dans les deux thèmes ;
- le comportement correspond au PRD et aux maquettes ; tout écart est reporté dans les documents.
- la sous-tâche est cochée dans [`avancement.md`](./avancement.md), avec une note si une information, une remarque ou une alerte doit être remontée.

---

## 6. Risques et points ouverts

| Sujet | Impact sur le plan | Action |
|---|---|---|
| **Présentation sur tablette** (question ouverte du PRD) | Un lot supplémentaire : onglets tactiles (CTL-12), Safari, et un moyen de transférer le projet du PC vers la tablette | Décider avant le jalon J4 ; si la tablette entre en V1, ajouter un lot « Tablette » après le lot 11 et avancer l'export / import de projet |
| Fondus et pause audio sur Firefox | Comportements Web Audio différents | Prototype audio dès le début du lot 9 |
| Taille des médias | Quota du navigateur atteint plus vite que prévu | Tests avec un projet volumineux pendant le lot 6 |
| Signal Forms (API récente) | Courbe d'apprentissage | Prévoir un formulaire pilote en début de lot 8 |

---

## 7. Après la V1

Dans l'ordre suggéré : sauvegarde / restauration de projet (conception d'abord), export `.zip` hors ligne, plusieurs parties par projet, élément « Faire apparaître une action », traduction, stockage via API, tests de bout en bout (Playwright).
