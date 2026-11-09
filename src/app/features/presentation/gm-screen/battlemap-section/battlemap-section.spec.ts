import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { BattlemapSection } from './battlemap-section';

describe('BattlemapSection', () => {
  usePresentation();

  it('aperçu de la battlemap affichée et choix parmi celles de la scène (10.5.2)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(BattlemapSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.section__summary')?.textContent).toContain('Salle');
    expect(el.querySelector('app-feed-battlemap img')?.getAttribute('src')).toBe('blob:m1');
    const choices = [...el.querySelectorAll<HTMLButtonElement>('.choice')];
    expect(choices.map((c) => [c.textContent?.trim(), c.getAttribute('aria-pressed')])).toEqual([
      ['Salle', 'true'],
      ['Étage', 'false'],
    ]);
    choices[1].click();
    await fixture.whenStable();
    expect(engine.shownBattlemap()?.id).toBe('b2');
    expect(el.querySelector('.section__summary')?.textContent).toContain('Étage');
    expect(engine.feed().at(-1)).toMatchObject({ type: 'battlemap', battlemapId: 'b2' });
  });
});
