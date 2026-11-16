# Lot 0 — Initialisation du projet

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 0.1 Création du projet

- [x] **0.1.1** Créer le projet avec `ng new jdr-manager --style=scss --routing --ssr=false` et vérifier la version d'Angular (dernière stable). [TEC-01, TEC-11, TEC-18]
  - Note : —
- [x] **0.1.2** Vérifier les réglages standalone et zoneless (`provideZonelessChangeDetection`), retirer Zone.js s'il est présent. [TEC-02, TEC-04]
  - Note : ℹ️ Info : projet zoneless par défaut (pas de `zone.js`). En Angular 22, **OnPush est la stratégie par défaut** : ne pas la déclarer ; ESLint interdit `ChangeDetectionStrategy.Eager` / `Default`.
- [x] **0.1.3** Fixer les valeurs par défaut des schematics dans `angular.json` : `style: scss`, `changeDetection: OnPush`, `skipTests: false`, préfixe `app`. [TEC-18]
  - Note : —
- [x] **0.1.4** Initialiser le dépôt Git (`.gitignore`, premier commit).
  - Note : —

## 0.2 Qualité du code

- [x] **0.2.1** Activer TypeScript `strict` et les options strictes des templates. [TEC-09]
  - Note : —
- [x] **0.2.2** `ng add @angular-eslint/schematics` et configurer les règles du projet. [TEC-09]
  - Note : —
- [x] **0.2.3** Installer et configurer Prettier (intégration ESLint). [TEC-09]
  - Note : —
- [x] **0.2.4** Installer Stylelint pour SCSS, avec une règle interdisant les couleurs, tailles et ombres en dur hors des fichiers de jetons et de thèmes. [TEC-14]
  - Note : —

## 0.3 Tests

- [x] **0.3.1** Vérifier la configuration Vitest de `ng test` et écrire un test d'exemple. [TEC-80]
  - Note : —
- [x] **0.3.2** Installer `fake-indexeddb` pour les tests de la couche de données. [TEC-81]
  - Note : —

## 0.4 Structure

- [x] **0.4.1** Créer l'arborescence `core/`, `shared/`, `features/` et `src/styles/`. [TRD §2.2]
  - Note : —
- [x] **0.4.2** Déclarer les routes (`/projects`, `/sounds`, `/projects/:id/edit`, `/play`, `/player`) avec chargement paresseux de composants vides ; README de démarrage (commandes `ng serve`, `ng test`, `ng lint`, `ng build`). [TEC-10, TRD §2.3]
  - Note : ⚠️ Alerte : le dossier `.vscode` (recommandations d'extensions, tâches) n'a pas pu être copié sur ton PC (écriture interdite par l'outil) ; sans impact sur le projet.

**Critère de fin** : `ng serve`, `ng lint`, `ng test` et `ng build` passent sur le projet vide.

> ✅ Vérifié le 6 novembre 2026 : `ng lint`, `npm run lint:styles`, `ng test --watch=false`, `ng build` et `prettier --check` passent. Après récupération, lancer `npm install` dans `Source` avant toute commande.
