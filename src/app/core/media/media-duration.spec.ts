import { TestBed } from '@angular/core/testing';

import { stubObjectUrls } from '../../../testing/object-url';
import { MEDIA_DURATION_TIMEOUT, MediaDuration } from './media-duration';

describe('MediaDuration', () => {
  const objectUrls = stubObjectUrls();
  let media: HTMLMediaElement;
  let tags: string[];
  let duration: number;

  beforeEach(() => {
    duration = Number.NaN;
    tags = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = create(tag);
      if (tag === 'audio' || tag === 'video') {
        tags.push(tag);
        media = element as HTMLMediaElement;
        Object.defineProperty(media, 'duration', { get: () => duration });
      }
      return element;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const read = (type = 'audio/ogg') =>
    TestBed.inject(MediaDuration).read(new Blob(['média'], { type }));

  it('lit la durée d’un son dans les métadonnées et libère l’URL', async () => {
    const pending = read();
    expect(tags).toEqual(['audio']);
    expect(media.preload).toBe('metadata');
    expect(media.getAttribute('src')).toMatch(/^blob:/);
    duration = 187.4;
    media.dispatchEvent(new Event('loadedmetadata'));
    expect(await pending).toBe(187_400);
    expect(objectUrls.revokeObjectURL).toHaveBeenCalledWith('blob:test/1');
    expect(media.hasAttribute('src')).toBe(false);
  });

  it('lit la durée d’une vidéo avec un élément <video> (VID-01)', async () => {
    const pending = read('video/mp4');
    expect(tags).toEqual(['video']);
    duration = 5095.2;
    media.dispatchEvent(new Event('loadedmetadata'));
    expect(await pending).toBe(5_095_200);
  });

  it('renvoie null si la durée est inconnue ou le fichier illisible', async () => {
    const infinite = read();
    duration = Number.POSITIVE_INFINITY;
    media.dispatchEvent(new Event('loadedmetadata'));
    expect(await infinite).toBeNull();

    const broken = read();
    media.dispatchEvent(new Event('error'));
    expect(await broken).toBeNull();
  });

  it('abandonne après le délai maximal', async () => {
    vi.useFakeTimers();
    const pending = read();
    vi.advanceTimersByTime(MEDIA_DURATION_TIMEOUT);
    expect(await pending).toBeNull();
    vi.useRealTimers();
  });
});
