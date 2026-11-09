import { TestBed } from '@angular/core/testing';

import { seedPresentation, usePresentation } from '../../../../../testing/presentation-harness';
import { Theme } from '../../../../core/theme/theme';
import { PlayerScreenPage } from './player-screen-page';

describe('PlayerScreenPage', () => {
  const { bus } = usePresentation();

  const flush = () => new Promise((resolve) => setTimeout(resolve));

  async function render() {
    await seedPresentation();
    const gm = bus.open('p1');
    const fixture = TestBed.createComponent(PlayerScreenPage);
    fixture.componentRef.setInput('projectId', 'p1');
    await fixture.whenStable();
    await flush();
    return { fixture, el: fixture.nativeElement as HTMLElement, gm };
  }

  it('demande l’état à l’ouverture et attend l’écran du MJ (11.4)', async () => {
    const { el, gm } = await render();
    expect(bus.received(gm)).toEqual([{ type: 'ping' }]);
    expect(el.textContent).toContain('En attente de l’écran du MJ');
    expect(el.querySelector('img')).toBeNull();
  });

  it('affiche la battlemap demandée, en résolvant elle-même l’image (11.2, 11.3, 11.5)', async () => {
    const { fixture, el, gm } = await render();
    gm.postMessage({ type: 'show-battlemap', sceneId: 'A', battlemapId: 'b2' });
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('img')?.getAttribute('src')).toBe('blob:m2');
    });
    expect(el.textContent?.trim()).toBe('');

    gm.postMessage({ type: 'clear' });
    await flush();
    await fixture.whenStable();
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });

  it('applique le thème du MJ et se signale quand l’écran du MJ redémarre (11.6, 11.7)', async () => {
    const { fixture, gm } = await render();
    const other = TestBed.inject(Theme).theme() === 'automne' ? 'nuit-doree' : 'automne';
    gm.postMessage({ type: 'theme', theme: other });
    await flush();
    expect(TestBed.inject(Theme).theme()).toBe(other);

    gm.postMessage({ type: 'hello' });
    await flush();
    expect(bus.received(gm)).toEqual([{ type: 'ping' }, { type: 'ping' }]);

    fixture.destroy();
    expect(bus.received(gm).length).toBe(2);
    await flush();
    expect(bus.received(gm).at(-1)).toEqual({ type: 'bye' });
  });
});
