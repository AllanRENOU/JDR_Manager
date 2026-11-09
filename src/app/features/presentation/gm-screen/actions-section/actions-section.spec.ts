import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { anAction } from '../../../../../testing/data-builders';
import { ActionsSection } from './actions-section';

describe('ActionsSection', () => {
  usePresentation();

  it('actions disponibles, action en cours, effectuées masquées puis relancées (10.5.3, 10.5.4)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'garde',
        name: 'Le garde',
        order: 2,
        elements: [{ id: 't', type: 'add-text', text: 'Halte !' }],
      }),
      anAction('A', {
        id: 'clic',
        name: 'Le bourgmestre',
        order: 3,
        elements: [{ id: 'uc', type: 'user-click', text: 'Il approche.' }],
      }),
    ]);
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(ActionsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const names = () => [...el.querySelectorAll('.action__name')].map((n) => n.textContent?.trim());
    expect(el.querySelector('.section__summary')?.textContent).toContain('2 disponibles');
    expect(names()).toEqual(['Le garde', 'Le bourgmestre']);

    el.querySelectorAll<HTMLButtonElement>('.action')[1].click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.running')?.textContent).toContain('Le bourgmestre');
    });
    expect(names()).toEqual(['Le garde']);

    (el.querySelector('.action') as HTMLButtonElement).click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(names()).toEqual([]);
    });
    expect(el.textContent).not.toContain('Toutes les actions ont été effectuées');
    const toggle = el.querySelector('.toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Voir toutes les actions (1 effectuée)');
    toggle.click();
    await fixture.whenStable();
    expect(names()).toEqual(['Le garde']);
    expect(el.querySelector('.action--done')?.textContent).toContain('Relancer');
    expect(toggle.textContent).toContain('Masquer les actions effectuées');

    const textsBefore = engine.feed().length;
    (el.querySelector('.action--done') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(engine.feed()).toHaveLength(textsBefore);
  });
});
