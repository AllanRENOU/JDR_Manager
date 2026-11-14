import { InjectionToken } from '@angular/core';

import { Id } from '../../../core/models';
import { ThemeId } from '../../../core/theme/theme';

/**
 * Messages entre l'écran du MJ et la fenêtre joueurs (TRD §9, TEC-53). Ils ne transportent que
 * des identifiants : la fenêtre joueurs résout elle-même l'image (une URL `blob:` n'est pas
 * garantie d'une fenêtre à l'autre).
 */
export type PlayerMessage =
  // MJ → joueurs
  /** Battlemap à afficher (la scène permet de la retrouver). */
  | { type: 'show-battlemap'; sceneId: Id; battlemapId: Id }
  /** Rien à afficher : écran noir. */
  | { type: 'clear' }
  /** Thème courant du MJ (TEC-16). */
  | { type: 'theme'; theme: ThemeId }
  /** L'écran du MJ (re)démarre : une fenêtre joueurs déjà ouverte se signale par un `ping`. */
  | { type: 'hello' }
  /**
   * Lance une vidéo par-dessus la battlemap, en remplaçant celle en cours (VID-06, TRD §9.1).
   * `videoId` : nœud de bibliothèque (repris dans les réponses) ; `mediaId` : fichier à lire ;
   * `volume` de 0 à 1.
   */
  | { type: 'play-video'; videoId: Id; mediaId: Id; volume: number }
  | { type: 'pause-video' }
  | { type: 'resume-video' }
  /** Arrête la vidéo en cours : la battlemap réapparaît. */
  | { type: 'stop-video' }
  /** Volume de la vidéo en cours, réglé à la main par le MJ (0 à 1, non enregistré). */
  | { type: 'video-volume'; volume: number }
  // Joueurs → MJ
  /** La fenêtre joueurs s'ouvre (ou répond à `hello`) et demande l'état courant. */
  | { type: 'ping' }
  /** La fenêtre joueurs se ferme ou se recharge. */
  | { type: 'bye' }
  /** État de la vidéo : au démarrage, à chaque pause / reprise ou changement de volume, puis chaque seconde. */
  | {
      type: 'video-state';
      videoId: Id;
      positionMs: number;
      /** 0 si la durée n'est pas connue. */
      durationMs: number;
      paused: boolean;
      muted: boolean;
      volume: number;
    }
  /** La vidéo est finie ou a été arrêtée (`stop-video`, `clear`). */
  | { type: 'video-ended'; videoId: Id }
  /** Fichier introuvable ou illisible : rien n'est affiché. */
  | { type: 'video-error'; videoId: Id }
  /** Lecture avec le son refusée par le navigateur : la vidéo passe muette (TEC-47, VID-12). */
  | { type: 'video-muted'; videoId: Id };

/** Canal de messages, sur le modèle de `BroadcastChannel`. */
export interface PlayerChannel {
  postMessage(message: PlayerMessage): void;
  onmessage: ((event: MessageEvent<PlayerMessage>) => void) | null;
  close(): void;
}

/** Nom du canal d'un projet (TRD §9). */
export function playerChannelName(projectId: Id): string {
  return `jdr-manager:${projectId}`;
}

/** Ouvre le canal d'un projet (remplacé par un canal en mémoire dans les tests). */
export const PLAYER_CHANNEL_FACTORY = new InjectionToken<(projectId: Id) => PlayerChannel>(
  'PLAYER_CHANNEL_FACTORY',
  {
    providedIn: 'root',
    factory: () => (projectId) =>
      new BroadcastChannel(playerChannelName(projectId)) as unknown as PlayerChannel,
  },
);

/** Adresse de la fenêtre joueurs d'un projet. */
export function playerWindowUrl(projectId: Id): string {
  return `/projects/${projectId}/player`;
}
