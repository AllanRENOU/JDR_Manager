import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import {
  Action,
  Battlemap,
  FeedItem,
  Id,
  PlaySession,
  PlayingSound,
  Project,
  Scene,
  SceneNode,
  SceneState,
  SoundNode,
  UserClickElement,
  WaitElement,
  newId,
} from '../../../core/models';
import { visibleRows } from '../../../shared/tree/tree-model';
import { delay } from '../../../shared/util/delay';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { AudioPlayer, DEFAULT_FADE_OUT_MS, SoundRequest } from '../audio/audio-player';
import { ActionContext, ActionRunner, RunOutcome } from './action-runner';
import { PlaySessionStore, newSceneState } from './play-session-store';

/**
 * - `loading` : chargement ;
 * - `choose` : chargé, en attente du lancement (fenêtre de lancement) : `savedSession` dit s'il y a
 *   une partie à continuer (PRS-02) ; sinon la partie commencera sur la première scène (PRS-01) ;
 * - `ready` : une scène est ouverte ;
 * - `missing` : projet introuvable ; `no-scene` : projet sans scène.
 */
export type PresentationStatus = 'loading' | 'choose' | 'ready' | 'missing' | 'no-scene';

/** Action manuelle de la scène, avec son état (CTL-01 à CTL-03). */
export interface ManualAction {
  action: Action;
  done: boolean;
  running: boolean;
}

/** Battlemap affichée : `battlemap` vaut `null` si elle a été supprimée du projet (PRS-07). */
export interface ShownBattlemap {
  id: Id;
  battlemap: Battlemap | null;
}

/** Entrée du fil à amener en haut de l'écran (FIL-06, CTL-03) ; `seq` change à chaque demande. */
/**
 * Temps minimal (ms) entre deux éléments affichés dans le fil par les actions d'une scène
 * (texte, battlemap, clic de l'utilisateur), pour laisser le temps de lire. Les tests le
 * mettent à 0 (`usePresentation()`).
 */
export const DISPLAY_GAP_MS = new InjectionToken<number>('DISPLAY_GAP_MS', {
  factory: () => 1000,
});

export interface FeedFocus {
  itemId: Id;
  seq: number;
}

/**
 * Élément « Attendre » en cours : affiché en bas du fil avec le temps restant, puis retiré.
 * N'est pas enregistré dans la partie (décision d'Allan).
 */
export interface PendingWait {
  id: Id;
  /** Fin de l'attente (`Date.now()`, ms). */
  endsAt: number;
  durationMs: number;
  /** Texte facultatif de l'élément « Attendre », montré à la place de « Attente en cours ». */
  text?: string;
}

/** Clic de l'utilisateur en attente : promesse de l'action et retour arrière à l'annulation. */
interface PendingClick {
  resolve: () => void;
  /** Bloc créé par cette exécution (retiré du fil si elle est annulée) ou réutilisé (relance). */
  created: boolean;
  sceneId: Id;
}

/**
 * Moteur de présentation (TRD §6) : charge la partie, ouvre et quitte les scènes, exécute les
 * actions et expose l'état courant sous forme de signals. Fourni par l'écran de Présentation,
 * avec `ActionRunner` et `PlaySessionStore`. Chaque événement est enregistré (TEC-52) ; une
 * ressource supprimée est signalée sans interrompre la partie (PRS-07, NF-25).
 */
@Injectable()
export class PresentationEngine {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly runner = inject(ActionRunner);
  private readonly store = inject(PlaySessionStore);
  private readonly audio = inject(AudioPlayer);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly displayGapMs = inject(DISPLAY_GAP_MS);

  readonly status = signal<PresentationStatus>('loading');
  readonly project = signal<Project | null>(null);
  /** Arborescence des scènes (navigation libre, CTL-05). */
  readonly sceneNodes = signal<readonly SceneNode[]>([]);
  /** Sons des deux bibliothèques (projet puis globale), pour les lancer et les nommer. */
  readonly soundNodes = signal<readonly SoundNode[]>([]);
  /** Partie sauvegardée proposée à la reprise (statut `choose`). */
  readonly savedSession = signal<PlaySession | null>(null);

