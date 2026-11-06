import { TestBed } from '@angular/core/testing';

import { stubObjectUrls } from '../../../testing/object-url';
import { AUDIO_DURATION_TIMEOUT, AudioDuration } from './audio-duration';

describe('AudioDuration', () => {
  const objectUrls = stubObjectUrls();
  let audio: HTMLAudioElement;
  let duration: number;

  beforeEach(() => {
    duration = Number.NaN;
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = create(tag);
      if (tag === 'audio') {
        audio = element as HTMLAudioElement;
        Object.defineProperty(audio, 'duration', { get: () => duration });
      }
      return element;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const read = () => TestBed.inject(AudioDuration).read(new Blob(['son'], { type: 'audio/ogg' }));

  it('lit la durée dans les métadonnées et libère l’URL', async () => {
    const pending = read();
    expect(audio.preload).toBe('metadata');
    expect(audio.getAttribute('src')).toMatch(/^blob:/);
    duration = 187.4;
    audio.dispatchEvent(new Event('loadedmetadata'));
    expect(await pending).toBe(187_400);
    expect(objectUrls.revokeObjectURL).toHaveBeenCalledWith('blob:test/1');
    expect(audio.hasAttribute('src')).toBe(false);
  });

  it('renvoie null si la durée est inconnue ou le fichier illisible', async () => {
    const infinite = read();
    duration = Number.POSITIVE_INFINITY;
    audio.dispatchEvent(new Event('loadedmetadata'));
    expect(await infinite).toBeNull();

    const broken = read();
    audio.dispatchEvent(new Event('error'));
    expect(await broken).toBeNull();
  });

  it('abandonne après le délai maximal', async () => {
    vi.useFakeTimers();
    const pending = read();
    vi.advanceTimersByTime(AUDIO_DURATION_TIMEOUT);
    expect(await pending).toBeNull();
    vi.useRealTimers();
  });
});
