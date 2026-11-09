import { InjectionToken, Service, computed, inject, signal } from '@angular/core';

import { Id } from '../../../core/models';
import { MediaUrls } from '../../../core/media/media-urls';

/** Fabrique de l'`AudioContext` (remplacée par un faux contexte dans les tests). */
export const AUDIO_CONTEXT_FACTORY = new InjectionToken<() => AudioContext>(
  'AUDIO_CONTEXT_FACTORY',
  { providedIn: 'root', factory: () => () => new AudioContext() },
);

/** Fondu de sortie d'un son lancé à la main (sans élément), au changement de scène (TRD §7). */
export const DEFAULT_FADE_OUT_MS = 1000;
/** Courte rampe de la pause / reprise d'un son (évite le « clic »). */
export const PAUSE_FADE_MS = 200;

/** Paramètres de lecture d'un son : ceux de l'élément « Lancer un son », ou par défaut. */
export interface SoundRequest {
  soundId: Id;
  /** Média du `SoundNode`. */
  mediaId: Id;
  /** Élément `play-sound` d'origine ; `null` = lancé à la main par le MJ. */
  elementId: Id | null;
  /** Volume de 0 à 1. */
  volume: number;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
}

/** Son en cours, exposé aux contrôles du MJ et à la sauvegarde de la partie. */
export interface ActiveSound {
  soundId: Id;
  elementId: Id | null;
  paused: boolean;
  /** Volume courant (0 à 1), réglable en direct (CTL-09). */
  volume: number;
  loop: boolean;
}

interface Track {
  request: SoundRequest;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  /** Pause ou arrêt programmé à la fin d'une rampe. */
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * Lecteur audio de la Présentation (TRD §7, TEC-40 à TEC-43) : un `<audio>` par son, relié à
 * Web Audio (`MediaElementAudioSourceNode` → `GainNode` → sortie) ; le fichier n'est jamais
 * décodé en entier. Un seul `AudioContext` pour l'application, créé ou repris au premier clic
 * (`unlock()`). Un même son ne joue qu'une fois à la fois : le relancer remplace la lecture.
 */
@Service()
export class AudioPlayer {
  private readonly mediaUrls = inject(MediaUrls);
  private readonly createContext = inject(AUDIO_CONTEXT_FACTORY);

  private context: AudioContext | null = null;
  private readonly tracks = new Map<Id, Track>();
  private readonly listeners = new Set<() => void>();
  private readonly state = signal<readonly ActiveSound[]>([]);

  /** Sons en cours (dans l'ordre de lancement), en pause ou non. */
  readonly sounds = this.state.asReadonly();
  /** Au moins un son joue : le bouton global affiche « Pause » (CTL-10). */
  readonly anyPlaying = computed(() => this.sounds().some((s) => !s.paused));

  /** Crée ou reprend l'`AudioContext` ; à appeler sur un clic de l'utilisateur (TEC-43). */
  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  /** Appelé à chaque changement de `sounds` (sauvegarde de la partie). Renvoie le désabonnement. */
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Lance un son avec son fondu en entrée ; `paused` le prépare sans le jouer (reprise d'une
   * partie, PRS-05). Renvoie `false` si le fichier est introuvable (son supprimé, PRS-07).
   */
  async play(
    request: SoundRequest,
    options: { paused?: boolean; volume?: number } = {},
  ): Promise<boolean> {
    let url: string;
    try {
      url = await this.mediaUrls.acquire(request.mediaId);
    } catch {
      return false;
    }
    this.release(request.soundId, 0);
    const context = this.ensureContext();
    const audio = new Audio();
    audio.src = url;
    audio.loop = request.loop;
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    source.connect(gain).connect(context.destination);
    gain.gain.setValueAtTime(0, context.currentTime);

    const volume = options.volume ?? request.volume;
    const track: Track = { request, audio, source, gain };
    this.tracks.set(request.soundId, track);
    audio.addEventListener('ended', () => {
      if (this.tracks.get(request.soundId) === track && !audio.loop) {
        this.release(request.soundId, 0);
        this.publish();
      }
    });
    this.setState(request.soundId, {
      soundId: request.soundId,
      elementId: request.elementId,
      paused: options.paused ?? false,
      volume,
      loop: request.loop,
    });
    if (!options.paused) {
      await this.start(track, volume, request.fadeInMs);
    }
    return true;
  }

  /** Arrête un son avec son fondu de sortie (ou `fadeMs`), puis libère ses ressources (ACT-06). */
  stop(soundId: Id, fadeMs?: number): void {
    const track = this.tracks.get(soundId);
    if (!track) {
      return;
    }
    this.release(soundId, fadeMs ?? this.fadeOutOf(track));
    this.publish();
  }

