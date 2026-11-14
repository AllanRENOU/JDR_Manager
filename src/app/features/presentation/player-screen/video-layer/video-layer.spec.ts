import { TestBed } from '@angular/core/testing';

import { useFakeAudio } from '../../../../../testing/fake-audio';
import { VideoLayer, VideoReport } from './video-layer';

describe('VideoLayer', () => {
  const audio = useFakeAudio();

  beforeEach(() => TestBed.configureTestingModule({ providers: [...audio.providers] }));

  const flush = () => new Promise((resolve) => setTimeout(resolve));

  async function render() {
    const fixture = TestBed.createComponent(VideoLayer);
    const reports: VideoReport[] = [];
    fixture.componentInstance.report.subscribe((r) => reports.push(r));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const video = el.querySelector('video')!;
    const layer = fixture.componentInstance;
    const play = async (videoId = 'v1', mediaId = 'm-v1', volume = 0.8) => {
      layer.handle({ type: 'play-video', videoId, mediaId, volume });
      await flush();
      await fixture.whenStable();
    };
    return { fixture, video, layer, reports, play };
  }

  const shown = (video: HTMLVideoElement) => video.classList.contains('video--shown');
  const types = (reports: VideoReport[]) => reports.map((r) => r.type);

  it('joue la vidéo avec le son par-dessus la battlemap et renvoie son état (VID-06, TEC-44)', async () => {
    const { video, reports, play } = await render();
    expect(shown(video)).toBe(false);

    await play();
    expect(shown(video)).toBe(true);
    expect(video.getAttribute('src')).toBe('blob:m-v1');
    expect(video.volume).toBe(0.8);
    expect(video.muted).toBe(false);
    expect(video.controls).toBe(false);
    expect(audio.acquired).toEqual(['m-v1']);
    expect(reports.at(-1)).toMatchObject({
      type: 'video-state',
      videoId: 'v1',
      paused: false,
      muted: false,
      volume: 0.8,
    });
  });

  it('pause, reprise et volume commandés par le MJ', async () => {
    const { layer, video, reports, play } = await render();
    await play();
    layer.handle({ type: 'pause-video' });
    expect(video.paused).toBe(true);
    layer.handle({ type: 'resume-video' });
    await flush();
    expect(video.paused).toBe(false);
    layer.handle({ type: 'video-volume', volume: 0.3 });
    expect(video.volume).toBe(0.3);
    expect(reports.at(-1)).toMatchObject({ type: 'video-state', volume: 0.3 });
  });

  it('envoie l’état chaque seconde pendant la lecture (temps restant, CTL-13)', async () => {
    // Avec de faux minuteurs, whenStable() ne se termine pas : detectChanges() à la place.
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(VideoLayer);
      const reports: VideoReport[] = [];
      fixture.componentInstance.report.subscribe((r) => reports.push(r));
      fixture.detectChanges();
      fixture.componentInstance.handle({
        type: 'play-video',
        videoId: 'v1',
        mediaId: 'm-v1',
        volume: 1,
      });
      await vi.advanceTimersByTimeAsync(0);
      const before = reports.length;
      expect(before).toBeGreaterThan(0);
      await vi.advanceTimersByTimeAsync(3000);
      expect(reports.length - before).toBe(3);
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('fin de la vidéo ou « Arrêter » : la battlemap réapparaît, l’URL est libérée (VID-09)', async () => {
    const { fixture, layer, video, reports, play } = await render();
    await play();
    video.dispatchEvent(new Event('ended'));
    await fixture.whenStable();
    expect(shown(video)).toBe(false);
    expect(video.hasAttribute('src')).toBe(false);
    expect(reports.at(-1)).toEqual({ type: 'video-ended', videoId: 'v1' });
    expect(audio.released).toEqual(['m-v1']);

    await play('v2', 'm-v2');
    layer.handle({ type: 'stop-video' });
    await fixture.whenStable();
    expect(shown(video)).toBe(false);
    expect(reports.at(-1)).toEqual({ type: 'video-ended', videoId: 'v2' });
  });

  it('une nouvelle vidéo remplace celle en cours, sans fin signalée pour l’ancienne', async () => {
    const { video, reports, play } = await render();
    await play('v1', 'm-v1');
    await play('v2', 'm-v2');
    expect(video.getAttribute('src')).toBe('blob:m-v2');
    expect(types(reports)).not.toContain('video-ended');
    expect(audio.released).toEqual(['m-v1']);
  });

  it('son refusé par le navigateur : vidéo muette, MJ prévenu ; un clic rend le son (TEC-47, VID-12)', async () => {
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    play.mockImplementationOnce(() =>
      Promise.reject(new DOMException('Lecture refusée', 'NotAllowedError')),
    );
    const rendered = await render();
    await rendered.play();
    expect(rendered.video.muted).toBe(true);
    expect(shown(rendered.video)).toBe(true);
    expect(types(rendered.reports)).toEqual(['video-muted', 'video-state']);
    expect(rendered.reports.at(-1)).toMatchObject({ muted: true });

    document.dispatchEvent(new Event('pointerdown'));
    expect(rendered.video.muted).toBe(false);
    expect(rendered.reports.at(-1)).toMatchObject({ type: 'video-state', muted: false });
  });

  it('fichier introuvable ou illisible : rien n’est affiché, le MJ est prévenu', async () => {
    const { fixture, video, reports, play } = await render();
    await play('v1', 'absent-v1');
    expect(shown(video)).toBe(false);
    expect(reports).toEqual([{ type: 'video-error', videoId: 'v1' }]);

    await play('v2', 'm-v2');
    video.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(shown(video)).toBe(false);
    expect(reports.at(-1)).toEqual({ type: 'video-error', videoId: 'v2' });
  });
});
