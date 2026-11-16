# Lot 11 — Fenêtre joueurs

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

- [x] **11.1** Route `/projects/:id/player` et ouverture par `window.open` depuis l'écran du MJ. [AFF-02, TEC-53]
  - Note : ⚠️ Alerte : l'ouverture doit avoir lieu **dans le gestionnaire du clic**, sinon le navigateur bloque la fenêtre : la fenêtre de lancement appelle un rappel `onLaunch` avant de se fermer. Fenêtre bloquée : notification (« autorisez les fenêtres pop-up… ») et bouton « Ouvrir la fenêtre joueurs » dans l'en-tête.
- [x] **11.2** Canal `BroadcastChannel` par projet ; messages `show-battlemap`, `clear`, `ping`. [TEC-53, TRD §9]
  - Note : ℹ️ Info : messages `theme` (11.6), `hello` et `bye` (11.7) ajoutés à ceux du TRD ; `show-battlemap` porte aussi l'id de la scène (il n'existe pas de lecture d'une battlemap seule dans le dépôt). TRD §9 mis à jour.
- [x] **11.3** Résolution de l'URL de la battlemap par la fenêtre joueurs elle-même (identifiants seulement dans les messages). [TRD §9]
  - Note : ℹ️ Info : battlemap supprimée → écran noir côté joueurs (pas de message d'erreur montré aux joueurs ; le MJ voit l'erreur de son côté).
- [x] **11.4** État initial demandé à l'ouverture (`ping`). [TRD §9]
  - Note : —
- [x] **11.5** Affichage plein écran, fond noir quel que soit le thème. [Brief §2.8]
  - Note : ℹ️ Info : nouveaux jetons `player-bg` (`#000` dans les deux thèmes) et `player-text` (Brief §2.7 et §11.3 mis à jour).
- [x] **11.6** Transmission du thème courant. [TEC-16]
  - Note : —
- [x] **11.7** Comportement si la fenêtre joueurs est fermée ou rechargée en cours de partie. [—]
  - Note : —

> ✅ Lot 11 validé : fenêtre joueurs synchronisée par `BroadcastChannel`, vérifiée dans Chromium avec deux fenêtres réelles. `ng build` (sans avertissement), `ng test` (347 tests), `ng lint`, `npm run lint:styles`, `npm run check:themes` et `npm run format:check` passent. Écarts au TRD (mis à jour, §9) : messages `theme`, `hello`, `bye` en plus ; `show-battlemap` porte aussi l'id de la scène. Nouveaux jetons `player-bg` / `player-text` (Brief mis à jour). **À vérifier par Allan** : Firefox et Edge (blocage des fenêtres pop-up, plein écran au double-clic). Pas de nouvelle dépendance.
