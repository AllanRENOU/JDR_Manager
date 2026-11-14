import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { useFakeAudio } from '../../../../../testing/fake-audio';
import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { PlayerMessage } from '../../player-screen/player-channel';
import { PlayerVideo } from '../player-video';
import { VideoCard } from './video-card';

describe('VideoCard', () => {
  const audio = useFakeAudio();
  let posted: PlayerMessage[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [PlayerVideo, ...audio.providers],
    });
    posted = [];
    const video = TestBed.inject(PlayerVideo);
    video.attach({ post: (m) => posted.push(m), open: signal(true) });
    video.play({ videoId: 'v1', mediaId: 'm-v1', name: 'Intro', volume: 1 });
  });

  async function render() {
    const video = TestBed.inject(PlayerVideo);
    const fixture = TestBed.createComponent(VideoCard);
    fixture.componentRef.setInput('video', video.video());
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    /** Applique un état renvoyé par la fenêtre joueurs. */
    const report = async (state: Partial<Extract<PlayerMessage, { type: 'video-state' }>>) => {
      video.receive({
        type: 'video-state',
        videoId: 'v1',
        positionMs: 0,
        durationMs: 0,
        paused: false,
        muted: false,
        volume: 1,
        ...state,
      });
      fixture.componentRef.setInput('video', video.video());
      await fixture.whenStable();
    };
    const button = (label: string) =>
      el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    return { fixture, el, report, button, video };
  }

  it('nom, « Sons coupés », temps restant et avancement (CTL-13)', async () => {
    const { el, report } = await render();
    expect(el.textContent).toContain('Intro');
    expect(el.textContent).toContain('Vidéo en cours');
    expect(el.textContent).toContain('Sons coupés');
    // Durée pas encore connue : ni temps restant ni avancement.
    expect(el.querySelector('.head__time')).toBeNull();

    await report({ positionMs: 30_000, durationMs: 114_000 });
    expect(el.querySelector('.head__time')?.textContent).toContain('-1:24');
    expect((el.querySelector('.progress__bar') as HTMLElement).style.width).toBe('26%');
    expect(el.textContent).not.toContain('Muette');

    await report({ muted: true, paused: true });
    expect(el.textContent).toContain('Muette');
    expect(el.textContent).toContain('en pause');
  });

  it('Pause / Reprendre et Arrêter commandent la fenêtre joueurs', async () => {
    const { report, button, video } = await render();
    button('Mettre en pause la vidéo « Intro »').click();
    expect(posted.at(-1)).toEqual({ type: 'pause-video' });
    await report({ paused: true });
    button('Reprendre la vidéo « Intro »').click();
    expect(posted.at(-1)).toEqual({ type: 'resume-video' });

    button('Arrêter la vidéo « Intro »').click();
    expect(posted.at(-1)).toEqual({ type: 'stop-video' });
    expect(video.video()).toBeNull();
  });

  it('dépliée par un clic : curseur de volume, comme un son (décision d’Allan)', async () => {
    const { fixture, el, report } = await render();
    const head = el.querySelector('.head__main') as HTMLButtonElement;
    expect(el.querySelector('input[type="range"]')).toBeNull();
    head.click();
    await fixture.whenStable();
    expect(head.getAttribute('aria-expanded')).toBe('true');
    const range = el.querySelector('input[type="range"]') as HTMLInputElement;
    expect(range.getAttribute('aria-label')).toBe('Volume de la vidéo « Intro »');
    expect(el.querySelector('.volume__value')?.textContent).toBe('100 %');

    range.value = '40';
    range.dispatchEvent(new Event('input'));
    expect(posted.at(-1)).toEqual({ type: 'video-volume', volume: 0.4 });
    await report({ volume: 0.4 });
    expect(el.querySelector('.volume__value')?.textContent).toBe('40 %');
  });
});
