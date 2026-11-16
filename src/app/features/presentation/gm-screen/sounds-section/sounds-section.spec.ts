import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  seedVideo,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { AudioPlayer } from '../../audio/audio-player';
import { PlayerMessage } from '../../player-screen/player-channel';
import { PlayerVideo } from '../player-video';
import { SoundsSection } from './sounds-section';

describe('SoundsSection', () => {
  usePresentation();

  it('sons en cours, bouton global lecture / pause, « Lancer un son » (10.5.5 à 10.5.7)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(SoundsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.section__summary')?.textContent).toContain('1 en cours');
    expect(el.querySelectorAll('app-sound-card')).toHaveLength(1);

    const global = () => el.querySelector('[sectionAction]') as HTMLButtonElement;
    expect(global().getAttribute('aria-label')).toBe('Tout mettre en pause');
    global().click();
    await fixture.whenStable();
    expect(engine.anyPlaying()).toBe(false);
    expect(global().getAttribute('aria-label')).toBe('Tout reprendre');
    global().click();
    await vi.waitFor(() => expect(engine.anyPlaying()).toBe(true));

    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Lancer un son ou une vidéo'))!
      .click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-selection-dialog .tree__row')).not.toBeNull();
    });
    const dialog = document.querySelector('app-selection-dialog') as HTMLElement;
    const rows = [...dialog.querySelectorAll<HTMLElement>('.tree__row')];
    expect(rows.map((r) => r.textContent?.trim())).toEqual([
      'Ce projet',
      'Taverne',
      'Bibliothèque globale',
      'Pluie',
    ]);
    rows[3].click();
    TestBed.tick();
    [...dialog.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Lancer')!
      .click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('app-sound-card')).toHaveLength(2);
    });
    expect(engine.sounds().map((s) => s.soundId)).toEqual(['taverne', 'pluie']);
  });

  it('vidéo lancée à la main : carte en tête, résumé, sons estompés et coupés (CTL-13, Brief §6.12)', async () => {
    await seedPresentation();
    await seedVideo({ order: 5 });
    const posted: PlayerMessage[] = [];
    TestBed.inject(PlayerVideo).attach({ post: (m) => posted.push(m), open: signal(true) });
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(SoundsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    [...el.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Lancer un son ou une vidéo'))!
      .click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-selection-dialog .tree__row')).not.toBeNull();
    });
    const dialog = document.querySelector('app-selection-dialog') as HTMLElement;
    const rows = [...dialog.querySelectorAll<HTMLElement>('.tree__row')];
    expect(rows.map((r) => r.textContent?.trim())).toEqual([
      'Ce projet',
      'Taverne',
      'Bibliothèque globale',
      'Pluie',
      'Intro',
    ]);
    rows[4].click();
    TestBed.tick();
    [...dialog.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Lancer')!
      .click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-video-card')).not.toBeNull();
    });
    expect(posted).toEqual([
      { type: 'play-video', videoId: 'intro', mediaId: 'm-intro', volume: 1 },
    ]);
    expect(el.querySelector('.content')?.firstElementChild?.tagName).toBe('APP-VIDEO-CARD');
    expect(el.querySelector('.section__summary')?.textContent).toContain(
      '1 en cours · vidéo en cours',
    );
    expect(el.querySelector('app-sound-card')?.classList).toContain('ducked');
    expect(TestBed.inject(AudioPlayer).ducked()).toBe(true);

    engine.showBattlemap('b2');
    await fixture.whenStable();
    expect(el.querySelector('app-video-card')).toBeNull();
    expect(el.querySelector('app-sound-card')?.classList).not.toContain('ducked');
    expect(el.querySelector('.section__summary')?.textContent).not.toContain('vidéo');
  });

  it('seule une vidéo passe : le bouton global est affiché et la met en pause (VID-10)', async () => {
    await seedPresentation([]);
    await seedVideo({ order: 5 });
    TestBed.inject(PlayerVideo).attach({ post: () => undefined, open: signal(true) });
    const engine = await startPresentation();
    for (const sound of engine.sounds()) {
      engine.pauseSound(sound.soundId);
    }
    engine.playLibraryVideo('intro');
    const fixture = TestBed.createComponent(SoundsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const global = el.querySelector('[sectionAction]') as HTMLButtonElement;
    expect(global.getAttribute('aria-label')).toBe('Tout mettre en pause');
    global.click();
    await fixture.whenStable();
    expect(engine.video()?.paused).toBe(true);
  });
});
