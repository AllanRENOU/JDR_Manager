import { Provider } from '@angular/core';

import { MediaUrls } from '../app/core/media/media-urls';
import { AUDIO_CONTEXT_FACTORY } from '../app/features/presentation/audio/audio-player';

/** `AudioParam` simulé : la valeur cible d'une rampe est appliquée tout de suite, et journalisée. */
export class FakeAudioParam {
  value = 1;
  readonly ramps: { target: number; endTime: number }[] = [];
  setValueAtTime(value: number): void {
    this.value = value;
  }
  linearRampToValueAtTime(value: number, endTime: number): void {
    this.ramps.push({ target: value, endTime });
    this.value = value;
  }
  cancelScheduledValues(): void {
    // Rien à annuler : les rampes sont immédiates.
  }
}

export interface FakeGainNode {
  gain: FakeAudioParam;
  connect<T>(node: T): T;
  disconnect: ReturnType<typeof vi.fn>;
}

/** Web Audio simulé : jsdom n'a ni `AudioContext` ni lecture réelle. */
export interface FakeAudio {
  /** Contextes créés (un seul attendu : TEC-43). */
  contexts: { state: AudioContextState; resume: ReturnType<typeof vi.fn> }[];
  /** Nœuds de gain créés, dans l'ordre (un par son lancé). */
  gains: FakeGainNode[];
  /** Éléments `<audio>` reliés à Web Audio, dans l'ordre. */
  elements: HTMLAudioElement[];
  /** Médias acquis / libérés via `MediaUrls`. */
  acquired: string[];
  released: string[];
  providers: Provider[];
}

/**
 * Fournit un faux `AudioContext` et un faux `MediaUrls` (les médias dont l'id commence par
 * `absent` sont introuvables), et espionne `play()` / `pause()` des éléments `<audio>`.
 */
export function useFakeAudio(): FakeAudio {
  const fake: FakeAudio = {
    contexts: [],
    gains: [],
    elements: [],
    acquired: [],
    released: [],
    providers: [],
  };
  beforeEach(() => {
    fake.contexts.length = 0;
    fake.gains.length = 0;
    fake.elements.length = 0;
    fake.acquired.length = 0;
    fake.released.length = 0;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      Object.defineProperty(this, 'paused', { value: false, configurable: true });
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      Object.defineProperty(this, 'paused', { value: true, configurable: true });
    });
  });
  afterEach(() => vi.restoreAllMocks());

  const createContext = () => {
    const context = {
      state: 'suspended' as AudioContextState,
      currentTime: 0,
      destination: {},
      resume: vi.fn(async () => {
        context.state = 'running';
      }),
      createGain: () => {
        const node: FakeGainNode = {
          gain: new FakeAudioParam(),
          connect: (target) => target,
          disconnect: vi.fn(),
        };
        fake.gains.push(node);
        return node;
      },
      createMediaElementSource: (element: HTMLAudioElement) => {
        fake.elements.push(element);
        return { connect: <T>(target: T) => target, disconnect: vi.fn() };
      },
    };
    fake.contexts.push(context);
    return context as unknown as AudioContext;
  };
  const mediaUrls = {
    acquire: async (mediaId: string) => {
      if (mediaId.startsWith('absent')) {
        throw new Error('media-not-found');
      }
      fake.acquired.push(mediaId);
      return `blob:${mediaId}`;
    },
    release: (mediaId: string) => fake.released.push(mediaId),
  };
  fake.providers.push(
    { provide: AUDIO_CONTEXT_FACTORY, useValue: createContext },
    { provide: MediaUrls, useValue: mediaUrls },
  );
  return fake;
}
