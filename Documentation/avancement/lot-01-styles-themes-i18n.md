# Lot 1 — Styles, thèmes et internationalisation

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 1.1 Jetons et fonctions SCSS

- [x] **1.1.1** Créer `_tokens.scss` : espacements, rayons, tailles et graisses de texte. [Brief §3, §4]
  - Note : —
- [x] **1.1.2** Créer `_functions.scss` : `color()`, `space()`, `radius()`, `shadow()`, `font()` qui renvoient des `var(--…)`. [TRD §10.4]
  - Note : ℹ️ Info : `font()` a été découpée en `font-family()` / `font-size()` / `font-weight()`, plus lisibles.
- [x] **1.1.3** Créer les styles de base globaux (reset, `body`, typographie par défaut, focus visible). [Brief §8]
  - Note : —

## 1.2 Moteur de thèmes

- [x] **1.2.1** Créer `_theme-engine.scss` : liste des jetons obligatoires (Brief §2) et mixin `theme()` qui génère les variables CSS. [TEC-12, TEC-13]
  - Note : ℹ️ Info : jeton `color-scheme` ajouté à `$required-tokens` (barres de défilement et contrôles natifs clairs ou sombres).
- [x] **1.2.2** Faire échouer la compilation si un jeton manque dans une map (vérifier avec une map volontairement incomplète). [TEC-12]
  - Note : —
- [x] **1.2.3** Créer `themes/_nuit-doree.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : ⚠️ Alerte : Stylelint impose la notation moderne `rgb(0 0 0 / 50%)` ; elle est désactivée dans les fichiers de thème pour garder la notation `rgba()` du Brief et faciliter la comparaison.
- [x] **1.2.4** Créer `themes/_automne.scss` avec toutes les valeurs du Brief §11.3. [TEC-17]
  - Note : —
- [x] **1.2.5** Générer les deux thèmes dans `styles.scss` (Nuit dorée par défaut sur `:root`). [TEC-13]
  - Note : —

## 1.3 Angular Material, polices et icônes

- [x] **1.3.1** `ng add @angular/material` puis brancher le thème Material (M3 + surcharges) sur les variables CSS. [TEC-08, TEC-15]
  - Note : ℹ️ Info : les liens Google Fonts / Material Symbols ajoutés par `ng add` ont été retirés de `index.html` (polices auto-hébergées, icônes Lucide).
- [x] **1.3.2** Auto-héberger les polices Cinzel, Inter et Lora (`@font-face`, fichiers dans `assets`). [Brief §3, §10]
  - Note : ℹ️ Info : polices auto-hébergées via les paquets `@fontsource/*` (déclarés dans `angular.json`) plutôt que des `@font-face` écrits à la main dans `assets`.
- [x] **1.3.3** Installer les icônes Lucide (`@lucide/angular`) et vérifier leur rendu au trait. [Brief §5]
  - Note : ⚠️ Alerte : `lucide-angular` ne supporte pas Angular 22 (dépendance limitée à Angular 21). Remplacé par le paquet officiel `@lucide/angular` : une directive par icône (`<svg lucidePencil>`), configuration globale `provideLucideConfig({ strokeWidth: 1.75, size: 16 })`. Brief §5 mis à jour.

## 1.4 Préférences et changement de thème

- [x] **1.4.1** Générer le service `UiPreferences` (`ng g service`) : lecture / écriture `localStorage` protégées par `try/catch`. [TEC-62]
  - Note : ⚠️ Alerte : Angular 22 génère `@Service()` et nomme la classe **sans suffixe** : `UiPreferences` (`core/preferences/ui-preferences.ts`). Règle ajoutée au TRD (TEC-19), noms mis à jour dans le TRD et le plan (`Theme`, `UiPreferences`, `AudioPlayer`, `MediaUrls`).
- [x] **1.4.2** Générer le service `Theme` : signal `theme`, application de `data-theme` sur `<html>`, mémorisation. [TEC-16]
  - Note : —
- [x] **1.4.3** Ajouter dans `index.html` le script qui applique le thème mémorisé avant le chargement d'Angular (pas de flash). [TEC-16]
  - Note : —
- [x] **1.4.4** Page de démonstration temporaire : bascule entre les deux thèmes à la volée. [Plan, lot 1]
  - Note : —

## 1.5 Internationalisation

- [x] **1.5.1** `ng add @jsverse/transloco`, langue `fr` par défaut, chargement de `public/i18n/fr.json`. [TEC-70]
  - Note : ℹ️ Info : `ng add` échouait sur l'option `--ssr` : utiliser `ng g @jsverse/transloco:ng-add --langs=fr`. Chargeur déplacé dans `core/i18n/transloco-loader.ts`, chemin relatif `i18n/fr.json` (fonctionne aussi si l'appli est servie dans un sous-dossier).
- [x] **1.5.2** Organiser les clés par domaine (`common`, `project`, `scene`, `action`, `presentation`, `sound`, `error`, `settings`). [TEC-71, TEC-72]
  - Note : —

**Critère de fin** : la page de démonstration change de thème à la volée ; un jeton manquant fait échouer la compilation.

> ✅ Lot 1 validé : `ng build`, `ng test` (21 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. À faire de ton côté : `npm install` dans `Source` (nouvelles dépendances : Material, Transloco, Lucide, Fontsource, Sass), puis `ng serve` et ouvrir `http://localhost:4200/dev/themes`.