  readonly scene = signal<Scene | null>(null);
  readonly sceneNode = signal<SceneNode | null>(null);
  /** Battlemaps de la scène ouverte, par ordre (sélecteur, CTL-07). */
  readonly battlemaps = signal<readonly Battlemap[]>([]);
  /** Actions de la scène ouverte, par identifiant. */
  readonly actions = signal<ReadonlyMap<Id, Action>>(new Map());
  /** Actions en cours d'exécution. */
  readonly runningActionIds = signal<ReadonlySet<Id>>(new Set());
  /** Attentes en cours dans la scène ouverte, par ordre de début (lignes du fil). */
  readonly waits = signal<readonly PendingWait[]>([]);
  /**
   * Entrée du fil à montrer : la **première** affichée (ajout ou relance) depuis le dernier point
   * de départ (ouverture de scène, action ou battlemap lancée par le MJ, « Continuer », fin d'une
   * attente). Les suivantes ne la déplacent pas : le MJ lit une salve d'éléments depuis le début.
   */
  readonly focus = signal<FeedFocus | null>(null);
  /** Sons en cours (contrôles du MJ, CTL-08 à CTL-10). */
  readonly sounds = this.audio.sounds;
  readonly anyPlaying = this.audio.anyPlaying;

  private readonly sceneState = computed<SceneState | null>(() => {
    const id = this.scene()?.id;
    return id ? (this.store.session()?.scenes[id] ?? null) : null;
  });

  /**
   * Fil d'actualité de la scène (FIL-01). Les textes et clics d'une action ou d'un élément
   * supprimés ne sont plus affichés (PRS-07).
   */
  readonly feed = computed<readonly FeedItem[]>(() =>
    (this.sceneState()?.feed ?? []).filter(
      (item) => item.type === 'battlemap' || this.elementOf(item) !== null,
    ),
  );
  readonly doneActionIds = computed<ReadonlySet<Id>>(
    () => new Set(this.sceneState()?.doneActionIds ?? []),
  );
  readonly shownBattlemap = computed<ShownBattlemap | null>(() => {
    const id = this.sceneState()?.currentBattlemapId;
    return id ? { id, battlemap: this.battlemaps().find((b) => b.id === id) ?? null } : null;
  });
  /** Actions déclenchées à la main, par ordre (CTL-01). */
  readonly manualActions = computed<readonly ManualAction[]>(() =>
    [...this.actions().values()]
      .filter((a) => a.trigger === 'manual')
      .sort((a, b) => a.order - b.order)
      .map((action) => ({
        action,
        done: this.doneActionIds().has(action.id),
        running: this.runningActionIds().has(action.id),
      })),
  );
  /** Scènes suivantes existantes (CTL-04). */
  readonly nextScenes = computed<readonly SceneNode[]>(() => {
    const nodes = new Map(this.sceneNodes().map((n) => [n.id, n]));
    return (this.scene()?.nextSceneIds ?? [])
      .map((id) => nodes.get(id))
      .filter((n): n is SceneNode => n?.kind === 'item');
  });

  private sceneController: AbortController | null = null;
  private readonly pendingClicks = new Map<Id, PendingClick>();
  /** Pendant un changement de scène, les sons ne sont pas reportés dans la partie. */
  private switching = false;
  private focusSeq = 0;
  /** Une salve a commencé et aucun élément n'y a encore été montré (voir `focus`). */
  private burstStarted = false;
  /** Instant (ms) à partir duquel le prochain élément peut s'afficher (`beforeDisplay`). */
  private nextDisplayAt = 0;

