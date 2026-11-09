import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { SoundCard } from './sound-card';

describe('SoundCard', () => {
  usePresentation();

  it('nom, boucle, pause / reprise, carte dépliée avec volume (10.5.5)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(SoundCard);
    fixture.componentRef.setInput('sound', engine.sounds()[0]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Taverne');
    expect(el.textContent).toContain('boucle');
    const pause = el.querySelector('button[aria-label^="Mettre en pause"]') as HTMLButtonElement;
    expect(pause.getAttribute('aria-label')).toBe('Mettre en pause « Taverne »');
    pause.click();
    expect(engine.sounds()[0].paused).toBe(true);
    fixture.componentRef.setInput('sound', engine.sounds()[0]);
    await fixture.whenStable();
    expect(el.textContent).toContain('en pause');
    (el.querySelector('button[aria-label^="Reprendre"]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(engine.sounds()[0].paused).toBe(false));

    const head = el.querySelector('.head__main') as HTMLButtonElement;
    expect(el.querySelector('input[type=range]')).toBeNull();
    head.click();
    await fixture.whenStable();
    expect(head.getAttribute('aria-expanded')).toBe('true');
    const range = el.querySelector('input[type=range]') as HTMLInputElement;
    expect(range.value).toBe('60');
    expect(el.querySelector('.volume__value')?.textContent).toContain('60 %');
    range.value = '25';
    range.dispatchEvent(new Event('input'));
    expect(engine.sounds()[0].volume).toBe(0.25);
  });
});
