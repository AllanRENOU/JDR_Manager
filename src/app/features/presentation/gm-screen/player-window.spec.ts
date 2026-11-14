import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../testing/presentation-harness';
import { Theme } from '../../../core/theme/theme';
import { AudioPlayer } from '../audio/audio-player';
import { PLAYER_WINDOW_CHECK_MS, PlayerWindow } from './player-window';
import { PlayerVideo } from './player-video';

describe('PlayerWindow', () => {
  const { bus } = usePresentation();

  beforeEach(() => TestBed.configureTestingModule({ providers: [PlayerWindow] }));

  const flush = () => new Promise((resolve) => setTimeout(resolve));

  it('envoie la battlemap affichée et le thème ; répond au ping de la fenêtre joueurs (11.2, 11.4, 11.6)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    const player = bus.open('p1');
    const window = TestBed.inject(PlayerWindow);
    window.connect('p1');
    TestBed.tick();
    await flush();
    expect(bus.received(player)).toContainEqual({ type: 'hello' });
    expect(bus.received(player)).toContainEqual({
      type: 'show-battlemap',
      sceneId: 'A',
      battlemapId: 'b1',
    });

    player.postMessage({ type: 'ping' });
    await flush();
    expect(window.open()).toBe(true);
    expect(bus.received(player).slice(-2)).toEqual([
      { type: 'theme', theme: TestBed.inject(Theme).theme() },
      { type: 'show-battlemap', sceneId: 'A', battlemapId: 'b1' },
    ]);

    engine.showBattlemap('b2');
    TestBed.tick();
    await flush();
    expect(bus.received(player).at(-1)).toEqual({
      type: 'show-battlemap',
      sceneId: 'A',
      battlemapId: 'b2',
    });

    // Scène sans battlemap : écran noir.
    await engine.openScene('B');
    TestBed.tick();
    await flush();
    expect(bus.received(player).at(-1)).toEqual({ type: 'clear' });

    const theme = TestBed.inject(Theme);
    const other = theme.theme() === 'automne' ? 'nuit-doree' : 'automne';
    theme.setTheme(other);
    TestBed.tick();
    await flush();
    expect(bus.received(player).at(-1)).toEqual({ type: 'theme', theme: other });

    player.postMessage({ type: 'bye' });
    await flush();
    expect(window.open()).toBe(false);
  });

  it('ouvre la fenêtre par window.open et voit qu’elle a été fermée (11.1, 11.7)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const popup = { closed: false, focus: vi.fn() } as unknown as Window;
      const open = vi.spyOn(window, 'open').mockReturnValue(popup);
      const player = TestBed.inject(PlayerWindow);
      expect(player.openWindow()).toBe(false);
      player.connect('p1');
      expect(player.openWindow()).toBe(true);
      expect(open).toHaveBeenCalledWith('/projects/p1/player', 'jdr-manager-player-p1', 'popup');
      expect(player.open()).toBe(true);
      const video = TestBed.inject(PlayerVideo);
      video.play({ videoId: 'v1', mediaId: 'm-v1', name: 'Intro', volume: 1 });

      (popup as { closed: boolean }).closed = true;
      vi.advanceTimersByTime(PLAYER_WINDOW_CHECK_MS);
      expect(player.open()).toBe(false);
      // Fenêtre fermée : plus de vidéo, les sons reviennent (VID-09).
      expect(video.video()).toBeNull();

      open.mockReturnValue(null);
      expect(player.openWindow()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sert de canal aux vidéos ; fenêtre rechargée ou fermée : la vidéo est terminée (TRD §9.1)', async () => {
    const player = bus.open('p1');
    const window = TestBed.inject(PlayerWindow);
    const video = TestBed.inject(PlayerVideo);
    const intro = { videoId: 'v1', mediaId: 'm-v1', name: 'Intro', volume: 1 };
    window.connect('p1');
    TestBed.tick();
    // Pas encore de fenêtre joueurs : la vidéo n'est pas lancée.
    expect(video.play(intro)).toBe(false);

    player.postMessage({ type: 'ping' });
    await flush();
    expect(video.play(intro)).toBe(true);
    await flush();
    expect(bus.received(player).at(-1)).toEqual({
      type: 'play-video',
      videoId: 'v1',
      mediaId: 'm-v1',
      volume: 1,
    });
    player.postMessage({
      type: 'video-state',
      videoId: 'v1',
      positionMs: 5000,
      durationMs: 90000,
      paused: false,
      muted: false,
      volume: 1,
    });
    await flush();
    expect(video.video()).toMatchObject({ positionMs: 5000, durationMs: 90000 });
    player.postMessage({ type: 'video-ended', videoId: 'v1' });
    await flush();
    expect(video.video()).toBeNull();

    // Fenêtre rechargée : la vidéo n'est pas renvoyée, elle est terminée côté MJ.
    video.play(intro);
    player.postMessage({ type: 'ping' });
    await flush();
    expect(video.video()).toBeNull();
    expect(bus.received(player).at(-1)).not.toMatchObject({ type: 'play-video' });

    video.play(intro);
    player.postMessage({ type: 'bye' });
    await flush();
    expect(video.video()).toBeNull();
    expect(TestBed.inject(AudioPlayer).ducked()).toBe(false);
  });

  it('prévient la fenêtre joueurs quand l’écran du MJ est quitté (11.7)', async () => {
    const player = bus.open('p1');
    TestBed.inject(PlayerWindow).connect('p1');
    TestBed.tick();
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(bus.received(player).at(-1)).toEqual({ type: 'clear' });
  });
});
