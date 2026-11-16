# Lot 4 — Tranche verticale

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

- [x] **4.1** Accueil minimal : liste des projets et création d'un projet. [PRJ-01]
  - Note : ℹ️ Info : ajouts hors TRD : composant partagé `app-header`, `provideFrenchLocale()` (`core/i18n/locale.ts`), `withComponentInputBinding()` (paramètres de route en inputs), utilitaire de test `useTestRepository()`.
- [x] **4.2** Ouverture d'un projet en mode Édition et en mode Présentation (navigation). [PRJ-03]
  - Note : —
- [x] **4.3** Éditeur minimal : création d'une scène unique, marquée première scène. [SCN-03]
  - Note : ℹ️ Info : `EditorStore` est fourni par `EditorPage` (une instance par écran, `@Injectable()` sans `providedIn`) : exception voulue à `@Service()`, qui est global.
- [x] **4.4** Champ texte de scène : création automatique de l'action « Texte de scène » à la première saisie, mise à jour ensuite. [SCN-05, SCN-06]
  - Note : ℹ️ Info : les écritures sont enchaînées une à une (une frappe rapide ne crée jamais deux actions) et le champ n'est initialisé qu'à l'ouverture de la scène (un enregistrement en retard ne peut pas écraser la saisie en cours).
- [x] **4.5** Enregistrement automatique des modifications. [—]
  - Note : ⚠️ Alerte : à la fermeture brutale de l'onglet, le navigateur peut interrompre l'écriture IndexedDB en cours ; au pire, les 500 dernières millisecondes de frappe sont perdues.
- [x] **4.6** `ActionRunner` limité à l'élément « Ajouter un texte ». [TEC-50]
  - Note : —
- [x] **4.7** `PresentationEngine` minimal : ouverture de la première scène, lancement des actions d'ouverture. [PRS-01]
  - Note : ℹ️ Info : sans première scène définie, la Présentation ouvre la première scène de l'arborescence dans l'ordre d'affichage.
- [x] **4.8** Écran de Présentation minimal : fil d'actualité affichant le texte. [FIL-01, FIL-02]
  - Note : ⚠️ Alerte (corrigée) : une classe CSS `.play` de l'écran s'appliquait aussi à l'en-tête, qui a la même classe → en-tête de 300 px. La zone centrale s'appelle maintenant `.stage` et la variante de l'en-tête `.app-header--play`.
- [x] **4.9** Vérification : après rechargement du navigateur, le projet et la scène sont toujours là. [NF-10]
  - Note : —

**Critère de fin** : projet créé → texte de scène écrit → Présentation lancée → texte affiché dans le fil.

> ✅ Lot 4 validé : scénario complet vérifié dans Chromium, dans les deux thèmes (projet créé → première scène → texte saisi → Présentation → texte dans le fil, et toujours là après rechargement). `ng build`, `ng test` (175 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Ajouts hors TRD : composant partagé `app-header`, `EditorStore` (état de l'éditeur, fourni par l'écran), `DebouncedTask`, `provideFrenchLocale()`, utilitaire de test `useTestRepository()`. Pas de nouvelle dépendance.
