# Lot 2 — Couche de données et médias

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 2.1 Modèle

- [x] **2.1.1** Générer les interfaces du modèle (`ng g interface`) : `Project`, `TreeNode`, `SceneNode`, `Scene`, `Battlemap`, `SoundNode`, `Media`. [TRD §3]
  - Note : ⚠️ Alerte : champ `fileName` ajouté à `Media` (nom du fichier d'origine), utile pour nommer un son importé par défaut et pour l'export ; TRD §3 mis à jour.
- [x] **2.1.2** Interfaces `Action` et union `ActionElement` (8 types). [TRD §3]
  - Note : —
- [x] **2.1.3** Interfaces de partie : `PlaySession`, `SceneState` (dont `paused` et `volume` des sons), `FeedItem`. [TRD §3, PRS-04]
  - Note : —

## 2.2 Contrat d'accès

- [x] **2.2.1** Écrire l'interface `DataRepository` complète et le token `DATA_REPOSITORY`. [TEC-21, TEC-22]
  - Note : ℹ️ Info : ajout de `core/data/data-error.ts` : classe `DataError` avec un `code` et une `messageKey` de traduction (`error.data.<code>`), pour que les écrans affichent un message clair sans connaître IndexedDB.
- [x] **2.2.2** Déclarer le fournisseur unique dans `app.config.ts`. [TEC-22]
  - Note : ℹ️ Info : `useExisting` (au lieu de `useClass` du TRD) garantit une seule instance, donc une seule connexion à la base, même si une classe injecte `IndexedDbRepository` directement.

## 2.3 Implémentation IndexedDB

- [x] **2.3.1** Installer `idb`, ouvrir la base, schéma v1 (stores et index du TRD §4.2) dans `upgrade`. [TEC-20, TEC-25]
  - Note : ⚠️ Alerte : index `mediaId` ajouté sur `battlemaps` et `soundNodes` (absent du TRD §4.2) : il permet de savoir rapidement si un média est encore utilisé avant de le supprimer (2.4.3). TRD §4.2 mis à jour.
- [x] **2.3.2** Méthodes projets (liste, lecture, sauvegarde, suppression en cascade dans une seule transaction). [TRD §4.2]
  - Note : —
- [x] **2.3.3** Méthodes arborescence des scènes, scènes, battlemaps, actions. [TRD §4.1]
  - Note : ℹ️ Info : `deleteSceneNode` nettoie aussi `Project.firstSceneId` et `Scene.nextSceneIds` des autres scènes ; `deleteBattlemap` vide `Scene.defaultBattlemapId`. ✅ Décision (Allan) : les éléments « Changer de scène » qui visent une scène supprimée sont conservés tels quels et **signalés à l'écran** (éditeur et Présentation, cf. 8.3.6, 9.3.4, 10.3.7) ; le dépôt ne les modifie pas. ℹ️ Info : l'interdiction de supprimer l'action « Texte de scène » est appliquée par l'éditeur (lot 7), pas par le dépôt, qui doit pouvoir la supprimer avec sa scène.
- [x] **2.3.4** Méthodes bibliothèques de sons (globale et par projet). [SON-01]
  - Note : ℹ️ Info : les éléments « Lancer / Arrêter un son » qui visent un son supprimé restent en l'état et sont signalés à l'affichage (même principe que PRS-07).
- [x] **2.3.5** Méthodes partie sauvegardée (lecture, sauvegarde, suppression). [PRS-04]
  - Note : —

## 2.4 Médias

- [x] **2.4.1** `uploadMedia` : contrôle du type MIME, copie en `Blob` dans le store `media`. [TEC-30, TEC-31, TEC-34]
  - Note : ⚠️ Alerte : en test, fake-indexeddb ne sait pas copier les `Blob` de jsdom ; l'utilitaire `src/testing/node-blob.ts` utilise ceux de Node pendant les tests de médias (ajout de `@types/node` en dépendance de dev). Aucun impact dans le navigateur.
- [x] **2.4.2** Gestion de `QuotaExceededError` (échec propre, message d'erreur). [TRD §5]
  - Note : ⚠️ Alerte : les utilitaires de test (`src/testing`) sont exclus de `tsconfig.app.json` et inclus dans `tsconfig.spec.json`, sinon `ng build` compilait du code de test.
- [x] **2.4.3** Suppression d'un média uniquement s'il n'est plus référencé. [TRD §4.2]
  - Note : —
- [x] **2.4.4** `MediaUrls` : cache `mediaId → blob:` avec compteur de références et `revokeObjectURL`. [TEC-32, TEC-33]
  - Note : ℹ️ Info : API ajoutée à `MediaUrls` (TRD §5) : `track(() => mediaId)` renvoie les signals `url` et `missing`, suit le changement d'id et libère tout seul à la destruction du composant. Une URL non `blob:` (future API distante) n'est pas révoquée.
- [x] **2.4.5** Demande `navigator.storage.persist()` au démarrage. [TEC-26, NF-12]
  - Note : ⚠️ Alerte : Chrome et Edge accordent ou refusent le stockage persistant sans rien demander ; Firefox affiche une demande d'autorisation dès l'ouverture de l'application. Si c'est gênant, on pourra déplacer la demande au premier import de fichier.

## 2.5 Tests

- [x] **2.5.1** Tests unitaires de chaque méthode du dépôt avec `fake-indexeddb` (dont les suppressions en cascade). [TEC-81]
  - Note : ℹ️ Info : nouvelle commande `npm run test:coverage` (ajout de `@vitest/coverage-v8`).
- [x] **2.5.2** Tests de `MediaUrls` (création, partage, libération des URL) ; vérifier qu'aucun autre fichier n'importe `idb`. [TEC-23]
  - Note : ℹ️ Info : vérification de TEC-23 rendue **automatique** par ESLint : `no-restricted-imports` interdit `idb` et `no-restricted-globals` interdit `indexedDB` partout, sauf dans `src/app/core/data` et `src/testing`.

**Critère de fin** : toutes les méthodes du contrat sont testées ; aucun autre code n'importe `idb`.

> ✅ Lot 2 validé : `ng build`, `ng test` (74 tests), `ng lint` (dont la règle TEC-23), `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : `idb`, et pour les tests `@types/node`, `@vitest/coverage-v8`). TRD mis à jour (§3 `Media.fileName`, §4.1 `useExisting` et `DataError`, §4.2 index `mediaId` et nettoyage des références, §5 API de `MediaUrls`). Une question reste ouverte en 2.3.3 (éléments « Changer de scène » vers une scène supprimée).
