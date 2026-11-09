import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { NextSceneButton } from './next-scene-button';

describe('NextSceneButton', () => {
  usePresentation();

  it('plusieurs scènes suivantes : liste au-dessus du bouton (10.4.2)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(NextSceneButton);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Scène suivante');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    button.click();
    TestBed.tick();
    const options = [...document.querySelectorAll<HTMLButtonElement>('.app-menu button')];
    expect(options.map((o) => o.textContent?.trim())).toEqual(['La forêt', 'Le marché']);
    options[1].click();
    await vi.waitFor(() => expect(engine.scene()?.id).toBe('C'));
  });

  it('une seule scène suivante : ouverture directe ; aucune : pas de bouton (10.4.1)', async () => {
    await seedPresentation();
    const engine = await startPresentation();
    await engine.openScene('B');
    const fixture = TestBed.createComponent(NextSceneButton);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-haspopup')).toBeNull();
    button.click();
    await vi.waitFor(() => expect(engine.scene()?.id).toBe('C'));
    await fixture.whenStable();
    expect(el.querySelector('button')).toBeNull();
  });
});
