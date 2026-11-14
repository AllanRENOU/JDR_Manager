import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { useFakeAudio } from '../../../../testing/fake-audio';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { AudioPlayer } from '../audio/audio-player';
import { PlayerMessage } from '../player-screen/player-channel';
import { PlayerVideo, VideoRequest } from './player-video';

describe('PlayerVideo', () => {
  const audio = useFakeAudio();
  let video: PlayerVideo;
  let posted: PlayerMessage[];
  const open = signal(true);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [PlayerVideo, ...audio.providers],
    });
    video = TestBed.inject(PlayerVideo);
    posted = [];
    open.set(true);
    video.attach({ post: (message) => posted.push(message), open });
  });

  const intro: VideoRequest = { videoId: 'v1', mediaId: 'm-v1', name: 'Intro', volume: 0.8 };
  const ducked = () => TestBed.inject(AudioPlayer).ducked();
  const notifications = () =>
    TestBed.inject(Notifications)
      .notifications()
      .map((n) => n.message);
  const state = (overrides: Partial<Extract<PlayerMessage, { type: 'video-state' }>> = {}) =>
    ({
      type: 'video-state',
      videoId: 'v1',
      positionMs: 2000,
      durationMs: 60000,
      paused: false,
      muted: false,
      volume: 0.8,
      ...overrides,
    }) as const;

  it('lance la vidéo dans la fenêtre joueurs et coupe les sons (VID-06, VID-08)', () => {
    expect(video.play(intro)).toBe(true);
    expect(posted).toEqual([{ type: 'play-video', videoId: 'v1', mediaId: 'm-v1', volume: 0.8 }]);
    expect(video.video()).toEqual({
      videoId: 'v1',
      name: 'Intro',
      positionMs: 0,
      durationMs: 0,
      paused: false,
      muted: false,
      volume: 0.8,
    });
    expect(ducked()).toBe(true);
  });

  it('fenêtre joueurs fermée : rien n’est lancé (VID-07)', () => {
    open.set(false);
    expect(video.play(intro)).toBe(false);
    expect(posted).toEqual([]);
    expect(video.video()).toBeNull();
    expect(ducked()).toBe(false);
  });

  it('suit l’état renvoyé par la fenêtre joueurs ; ignore celui d’une vidéo remplacée (TEC-45)', () => {
    video.play(intro);
    video.receive(state());
    expect(video.video()).toMatchObject({ positionMs: 2000, durationMs: 60000 });
    video.play({ ...intro, videoId: 'v2', name: 'Fin' });
    video.receive(state({ positionMs: 9000 }));
    video.receive({ type: 'video-ended', videoId: 'v1' });
    expect(video.video()).toMatchObject({ videoId: 'v2', positionMs: 0 });
    expect(ducked()).toBe(true);
  });

  it('pause et reprise : les sons restent coupés pendant la pause (décision d’Allan)', () => {
    video.play(intro);
    video.pause();
    video.pause();
    expect(video.video()?.paused).toBe(true);
    expect(ducked()).toBe(true);
    video.resume();
    expect(video.video()?.paused).toBe(false);
    expect(posted.slice(1)).toEqual([{ type: 'pause-video' }, { type: 'resume-video' }]);
  });

  it('volume réglé à la main, entre 0 et 1 (CTL-13)', () => {
    video.play(intro);
    video.setVolume(1.5);
    expect(posted.at(-1)).toEqual({ type: 'video-volume', volume: 1 });
    expect(video.video()?.volume).toBe(1);
  });

  it('arrêt, fin ou fermeture de la fenêtre : plus de vidéo, les sons reviennent (VID-09)', () => {
    video.play(intro);
    video.stop();
    expect(posted.at(-1)).toEqual({ type: 'stop-video' });
    expect(video.video()).toBeNull();
    expect(ducked()).toBe(false);

    video.stop();
    expect(posted.filter((m) => m.type === 'stop-video')).toHaveLength(1);

    video.play(intro);
    video.receive({ type: 'video-ended', videoId: 'v1' });
    expect(video.video()).toBeNull();
    expect(ducked()).toBe(false);

    video.play(intro);
    video.end();
    expect(video.video()).toBeNull();
    expect(ducked()).toBe(false);
  });

  it('fichier illisible : message d’erreur, les sons reviennent', () => {
    video.play(intro);
    video.receive({ type: 'video-error', videoId: 'v1' });
    expect(video.video()).toBeNull();
    expect(ducked()).toBe(false);
    expect(notifications()).toEqual(['La vidéo n’a pas pu être lue dans la fenêtre joueurs.']);
  });

  it('son refusé par le navigateur : vidéo muette et demande de clic au MJ (VID-12)', () => {
    video.play(intro);
    video.receive({ type: 'video-muted', videoId: 'v1' });
    expect(video.video()?.muted).toBe(true);
    expect(notifications()).toEqual([
      'La vidéo passe sans le son : cliquez une fois dans la fenêtre joueurs pour l’autoriser.',
    ]);
  });
});
