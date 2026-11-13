import { TestBed } from '@angular/core/testing';

import {
  seedPresentation,
  startPresentation,
  usePresentation,
} from '../../../../../testing/presentation-harness';
import { anAction } from '../../../../../testing/data-builders';
import { Feed } from './feed';

describe('Feed', () => {
  usePresentation();

  async function render() {
    const fixture = TestBed.createComponent(Feed);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('texte en police narrative, miniature, bloc de clic validé au clic (10.3.1 à 10.3.3)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'garde',
        name: 'Le garde',
        elements: [
          { id: 'sb', type: 'show-battlemap', battlemapId: 'b2' },
          { id: 'uc', type: 'user-click', text: 'Il demande vos noms.' },
          { id: 't2', type: 'add-text', text: 'Il vous laisse passer.' },
        ],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    void engine.runAction('garde');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.click')).not.toBeNull();
    });
    expect(el.querySelector('.text')?.textContent).toContain('Odeur de bière.');
    expect(el.querySelector('app-feed-battlemap button')?.getAttribute('aria-label')).toBe(
      'Agrandir la battlemap « Étage »',
    );
    const click = el.querySelector('.click') as HTMLElement;
    expect(click.textContent).toContain('Il demande vos noms.');
    const continueButton = click.querySelector('button') as HTMLButtonElement;
    expect(continueButton.textContent).toContain('Cliquer pour continuer');

    continueButton.click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('.text')).toHaveLength(2);
    });
    expect(el.querySelector('.click')?.classList).toContain('click--done');
    expect(el.querySelector('.click')?.textContent).toContain('Validé');
    expect(el.querySelector('.click button')).toBeNull();
  });

  it('Changer de scène : bloc « Aller à la scène », la scène change au clic sur « Aller »', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'fuite',
        name: 'Fuite',
        elements: [{ id: 'cs', type: 'change-scene', sceneId: 'B' }],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    void engine.runAction('fuite');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.click')).not.toBeNull();
    });
    const click = el.querySelector('.click') as HTMLElement;
    expect(click.querySelector('.click__text')?.textContent?.trim()).toBe(
      "Aller à la scène 'La forêt'",
    );
    const goButton = click.querySelector('button') as HTMLButtonElement;
    expect(goButton.textContent?.trim()).toBe('Aller');
    expect(engine.scene()?.id).toBe('A');

    goButton.click();
    await vi.waitFor(() => expect(engine.scene()?.id).toBe('B'));
  });

  it('Attendre : une ligne avec le temps restant sous le fil, retirée à la fin', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'pause',
        name: 'Pause',
        elements: [
          { id: 'w', type: 'wait', seconds: 0.2 },
          { id: 't', type: 'add-text', text: 'Après.' },
        ],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    void engine.runAction('pause');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-feed-wait [role="timer"]')?.textContent).toContain('0:01');
    });
    expect(el.querySelector('.column > app-feed-wait:last-of-type')).not.toBeNull();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('.text')).toHaveLength(2);
    });
    expect(el.querySelector('app-feed-wait')).toBeNull();
  });

  it('éléments précédents estompés et pastille « N éléments précédents » (10.3.4, 10.3.5)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'garde',
        name: 'Le garde',
        elements: [
          { id: 't1', type: 'add-text', text: 'Un.' },
          { id: 't2', type: 'add-text', text: 'Deux.' },
        ],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    await engine.runAction('garde');
    await fixture.whenStable();
    const items = [...el.querySelectorAll('.item')];
    // Le fil montre le premier élément de l'action (« Un. ») : seul le texte de scène est passé.
    expect(items.map((i) => i.classList.contains('item--past'))).toEqual([true, false, false]);
    expect(el.querySelector('.previous')?.textContent).toContain('1 élément précédent');
  });

  it('relance : le fil revient sur le texte déjà présent (10.3.6)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'garde',
        name: 'Le garde',
        elements: [{ id: 't1', type: 'add-text', text: 'Halte !' }],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    await engine.runAction('garde');
    engine.showBattlemap('b2');
    await engine.runAction('garde');
    await fixture.whenStable();
    const items = [...el.querySelectorAll('.item')];
    expect(items).toHaveLength(3);
    // « Halte ! » redevient l'élément courant : seul le texte de scène avant lui est estompé.
    expect(items.map((i) => i.classList.contains('item--past'))).toEqual([true, false, false]);
  });

  it('battlemap supprimée : message d’erreur dans le fil, la partie continue (10.3.7)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'carte',
        name: 'Carte',
        elements: [
          { id: 'sb', type: 'show-battlemap', battlemapId: 'supprimée' },
          { id: 't', type: 'add-text', text: 'Après.' },
        ],
      }),
    ]);
    const engine = await startPresentation();
    const { fixture, el } = await render();
    await engine.runAction('carte');
    await fixture.whenStable();
    expect(el.querySelector('app-feed-battlemap [role=alert]')?.textContent).toContain(
      'Cette battlemap a été supprimée du projet.',
    );
    expect(el.textContent).toContain('Après.');
  });
});