  constructor() {
    const unsubscribe = this.audio.onChange(() => this.syncSounds());
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  // ── Démarrage ───────────────────────────────────────────────────────────

  /**
   * Charge le projet et sa partie sauvegardée, sans rien ouvrir : le statut passe à `choose` et
   * l'écran lance la partie (`continueSession()` ou `restart()`) au clic qui débloque l'audio.
   */
  async load(projectId: Id): Promise<void> {
    this.stop();
    this.status.set('loading');
    this.savedSession.set(null);
    const project = await this.repository.getProject(projectId);
    if (!project) {
      this.status.set('missing');
      return;
    }
    const [nodes, projectSounds, globalSounds, saved] = await Promise.all([
      this.repository.listSceneNodes(projectId),
      this.repository.listSoundNodes(projectId),
      this.repository.listSoundNodes('global'),
      this.store.findSaved(projectId),
    ]);
    this.project.set(project);
    this.sceneNodes.set(nodes);
    this.soundNodes.set([...projectSounds, ...globalSounds]);
    if (!this.firstSceneId()) {
      this.status.set('no-scene');
      return;
    }
    this.savedSession.set(saved ?? null);
    this.status.set('choose');
  }

  /** Charge puis lance sans poser de question : continue la partie sauvegardée s'il y en a une. */
  async start(projectId: Id): Promise<void> {
    await this.load(projectId);
    if (this.status() === 'choose') {
      await (this.savedSession() ? this.continueSession() : this.restart());
    }
  }

  /** La partie est une démo : rien n'est lu ni enregistré. */
  readonly demo = this.store.demo.asReadonly();

  /**
   * Démo (lancée depuis l'éditeur ou l'écran Sons) : partie neuve en mémoire seulement, qui
   * commence à `sceneId` (ou à la première scène si elle n'existe plus). La partie sauvegardée
   * n'est ni lue ni modifiée.
   */
  async startDemo(projectId: Id, sceneId: Id | null): Promise<void> {
    this.store.enableDemo();
    await this.load(projectId);
    const project = this.project();
    const start = sceneId && this.sceneExists(sceneId) ? sceneId : this.firstSceneId();
    if (this.status() !== 'choose' || !project || !start) {
      return;
    }
    await this.store.restart(project.id, start);
    await this.openScene(start);
  }

  /** Première scène du projet (fenêtre de lancement, Recommencer). */
  firstScene(): SceneNode | null {
    const id = this.firstSceneId();
    return this.sceneNodes().find((n) => n.id === id) ?? null;
  }

  /** Continuer (PRS-05) : rouvre la dernière scène dans l'état où elle était. */
  async continueSession(): Promise<void> {
    const saved = this.savedSession();
    if (!saved) {
      return;
    }
    this.store.resume(saved);
    this.savedSession.set(null);
    const current = this.sceneExists(saved.currentSceneId)
      ? saved.currentSceneId
      : this.firstSceneId();
    if (current) {
      await this.openScene(current);
    }
  }

  /** Recommencer (PRS-03) : efface la partie et ouvre la première scène. */
  async restart(): Promise<void> {
    const project = this.project();
    const first = this.firstSceneId();
    if (!project || !first) {
      return;
    }
    this.savedSession.set(null);
    await this.store.restart(project.id, first);
    await this.openScene(first);
  }

  // ── Scènes ──────────────────────────────────────────────────────────────

  /**
   * Ouvre une scène (TRD §6.3). La scène quittée : actions interrompues, sons coupés en fondu,
   * état enregistré (CTL-06). Scène jamais visitée : battlemap par défaut puis actions d'ouverture
   * dans l'ordre ; scène visitée : état restauré, sans relancer ses actions d'ouverture (PRS-06).
   */
  async openScene(sceneId: Id): Promise<void> {
    this.switching = true;
    this.leaveScene();
    const controller = new AbortController();
    this.sceneController = controller;
    this.store.setCurrentScene(sceneId);

    const [scene, actions, battlemaps] = await Promise.all([
      this.repository.getScene(sceneId),
      this.repository.listActions(sceneId),
      this.repository.listBattlemaps(sceneId),
    ]);
    if (controller.signal.aborted) {
      return;
    }
    this.sceneNode.set(this.sceneNodes().find((n) => n.id === sceneId) ?? null);
    this.scene.set(scene ?? null);
    this.actions.set(new Map(actions.map((a) => [a.id, a])));
    this.battlemaps.set(battlemaps);
    this.focus.set(null);
    this.nextDisplayAt = 0;
    this.startBurst();

    const saved = this.store.sceneState(sceneId);
    if (saved?.visited) {
      // Un clic resté en attente (fermeture brutale) n'a plus d'action pour le reprendre : retiré
      // si l'action n'a jamais été terminée, sinon (relance interrompue) remis à l'état validé.
      this.store.updateScene(sceneId, (state) => ({
        ...state,
        feed: state.feed.flatMap((item) => {
          if (item.type !== 'user-click' || item.validated) {
            return [item];
          }
          return state.doneActionIds.includes(item.actionId) ? [{ ...item, validated: true }] : [];
        }),
      }));
      this.status.set('ready');
      await this.restoreSounds(saved.playingSounds);
      this.switching = false;
      this.syncSounds();
      return;
    }

    this.store.updateScene(sceneId, () => newSceneState(scene?.defaultBattlemapId ?? null));
    this.status.set('ready');
    this.switching = false;
    this.syncSounds();
    for (const action of openingActions(actions)) {
      const outcome = await this.execute(action, sceneId, controller.signal);
      if (outcome === null || outcome.kind === 'change-scene') {
        return;
      }
    }
  }

  /** Lance une action manuelle, ou relance une action effectuée (CTL-01, CTL-03). */
  async runAction(actionId: Id): Promise<void> {
    const action = this.actions().get(actionId);
    const sceneId = this.scene()?.id;
    const controller = this.sceneController;
    if (!action || !sceneId || !controller || this.runningActionIds().has(actionId)) {
      return;
    }
    this.startBurst();
    await this.execute(action, sceneId, controller.signal);
  }

  /** « Cliquer pour continuer » d'un bloc du fil (FIL-05). */
  continueClick(itemId: Id): void {
    const pending = this.pendingClicks.get(itemId);
    if (!pending) {
      return;
    }
    this.pendingClicks.delete(itemId);
    this.setClickValidated(pending.sceneId, itemId, true);
    this.startBurst();
    pending.resolve();
  }

  /** Change la battlemap affichée (sélecteur, CTL-07) ; sa miniature est ajoutée au fil (FIL-03). */
  showBattlemap(battlemapId: Id): void {
    const sceneId = this.scene()?.id;
    if (sceneId) {
      this.startBurst();
      this.applyBattlemap(sceneId, battlemapId);
    }
  }

  // ── Sons (contrôles du MJ) ──────────────────────────────────────────────

  /** Lance un son d'une bibliothèque, à la main (CTL-08). */
  async playLibrarySound(soundId: Id): Promise<void> {
    await this.playSound(
      {
        soundId,
        elementId: null,
        volume: 1,
        loop: false,
        fadeInMs: 0,
        fadeOutMs: DEFAULT_FADE_OUT_MS,
      },
      {},
    );
  }

  pauseSound(soundId: Id): void {
    this.audio.pause(soundId);
  }

  resumeSound(soundId: Id): Promise<void> {
    return this.audio.resume(soundId);
  }

  setVolume(soundId: Id, volume: number): void {
    this.audio.setVolume(soundId, volume);
  }

  /** Bouton global lecture / pause (CTL-10). */
  togglePlayback(): Promise<void> {
    if (this.audio.anyPlaying()) {
      this.audio.pauseAll();
      return Promise.resolve();
    }
    return this.audio.resumeAll();
  }

  // ── Lecture du fil ──────────────────────────────────────────────────────

  /** Texte d'une entrée du fil, relu dans l'action ; `null` si l'action ou l'élément a été supprimé. */
  textOf(item: FeedItem): string | null {
    const element = this.elementOf(item);
    return element && 'text' in element ? (element.text ?? null) : null;
  }

  /** Quitte la Présentation : actions arrêtées, sons coupés en fondu, partie enregistrée. */
  stop(): Promise<void> {
    this.switching = true;
    this.leaveScene();
    this.switching = false;
    return this.store.flush();
  }

  // ── Exécution ───────────────────────────────────────────────────────────

  /** Exécute une action ; `null` si elle a été interrompue (scène quittée). */
  private async execute(
    action: Action,
    sceneId: Id,
    signal: AbortSignal,
  ): Promise<RunOutcome | null> {
    this.runningActionIds.update((ids) => new Set([...ids, action.id]));
    try {
      const outcome = await this.runner.run(action, this.contextFor(sceneId), signal);
      if (outcome.kind === 'change-scene') {
        // Pas d'attente : la nouvelle scène peut elle-même attendre un clic.
        this.openScene(outcome.sceneId).catch((error) => this.notifications.fromError(error));
      }
      return outcome;
    } catch (error) {
      if (signal.aborted) {
        return null;
      }
      this.notifications.fromError(error);
      return { kind: 'done' };
    } finally {
      this.runningActionIds.update((ids) => {
        const next = new Set(ids);
        next.delete(action.id);
        return next;
      });
    }
  }

  /** Contexte d'exécution d'une action de la scène `sceneId` (TRD §6.2). */
  private contextFor(sceneId: Id): ActionContext {
    return {
      beforeDisplay: (signal) => this.beforeDisplay(signal),
      addText: (action, element) => {
        const existing = this.store
          .sceneState(sceneId)
          ?.feed.find((item) => item.type === 'text' && item.elementId === element.id);
        if (existing) {
          // Relance (CTL-03) : pas de doublon, le fil revient sur le texte.
          this.show(existing.id);
          return;
        }
        this.addFeedItem(sceneId, {
          id: newId(),
          type: 'text',
          actionId: action.id,
          elementId: element.id,
        });
      },
      showBattlemap: (element) => this.applyBattlemap(sceneId, element.battlemapId),
      playSound: (element) => {
        void this.playSound({ ...element, elementId: element.id }, {});
      },
      stopSound: (element) => this.audio.stop(element.soundId),
      stopAllSounds: () => this.audio.stopAll(),
      waitForUserClick: (action, element, signal) =>
        this.waitForUserClick(sceneId, action, element, signal),
      wait: (element, signal) => this.wait(element, signal),
      canChangeScene: (element) => {
        if (this.sceneExists(element.sceneId)) {
          return true;
        }
        this.notifications.error(this.transloco.translate('presentation.errors.missingScene'));
        return false;
      },
      markDone: (action) =>
        this.store.updateScene(sceneId, (state) =>
          state.doneActionIds.includes(action.id)
            ? state
            : { ...state, doneActionIds: [...state.doneActionIds, action.id] },
        ),
    };
  }

  private waitForUserClick(
    sceneId: Id,
    action: Action,
    element: UserClickElement,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      // Relance : le bloc déjà présent redevient en attente, sans doublon.
      const existing = this.store
        .sceneState(sceneId)
        ?.feed.find((item) => item.type === 'user-click' && item.elementId === element.id);
      const itemId = existing?.id ?? newId();
      if (existing) {
        this.setClickValidated(sceneId, itemId, false);
        this.show(itemId);
      } else {
        this.addFeedItem(sceneId, {
          id: itemId,
          type: 'user-click',
          actionId: action.id,
          elementId: element.id,
          validated: false,
        });
      }
      this.pendingClicks.set(itemId, { resolve, created: !existing, sceneId });
      signal.addEventListener(
        'abort',
        () => {
          if (!this.pendingClicks.delete(itemId)) {
            return;
          }
          // Action interrompue : un bloc créé disparaît, un bloc réutilisé redevient validé.
          if (existing) {
            this.setClickValidated(sceneId, itemId, true);
          } else {
            this.store.updateScene(sceneId, (state) => ({
              ...state,
              feed: state.feed.filter((item) => item.id !== itemId),
            }));
          }
          reject(signal.reason);
        },
        { once: true },
      );
    });
  }

  /**
   * Espace les éléments affichés de `DISPLAY_GAP_MS`, toutes actions de la scène confondues
   * (actions d'ouverture successives, actions lancées en parallèle) : chaque appel réserve
   * son créneau. Après un clic ou une attente plus longs que l'écart, aucune pause.
   */
  private async beforeDisplay(signal: AbortSignal): Promise<void> {
    const now = Date.now();
    const at = Math.max(now, this.nextDisplayAt);
    this.nextDisplayAt = at + this.displayGapMs;
    if (at > now) {
      await delay(at - now, signal);
    }
  }

  private async wait(element: WaitElement, signal: AbortSignal): Promise<void> {
    const durationMs = Math.max(0, element.seconds * 1000);
    const text = element.text?.trim();
    const pending: PendingWait = {
      id: newId(),
      endsAt: Date.now() + durationMs,
      durationMs,
      ...(text ? { text } : {}),
    };
    this.waits.update((waits) => [...waits, pending]);
    try {
      await delay(durationMs, signal);
      this.startBurst();
    } finally {
      this.waits.update((waits) => waits.filter((w) => w !== pending));
    }
  }

  private applyBattlemap(sceneId: Id, battlemapId: Id): void {
    if (this.store.sceneState(sceneId)?.currentBattlemapId === battlemapId) {
      return;
    }
    this.store.updateScene(sceneId, (state) => ({ ...state, currentBattlemapId: battlemapId }));
    this.addFeedItem(sceneId, { id: newId(), type: 'battlemap', battlemapId });
  }

  private addFeedItem(sceneId: Id, item: FeedItem): void {
    this.store.updateScene(sceneId, (state) => ({ ...state, feed: [...state.feed, item] }));
    this.show(item.id);
  }

  private setClickValidated(sceneId: Id, itemId: Id, validated: boolean): void {
    this.store.updateScene(sceneId, (state) => ({
      ...state,
      feed: state.feed.map((item) =>
        item.id === itemId && item.type === 'user-click' ? { ...item, validated } : item,
      ),
    }));
  }

  /** Les éléments affichés ensuite forment une nouvelle salve : le premier prendra le focus. */
  private startBurst(): void {
    this.burstStarted = true;
  }

  /** Élément affiché (ajout ou relance) : il prend le focus s'il est le premier de sa salve. */
  private show(itemId: Id): void {
    if (this.burstStarted) {
      this.burstStarted = false;
      this.focus.set({ itemId, seq: ++this.focusSeq });
    }
  }

  // ── Sons ────────────────────────────────────────────────────────────────

  /** Lance un son ; un son supprimé n'est pas lancé et un message s'affiche (PRS-07, NF-25). */
  private async playSound(
    params: Omit<SoundRequest, 'mediaId'>,
    options: { paused?: boolean; volume?: number },
  ): Promise<boolean> {
    const node = this.soundNodes().find((n) => n.id === params.soundId && n.kind === 'item');
    const played = node?.mediaId
      ? await this.audio.play({ ...params, mediaId: node.mediaId }, options)
      : false;
    if (!played) {
      this.notifications.error(this.transloco.translate('presentation.errors.missingSound'));
    }
    return played;
  }

  /** Relance les sons d'une scène restaurée : depuis le début, avec volume et pause (PRS-05). */
  private async restoreSounds(sounds: readonly PlayingSound[]): Promise<void> {
    for (const sound of sounds) {
      const element = sound.elementId ? this.findElement(sound.elementId) : null;
      const params =
        element?.type === 'play-sound'
          ? { ...element, elementId: element.id }
          : {
              soundId: sound.soundId,
              elementId: null,
              volume: sound.volume,
              loop: false,
              fadeInMs: 0,
              fadeOutMs: DEFAULT_FADE_OUT_MS,
            };
      await this.playSound(params, { paused: sound.paused, volume: sound.volume });
    }
  }

  /** Reporte les sons en cours dans l'état de la scène ouverte (TEC-52). */
  private syncSounds(): void {
    const sceneId = this.scene()?.id;
    if (this.switching || !sceneId || !this.store.sceneState(sceneId)) {
      return;
    }
    const playingSounds: PlayingSound[] = this.audio.sounds().map((s) => ({
      soundId: s.soundId,
      elementId: s.elementId,
      paused: s.paused,
      volume: s.volume,
    }));
    if (
      JSON.stringify(playingSounds) !==
      JSON.stringify(this.store.sceneState(sceneId)?.playingSounds)
    ) {
      this.store.updateScene(sceneId, (state) => ({ ...state, playingSounds }));
    }
  }

  // ── Utilitaires ─────────────────────────────────────────────────────────

  /** Quitte la scène ouverte : actions annulées puis sons coupés en fondu (CTL-06). */
  private leaveScene(): void {
    this.sceneController?.abort();
    this.sceneController = null;
    this.audio.stopAll();
  }

  private elementOf(item: FeedItem) {
    if (item.type === 'battlemap') {
      return null;
    }
    return (
      this.actions()
        .get(item.actionId)
        ?.elements.find((e) => e.id === item.elementId) ?? null
    );
  }

  private findElement(elementId: Id) {
    for (const action of this.actions().values()) {
      const element = action.elements.find((e) => e.id === elementId);
      if (element) {
        return element;
      }
    }
    return null;
  }

  private sceneExists(sceneId: Id): boolean {
    return this.sceneNodes().some((n) => n.id === sceneId && n.kind === 'item');
  }

  /** Première scène du projet, sinon la première de l'arborescence (ordre d'affichage). */
  private firstSceneId(): Id | null {
    const project = this.project();
    if (project?.firstSceneId && this.sceneExists(project.firstSceneId)) {
      return project.firstSceneId;
    }
    return (
      visibleRows(this.sceneNodes(), new Set()).find((row) => row.node.kind === 'item')?.node.id ??
      null
    );
  }
}

/** Actions déclenchées à l'ouverture : « Texte de scène » d'abord, puis par ordre (TRD §6.2). */
function openingActions(actions: readonly Action[]): Action[] {
  return actions
    .filter((a) => a.trigger === 'scene-open')
    .sort((a, b) => Number(b.isSceneText) - Number(a.isSceneText) || a.order - b.order);
}
