import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
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
      .find((b) => b.textContent?.includes('Lancer un son'))!
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
});
