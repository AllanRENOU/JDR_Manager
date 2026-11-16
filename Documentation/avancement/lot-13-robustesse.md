# Lot 13 — Robustesse, performance, accessibilité

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 13.1 Stockage

- [x] **13.1.1** Message clair en cas de quota dépassé à l'import. [TRD §5]
  - Note : —
- [x] **13.1.2** (Optionnel) Affichage de la place de stockage utilisée. [NF-14]
  - Note : ⚠️ « Espace disponible » vient du navigateur, qui l'estime largement (et sous-estime les `Blob`) : c'est un ordre de grandeur. Chromium sans interface refuse la protection : l'écran y affiche « Données non protégées ».

## 13.2 Performance

- [x] **13.2.1** Mesurer le changement de scène et le lancement d'une action (< 300 ms). [NF-20]
  - Note : —
- [x] **13.2.2** Plusieurs longues ambiances simultanées sans ralentissement ni coupure. [NF-21, NF-22]
  - Note : —
- [x] **13.2.3** Chargement des médias de la seule scène courante ; miniatures en `loading="lazy"`. [TEC-91, TEC-92]
  - Note : —
- [x] **13.2.4** Vérifier la libération des URL de médias sur une séance longue (pas de fuite mémoire). [TEC-33, NF-23]
  - Note : —

## 13.3 Accessibilité

- [x] **13.3.1** Navigation complète au clavier, focus visible. [Brief §8]
  - Note : ℹ️ Corrigé : le titre de scène modifiable de l'éditeur n'avait pas de contour au focus (`:focus-visible` ajouté).
- [x] **13.3.2** Libellés et attributs ARIA (boutons icône, sections, menus, arborescences). [Brief §8]
  - Note : ℹ️ Corrigés : en-tête / pied de `app-modal` en `<div class="modal__header|footer">` (des `<header>` / `<footer>` créaient des repères en double) ; fenêtre joueurs dans un `<main>` libellé. Les tests ciblent maintenant `.modal__footer`.
- [x] **13.3.3** Contrastes vérifiés dans les deux thèmes. [Brief §2.8]
  - Note : ✅ Décision (Allan) : les éléments **passés** du fil, estompés à 45 % (Brief §6.10), étaient sous le 4,5:1 du Brief §2.8 ; estompage remonté à 65 % (Brief §6.10 mis à jour), pleine opacité au survol ou au focus. ⚠️ Reste en Automne la petite mention « Validé » d'un clic passé (2,86:1, texte secondaire de 13 px) : acceptée en l'état, à revoir si besoin (ne pas estomper cette mention).
- [x] **13.3.4** Respect de `prefers-reduced-motion`. [Brief §8]
  - Note : —

## 13.4 Compatibilité et confort

- [ ] **13.4.1** Tests manuels sur Chrome, Edge et Firefox (dernières versions). [NF-02, TEC-90]
  - Note : ⚠️ À faire par Allan : seul Chromium est disponible ici (tous les tests automatiques y passent). À vérifier dans chaque navigateur : créer un projet, importer battlemaps et sons (glisser-déposer compris), éditer une action, lancer une partie en « Deux fenêtres » (fenêtre joueurs, plein écran par double-clic), sons (fondus, boucle, volume), raccourcis clavier, Continuer après rechargement, thème Automne. Firefox : la demande d'autorisation de stockage persistant au démarrage.
- [x] **13.4.2** Vérifier l'absence de texte en dur hors `fr.json`. [TEC-71]
  - Note : ℹ️ Nouveau script `npm run check:i18n` (`scripts/check-i18n.mjs`), ajouté à la liste des commandes à passer avant de cocher. Pages `features/dev` exclues, « JDR Manager » autorisé.
- [x] **13.4.3** (Optionnel) Raccourcis clavier en Présentation. [NF-32]
  - Note : —
- [x] **13.4.4** Mode démo de la Présentation, lancé par « Présenter » depuis un projet ouvert. [PRS-09]
  - Note : ✅ Décision (Allan, 11/11/2026) : le bouton « Présenter » de l'en-tête de l'éditeur et de l'écran Sons lance une **démo** (`/projects/:id/play?demo=1&scene=<id>`) ; la vraie partie (Continuer / Recommencer) se lance depuis la carte du projet sur l'accueil. Démo : démarrage direct sans fenêtre de lancement, partie sauvegardée ni lue ni modifiée, départ sur la scène ouverte dans l'éditeur (ou la dernière éditée), pastille « Démo », retour à l'éditeur sur la scène en cours. ⚠️ Alerte : une démo ouverte par rechargement de la page (sans clic préalable) peut rester muette tant que le navigateur bloque l'audio ; une démo et une vraie partie ouvertes en même temps partagent le canal de la fenêtre joueurs du projet.
- [x] **13.4.5** Texte facultatif sur l'élément « Attendre ». [ACT-10]
  - Note : ✅ Décision (Allan, 11/11/2026) : texte facultatif (`WaitElement.text`, pas de migration de la base). Présentation : texte affiché **pendant l'attente** à la place de « Attente en cours », puis retiré ; rien n'est ajouté au fil ni enregistré (choix d'Allan).
- [x] **13.4.6** Option « Masquer l'action au départ » et élément « Afficher l'action ». [ACT-12, CTL-01, CTL-02]
  - Note : ✅ Décision (Allan, 11/11/2026) : ACT-12 (jusqu'ici hors V1) entre dans la V1. Cible : une action « Clic du MJ » de la **même scène** ; les actions masquées au départ sont traitées **comme les effectuées** (même liste repliée, raccourcis 1-9 ignorés, lançables) ; **nouvelle couleur** `--el-action-*` (violet, Brief §2.6 et §11.3). ℹ️ Info : `SceneState.shownActionIds` facultatif (pas de migration de la base ni des parties enregistrées). ⚠️ Alerte : `specifications.md` et `Plan_implementation.md` présentent encore cet élément comme une version future (non modifiés).
