import { TestBed } from '@angular/core/testing';

import { useFakeAudio } from '../../../../testing/fake-audio';
import { AudioPlayer, DEFAULT_FADE_OUT_MS, PAUSE_FADE_MS, SoundRequest } from './audio-player';

describe('AudioPlayer', () => {
  const audio = useFakeAudio();
  let player: AudioPlayer;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    TestBed.configureTestingModule({ providers: audio.providers });
    player = TestBed.inject(AudioPlayer);
  });
  afterEach(() => vi.useRealTimers());

  const request = (overrides: Partial<SoundRequest> = {}): SoundRequest => ({
    soundId: 'pluie',
    mediaId: 'son-pluie',
    elementId: 'e1',
    volume: 0.6,
    loop: true,
    fadeInMs: 1500,
    fadeOutMs: 3000,
    ...overrides,
  });
  const play = () => vi.mocked(HTMLMediaElement.prototype.play);

  it('un seul AudioContext, créé puis repris au premier clic (9.4.2, TEC-43)', async () => {
    await player.unlock();
    await player.unlock();
    await player.play(request());
    expect(audio.contexts).toHaveLength(1);
    expect(audio.contexts[0].resume).toHaveBeenCalledTimes(1);
    expect(audio.contexts[0].state).toBe('running');
  });

  it('lecture : <audio> relié à un GainNode, boucle, volume, fondu en entrée (9.4.3, 9.4.4)', async () => {
    expect(await player.play(request())).toBe(true);
    const [element] = audio.elements;
    expect(element.src).toBe('blob:son-pluie');
    expect(element.loop).toBe(true);
    expect(play()).toHaveBeenCalledTimes(1);
    expect(audio.gains[0].gain.ramps).toEqual([{ target: 0.6, endTime: 1.5 }]);
    expect(player.sounds()).toEqual([
      { soundId: 'pluie', elementId: 'e1', paused: false, volume: 0.6, loop: true },
    ]);
    expect(player.anyPlaying()).toBe(true);
  });

  it('fichier introuvable : rien n’est lancé (PRS-07)', async () => {
    expect(await player.play(request({ mediaId: 'absent' }))).toBe(false);
    expect(player.sounds()).toEqual([]);
    expect(audio.elements).toEqual([]);
  });

  it('arrêt : fondu de sortie de l’élément, puis pause et libération (9.4.4)', async () => {
    await player.play(request());
    const [element] = audio.elements;
    player.stop('pluie');
    expect(player.sounds()).toEqual([]);
    expect(audio.gains[0].gain.ramps.at(-1)).toEqual({ target: 0, endTime: 3 });
    expect(element.paused).toBe(false);
    await vi.advanceTimersByTimeAsync(3000);
    expect(element.paused).toBe(true);
    expect(audio.gains[0].disconnect).toHaveBeenCalled();
    expect(audio.released).toEqual(['son-pluie']);
  });

  it('arrêter tout : chaque son avec son fondu, défaut pour un son lancé à la main', async () => {
    await player.play(request());
    await player.play(request({ soundId: 'cloche', mediaId: 'son-cloche', elementId: null }));
    player.stopAll();
    expect(player.sounds()).toEqual([]);
    expect(audio.gains[0].gain.ramps.at(-1)?.endTime).toBe(3);
    expect(audio.gains[1].gain.ramps.at(-1)?.endTime).toBe(DEFAULT_FADE_OUT_MS / 1000);
  });

  it('pause / reprise d’un son et volume en direct (9.4.5)', async () => {
    await player.play(request());
    const [element] = audio.elements;
    const gain = audio.gains[0].gain;
    player.pause('pluie');
    expect(player.sounds()[0].paused).toBe(true);
    expect(gain.value).toBe(0);
    await vi.advanceTimersByTimeAsync(PAUSE_FADE_MS);
    expect(element.paused).toBe(true);

    player.setVolume('pluie', 0.3);
    expect(gain.value).toBe(0);
    await player.resume('pluie');
    expect(element.paused).toBe(false);
    expect(gain.value).toBe(0.3);
    expect(player.sounds()[0]).toMatchObject({ paused: false, volume: 0.3 });

    player.setVolume('pluie', 1.4);
    expect(gain.value).toBe(1);
  });

  it('une reprise juste après la pause annule l’arrêt programmé', async () => {
    await player.play(request());
    const [element] = audio.elements;
    player.pause('pluie');
    await player.resume('pluie');
    await vi.advanceTimersByTimeAsync(PAUSE_FADE_MS);
    expect(element.paused).toBe(false);
  });

  it('pause / reprise globales et anyPlaying (9.4.6)', async () => {
    await player.play(request());
    await player.play(request({ soundId: 'cloche', mediaId: 'son-cloche' }));
    player.pause('cloche');
    expect(player.anyPlaying()).toBe(true);
    player.pauseAll();
    expect(player.anyPlaying()).toBe(false);
    expect(player.sounds().every((s) => s.paused)).toBe(true);
    await player.resumeAll();
    expect(player.anyPlaying()).toBe(true);
    expect(player.sounds().every((s) => !s.paused)).toBe(true);
  });

  it('relance d’un son restauré : depuis le début, avec son volume et sa pause (9.4.7)', async () => {
    expect(await player.play(request(), { paused: true, volume: 0.25 })).toBe(true);
    expect(play()).not.toHaveBeenCalled();
    expect(audio.elements[0].currentTime).toBe(0);
    expect(player.sounds()[0]).toMatchObject({ paused: true, volume: 0.25 });
    await player.resume('pluie');
    expect(audio.gains[0].gain.value).toBe(0.25);
  });

  it('relancer un son déjà en cours remplace la lecture', async () => {
    await player.play(request());
    await player.play(request({ volume: 0.9 }));
    expect(player.sounds()).toHaveLength(1);
    expect(player.sounds()[0].volume).toBe(0.9);
    expect(audio.elements[0].paused).toBe(true);
  });

  it('un son sans boucle disparaît de la liste à la fin du fichier ; les changements sont notifiés', async () => {
    const changes = vi.fn();
    const unsubscribe = player.onChange(changes);
    await player.play(request({ loop: false }));
    expect(changes).toHaveBeenCalled();
    audio.elements[0].dispatchEvent(new Event('ended'));
    expect(player.sounds()).toEqual([]);
    unsubscribe();
    changes.mockClear();
    await player.play(request());
    expect(changes).not.toHaveBeenCalled();
  });
});
