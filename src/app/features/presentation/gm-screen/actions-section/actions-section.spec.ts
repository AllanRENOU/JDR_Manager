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
    expect(toggle.textContent).toContain('Voir toutes les actions (1 masquée)');
    toggle.click();
    await fixture.whenStable();
    expect(names()).toEqual(['Le garde']);
    expect(el.querySelector('.action--done')?.textContent).toContain('Relancer');
    expect(toggle.textContent).toContain('Masquer les actions effectuées ou masquées');

    const textsBefore = engine.feed().length;
    (el.querySelector('.action--done') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(engine.feed()).toHaveLength(textsBefore);
  });

  it('action affichée pendant la scène : animation d’arrivée, pas à l’ouverture (ACT-12)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'garde',
        name: 'Le garde',
        order: 2,
        elements: [{ id: 'sa', type: 'show-action', actionIds: ['fuite'] }],
      }),
      anAction('A', {
        id: 'fuite',
        name: 'La fuite',
        order: 3,
        hidden: true,
        elements: [{ id: 't', type: 'add-text', text: 'Ils fuient.' }],
      }),
      anAction('A', { id: 'porte', name: 'La porte', order: 4, elements: [] }),
    ]);
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(ActionsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const arrived = () =>
      [...el.querySelectorAll('.action--arrived .action__name')].map((n) => n.textContent?.trim());
    expect(arrived()).toEqual([]);

    await engine.runAction('garde');
    await fixture.whenStable();
    expect(arrived()).toEqual(['La fuite']);

    // Fin de l'animation : ligne ordinaire.
    el.querySelector('.action--arrived')!.dispatchEvent(new Event('animationend'));
    await fixture.whenStable();
    expect(arrived()).toEqual([]);
  });

  it('action masquée au départ : rangée avec les effectuées, lançable depuis « Voir toutes les actions » (ACT-12)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'fuite',
        name: 'La fuite',
        order: 2,
        hidden: true,
        elements: [{ id: 't', type: 'add-text', text: 'Ils fuient.' }],
      }),
    ]);
    const engine = await startPresentation();
    const fixture = TestBed.createComponent(ActionsSection);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.action')).toHaveLength(0);
    expect(el.textContent).toContain('Toutes les actions sont effectuées ou masquées.');
    const toggle = el.querySelector('.toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Voir toutes les actions (1 masquée)');

    toggle.click();
    await fixture.whenStable();
    const hidden = el.querySelector('.action--done') as HTMLButtonElement;
    expect(hidden.textContent).toContain('La fuite');
    expect(hidden.textContent).toContain('masquée au départ');
    expect(hidden.textContent).not.toContain('Relancer');
    hidden.click();
    await vi.waitFor(() => expect(engine.manualActions()[0].done).toBe(true));
  });
});
