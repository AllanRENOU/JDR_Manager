import { TestBed } from '@angular/core/testing';

import { aSoundNode } from '../../../testing/data-builders';
import { DATA_REPOSITORY, DataRepository } from '../../core/data/data-repository';
import { MediaUrls } from '../../core/media/media-urls';
import { SoundPreview } from './sound-preview';

describe('SoundPreview', () => {
  let audios: HTMLAudioElement[];
  let play: ReturnType<typeof vi.fn>;
  let preview: SoundPreview;
  const getMediaUrl = vi.fn((id: string) => Promise.resolve(`url:${id}`));

  beforeEach(() => {
    audios = [];
    play = vi.fn(() => Promise.resolve());
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = create(tag);
      if (tag === 'audio') {
        const audio = element as HTMLAudioElement;
        audio.play = play as unknown as () => Promise<void>;
        audio.pause = vi.fn();
        Object.defineProperty(audio, 'duration', { value: 20 });
        audios.push(audio);
      }
      return element;
    });
    TestBed.configureTestingModule({
      providers: [
        SoundPreview,
        { provide: DATA_REPOSITORY, useValue: { getMediaUrl } as Partial<DataRepository> },
      ],
    });
    preview = TestBed.inject(SoundPreview);
  });

  afterEach(() => vi.restoreAllMocks());

  const urls = () => TestBed.inject(MediaUrls);

  it('joue un son, suit sa progression et s’arrête à la fin en libérant le fichier', async () => {
    const sound = aSoundNode('global', { mediaId: 'm1' });
    await preview.play(sound);
    expect(preview.playingId()).toBe(sound.id);
    expect(audios[0].getAttribute('src')).toBe('url:m1');
    expect(play).toHaveBeenCalled();
    expect(urls().usageCount('m1')).toBe(1);

    Object.defineProperty(audios[0], 'currentTime', { value: 5, configurable: true });
    audios[0].dispatchEvent(new Event('timeupdate'));
    expect(preview.progress()).toBe(0.25);

    audios[0].dispatchEvent(new Event('ended'));
    expect(preview.playingId()).toBeNull();
    expect(preview.progress()).toBe(0);
    expect(urls().usageCount('m1')).toBe(0);
  });

  it('un seul son à la fois ; un second clic sur le même son l’arrête', async () => {
    const rain = aSoundNode('global', { mediaId: 'm1' });
    const wind = aSoundNode('global', { mediaId: 'm2' });
    await preview.toggle(rain);
    await preview.toggle(wind);
    expect(preview.playingId()).toBe(wind.id);
    expect(audios[0].pause).toHaveBeenCalled();
    expect(urls().usageCount('m1')).toBe(0);

    await preview.toggle(wind);
    expect(preview.playingId()).toBeNull();
    expect(urls().usageCount('m2')).toBe(0);
  });

  it('remonte l’erreur si le navigateur refuse la lecture, sans rester « en cours »', async () => {
    play.mockRejectedValueOnce(new DOMException('refus', 'NotAllowedError'));
    await expect(preview.play(aSoundNode('global', { mediaId: 'm1' }))).rejects.toThrow('refus');
    expect(preview.playingId()).toBeNull();
    expect(urls().usageCount('m1')).toBe(0);
  });
});
