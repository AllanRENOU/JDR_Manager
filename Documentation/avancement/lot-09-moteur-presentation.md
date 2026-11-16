# Lot 9 — Moteur de présentation et audio (sans interface)

Détail du lot (sous-tâches et notes). Mode d'emploi et synthèse : [avancement.md](../avancement.md).

## 9.1 ActionRunner

- [x] **9.1.1** Exécution séquentielle des éléments, signal d'annulation (`AbortController`). [TEC-50, TEC-51]
  - Note : ℹ️ Info : écart de forme au TRD §6.2 : le runner ne fait pas lui-même `engine.goToScene()` ; il renvoie la scène cible (`RunOutcome`) et le moteur l'ouvre (évite qu'une action annule son propre signal).
- [x] **9.1.2** Éléments Ajouter un texte (sans doublon à la relance) et Afficher une battlemap. [ACT-04, ACT-08, CTL-03]
  - Note : ✅ Décision : afficher la battlemap **déjà affichée** n'ajoute pas de miniature en double ; la battlemap par défaut à l'ouverture d'une scène n'est pas ajoutée au fil (ce n'est pas un « changement »).
- [x] **9.1.3** Éléments sonores : lancer, arrêter, arrêter tous. [ACT-05 à 07]
  - Note : ✅ Décision : un même son ne joue qu'une fois à la fois ; le relancer remplace la lecture en cours.
- [x] **9.1.4** Attendre (annulable). [ACT-10]
  - Note : —
- [x] **9.1.5** Clic de l'utilisateur : promesse résolue au clic, rejetée à l'annulation. [ACT-11, FIL-05]
  - Note : ✅ Décision : un bloc en attente créé par l'action interrompue est **retiré du fil** (l'action n'est pas effectuée et pourra être relancée) ; à la relance d'une action, son bloc déjà présent est réutilisé (pas de doublon). Un bloc resté en attente après une fermeture brutale est retiré à la reprise (précisé en 12.1).
- [x] **9.1.6** Changer de scène (fin de l'action). [ACT-09]
  - Note : —
- [x] **9.1.7** Marquage des actions effectuées et relance. [CTL-01 à 03]
  - Note : —

## 9.2 PresentationEngine

- [x] **9.2.1** Ouverture d'une scène jamais visitée : battlemap par défaut, actions d'ouverture dans l'ordre (« Texte de scène » en premier). [TRD §6.3]
  - Note : —
- [x] **9.2.2** Quitter une scène : annulation des actions, sons coupés en fondu, sauvegarde. [CTL-06]
  - Note : —
- [x] **9.2.3** Retour sur une scène visitée : restauration de l'état sans relancer les actions d'ouverture. [PRS-06]
  - Note : —
- [x] **9.2.4** Changement de battlemap (action ou sélecteur) et ajout au fil. [FIL-03, CTL-07]
  - Note : —
- [x] **9.2.5** Signals exposés : scène, fil, battlemap, actions disponibles / effectuées, sons. [TRD §6.1]
  - Note : ⚠️ Alerte : dans `GmScreenPage`, l'`effect` qui démarre le moteur doit l'appeler dans `untracked()` : sinon il suit les signals lus par le moteur et le relance à chaque enregistrement (corrigé).

## 9.3 PlaySessionStore

- [x] **9.3.1** Sauvegarde à chaque événement (élément exécuté, battlemap, son, clic validé). [TEC-52, NF-24]
  - Note : —
- [x] **9.3.2** Continuer : restauration de la dernière scène dans l'état exact. [PRS-05]
  - Note : ✅ Décision : si la dernière scène a été supprimée depuis, la partie reprend sur la première scène.
- [x] **9.3.3** Recommencer : effacement de la partie et retour à la première scène. [PRS-03]
  - Note : —
- [x] **9.3.4** Références vers des éléments supprimés : action ignorée, battlemap, son ou scène cible d'un « Changer de scène » manquants signalés (pas de changement de scène dans ce dernier cas). [PRS-07, NF-25]
  - Note : —

## 9.4 AudioPlayer

- [x] **9.4.1** Prototype Web Audio sur Chrome et Firefox (fondus, pause) avant le reste du service. [Plan §6]
  - Note : ⚠️ Alerte : Firefox n'est pas disponible dans mon environnement : prototype Web Audio **à vérifier par Allan** dans Firefox (fondus, pause, volume, boucle).
- [x] **9.4.2** `AudioContext` unique, créé / repris au premier clic. [TEC-43]
  - Note : —
- [x] **9.4.3** Lecture `<audio>` + `MediaElementAudioSourceNode` + `GainNode`, boucle, volume. [TEC-40, TEC-41]
  - Note : —
- [x] **9.4.4** Fondus en entrée et en sortie. [TEC-42]
  - Note : ℹ️ Info : un son lancé à la main a un fondu de sortie par défaut `DEFAULT_FADE_OUT_MS` = 1 s.
- [x] **9.4.5** Pause / reprise d'un son et volume en direct. [CTL-08, CTL-09]
  - Note : —
- [x] **9.4.6** Pause / reprise globale et signal `anyPlaying`. [CTL-10]
  - Note : —
- [x] **9.4.7** Relance des sons d'une scène restaurée (depuis le début, avec volume et état de pause). [PRS-05]
  - Note : —

## 9.5 Tests

- [x] **9.5.1** Tests de l'`ActionRunner` (séquence, annulation, attente, clic, relance). [TEC-81]
  - Note : —
- [x] **9.5.2** Tests du `PresentationEngine` et du `PlaySessionStore` (scénarios du TRD §6). [TEC-81]
  - Note : —
- [x] **9.5.3** Tests de l'`AudioPlayer` avec Web Audio simulé. [TEC-81]
  - Note : —
- [x] **9.5.4** Tests des références supprimées (dont la scène cible d'un « Changer de scène »). [PRS-07]
  - Note : —

**Critère de fin** : les scénarios du TRD §6 sont couverts par des tests.

> ✅ Lot 9 validé : moteur de présentation complet sans interface (`ActionRunner`, `PresentationEngine`, `PlaySessionStore`, `AudioPlayer`), 41 nouveaux tests (suite : 324). `ng build` (sans avertissement), `ng test`, `ng lint`, `npm run lint:styles` et `npm run format:check` passent ; vérifié dans Chromium sur le scénario Valombre. Écarts au TRD (mis à jour, §6 et §7) : le runner renvoie la scène cible au lieu d'appeler le moteur ; `stopAll()` coupe toujours en fondu. **À faire par Allan** : ouvrir `prototypes/prototype-web-audio.html` dans Firefox (9.4.1). Décisions à confirmer (cf. notes 9.1.2, 9.1.3, 9.1.5, 9.3.2). Pas de nouvelle dépendance.