  /** Arrête tous les sons, chacun avec son propre fondu de sortie (ACT-07, CTL-06). */
  stopAll(): void {
    for (const [soundId, track] of [...this.tracks]) {
      this.release(soundId, this.fadeOutOf(track));
    }
    this.publish();
  }

  /** Met un son en pause : courte rampe vers 0 puis `pause()` (CTL-08). */
  pause(soundId: Id): void {
    const track = this.tracks.get(soundId);
    const current = this.find(soundId);
    if (!track || !current || current.paused) {
      return;
    }
    this.ramp(track.gain, 0, PAUSE_FADE_MS);
    this.schedule(track, PAUSE_FADE_MS, () => track.audio.pause());
    this.setState(soundId, { ...current, paused: true });
  }

  /** Reprend un son en pause : `play()` puis remontée au volume courant (CTL-08). */
  async resume(soundId: Id): Promise<void> {
    const track = this.tracks.get(soundId);
    const current = this.find(soundId);
    if (!track || !current?.paused) {
      return;
    }
    this.setState(soundId, { ...current, paused: false });
    await this.start(track, current.volume, PAUSE_FADE_MS);
  }

  /** Volume en direct (0 à 1) d'un son en cours (CTL-09). */
  setVolume(soundId: Id, volume: number): void {
    const track = this.tracks.get(soundId);
    const current = this.find(soundId);
    if (!track || !current) {
      return;
    }
    const value = Math.min(1, Math.max(0, volume));
    if (!current.paused) {
      this.ramp(track.gain, value, PAUSE_FADE_MS / 4);
    }
    this.setState(soundId, { ...current, volume: value });
  }

  /** Bouton global (CTL-10) : tout en pause. */
  pauseAll(): void {
    for (const sound of this.sounds()) {
      this.pause(sound.soundId);
    }
  }

  /** Bouton global (CTL-10) : tout reprend. */
  async resumeAll(): Promise<void> {
    await Promise.all(this.sounds().map((sound) => this.resume(sound.soundId)));
  }

  private ensureContext(): AudioContext {
    this.context ??= this.createContext();
    return this.context;
  }

  /** Joue l'`<audio>` et monte le gain jusqu'au volume. */
  private async start(track: Track, volume: number, fadeMs: number): Promise<void> {
    clearTimeout(track.timer);
    try {
      await track.audio.play();
    } catch {
      // Lecture refusée (contexte pas encore débloqué) : le son reste listé, le MJ pourra le reprendre.
      return;
    }
    if (this.tracks.get(track.request.soundId) === track) {
      this.ramp(track.gain, volume, fadeMs);
    }
  }

  /** Retire le son de la liste ; l'arrêt effectif a lieu à la fin du fondu. */
  private release(soundId: Id, fadeMs: number): void {
    const track = this.tracks.get(soundId);
    if (!track) {
      return;
    }
    this.tracks.delete(soundId);
    this.state.update((sounds) => sounds.filter((s) => s.soundId !== soundId));
    this.ramp(track.gain, 0, fadeMs);
    const finish = () => {
      track.audio.pause();
      track.source.disconnect();
      track.gain.disconnect();
      this.mediaUrls.release(track.request.mediaId);
    };
    if (fadeMs > 0) {
      this.schedule(track, fadeMs, finish);
    } else {
      clearTimeout(track.timer);
      finish();
    }
  }

  private fadeOutOf(track: Track): number {
    return track.request.elementId === null ? DEFAULT_FADE_OUT_MS : track.request.fadeOutMs;
  }

  private ramp(gain: GainNode, target: number, ms: number): void {
    const now = this.ensureContext().currentTime;
    const param = gain.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    if (ms > 0) {
      param.linearRampToValueAtTime(target, now + ms / 1000);
    } else {
      param.setValueAtTime(target, now);
    }
  }

  private schedule(track: Track, ms: number, run: () => void): void {
    clearTimeout(track.timer);
    track.timer = setTimeout(run, ms);
  }

  private find(soundId: Id): ActiveSound | undefined {
    return this.sounds().find((s) => s.soundId === soundId);
  }

  private setState(soundId: Id, sound: ActiveSound): void {
    this.state.update((sounds) =>
      sounds.some((s) => s.soundId === soundId)
        ? sounds.map((s) => (s.soundId === soundId ? sound : s))
        : [...sounds, sound],
    );
    this.publish();
  }

  private publish(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
