# JDR Manager

Outil d'aide au Maître du Jeu pour préparer et animer une partie de jeu de rôle.
Documentation du projet (dossier parent) : `PRD.md`, `TRD.md`, `Brief_UI_UX.md`, `Plan_implementation.md`, `avancement.md`.

## Prérequis

- Node.js 22 (LTS) et npm 10
- Angular CLI 22 (`npm install -g @angular/cli@22`, ou `npx ng …`)

## Démarrage

```bash
npm install        # installe les dépendances (à faire une fois)
ng serve           # serveur de développement : http://localhost:4200
```

## Commandes

| Commande | Rôle |
|---|---|
| `ng serve` | Serveur de développement |
| `ng build` | Build de production (`dist/jdr-manager`) |
| `ng test` | Tests unitaires (Vitest) ; `ng test --watch=false` pour une exécution unique |
| `ng lint` | ESLint (TypeScript et templates) |
| `npm run lint:styles` | Stylelint (SCSS) : interdit les couleurs, tailles et ombres en dur hors jetons et thèmes |
| `npm run format` / `npm run format:check` | Prettier |

## Règles de développement

- Générer le code avec **Angular CLI** (`ng generate …`, `ng add …`) dès que possible (TRD TEC-18, §2.4).
- Composants standalone, signals, zoneless, détection `OnPush` (par défaut depuis Angular 22), control flow natif, `inject()`.
- Styles en SCSS uniquement via les jetons et fonctions de `src/styles` (TRD §10, Brief UI/UX).
- Après chaque sous-tâche : cocher la case dans `avancement.md` et ajouter une note si nécessaire.

## Structure

```
src/app/
├── core/        # données, modèles, médias, i18n
├── shared/      # arborescence générique, composants d'interface
├── features/    # projets, sons, éditeur, présentation
└── app.routes.ts
src/styles/      # jetons, fonctions, thèmes
src/testing/     # utilitaires et tests transverses
```
