import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';

import { Id } from '../../../core/models';
import { Theme } from '../../../core/theme/theme';
import { PresentationEngine } from '../engine/presentation-engine';
import {
  PLAYER_CHANNEL_FACTORY,
  PlayerChannel,
  PlayerMessage,
  playerWindowUrl,
} from '../player-screen/player-channel';

/** Intervalle (ms) de vérification de la fenêtre joueurs (fermée par l'utilisateur). */
export const PLAYER_WINDOW_CHECK_MS = 1000;

/**
 * Côté MJ, la fenêtre joueurs (AFF-02, TEC-53, TRD §9) : ouverture par `window.open`, envoi de
 * la battlemap affichée et du thème par `BroadcastChannel`, suivi de son état (fermée, rechargée).
 * Fourni par l'écran de Présentation, avec le moteur.
 */
@Injectable()
export class PlayerWindow {
  private readonly engine = inject(PresentationEngine);
  private readonly theme = inject(Theme);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly createChannel = inject(PLAYER_CHANNEL_FACTORY);

  private channel: PlayerChannel | null = null;
  private projectId: Id | null = null;
  private ref: Window | null = null;
  private timer?: ReturnType<typeof setInterval>;

  /** Une fenêtre joueurs est ouverte (pastille de l'en-tête). */
  readonly open = signal(false);

  constructor() {
    // Battlemap affichée et thème : envoyés à chaque changement.
    effect(() => {
      const message = this.battlemapMessage();
      untracked(() => this.post(message));
    });
    effect(() => {
      const theme = this.theme.theme();
      untracked(() => this.post({ type: 'theme', theme }));
    });
    // Onglet du MJ fermé ou rechargé : Angular ne détruit rien, on prévient quand même.
    const leave = () => this.post({ type: 'clear' });
    this.window?.addEventListener('pagehide', leave);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('pagehide', leave);
      this.disconnect();
    });
  }

  /**
   * Se branche sur le canal du projet ; une fenêtre joueurs restée ouverte (écran du MJ
   * rechargé) se signale et reçoit l'état courant (11.7).
   */
  connect(projectId: Id): void {
    if (this.projectId === projectId) {
      return;
    }
    this.disconnect();
    this.projectId = projectId;
    this.channel = this.createChannel(projectId);
    this.channel.onmessage = (event) => this.receive(event.data);
    this.post({ type: 'hello' });
  }

  /**
   * Ouvre (ou ramène au premier plan) la fenêtre joueurs. À appeler dans le gestionnaire d'un
   * clic : sinon le navigateur bloque la fenêtre. Renvoie `false` si elle a été bloquée.
   */
  openWindow(): boolean {
    if (!this.projectId || !this.window) {
      return false;
    }
    const ref = this.window.open(
      playerWindowUrl(this.projectId),
      `jdr-manager-player-${this.projectId}`,
      'popup',
    );
    if (!ref) {
      return false;
    }
    this.ref = ref;
    ref.focus?.();
    this.open.set(true);
    this.watch();
    return true;
  }

  private receive(message: PlayerMessage): void {
    switch (message.type) {
      case 'ping':
        // Fenêtre ouverte, rechargée, ou déjà là au démarrage du MJ : état courant.
        this.open.set(true);
        this.post({ type: 'theme', theme: this.theme.theme() });
        this.post(this.battlemapMessage());
        break;
      case 'bye':
        this.open.set(false);
        break;
    }
  }

  private battlemapMessage(): PlayerMessage {
    const sceneId = this.engine.scene()?.id;
    const shown = this.engine.shownBattlemap();
    return sceneId && shown?.battlemap && this.engine.status() === 'ready'
      ? { type: 'show-battlemap', sceneId, battlemapId: shown.id }
      : { type: 'clear' };
  }

  /** Fenêtre fermée par l'utilisateur (sans message `bye`, ex. plantage) : vérifiée régulièrement. */
  private watch(): void {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.ref?.closed) {
        this.ref = null;
        this.open.set(false);
        clearInterval(this.timer);
      }
    }, PLAYER_WINDOW_CHECK_MS);
  }

  private post(message: PlayerMessage): void {
    this.channel?.postMessage(message);
  }

  private disconnect(): void {
    clearInterval(this.timer);
    // Écran du MJ quitté : la fenêtre joueurs n'affiche plus rien.
    this.post({ type: 'clear' });
    this.channel?.close();
    this.channel = null;
    this.projectId = null;
  }
}
