import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UI_PREFERENCES_PREFIX } from '../../../core/preferences/ui-preferences';
import { CollapsibleSection } from './collapsible-section';

@Component({
  imports: [CollapsibleSection],
  template: `
    <app-collapsible-section title="Sons" summary="· 2 en cours" preferenceKey="test.sons">
      <button sectionAction type="button">Tout mettre en pause</button>
      <p>Contenu</p>
    </app-collapsible-section>
  `,
})
class Host {}

describe('CollapsibleSection', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      toggle: host.querySelector('.section__toggle') as HTMLButtonElement,
      content: host.querySelector('.section__content') as HTMLElement,
      host,
    };
  }

  it('est ouverte par défaut, affiche titre, résumé et action', async () => {
    const { toggle, content, host } = await render();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(content.id);
    expect(toggle.textContent).toContain('Sons');
    expect(toggle.textContent).toContain('· 2 en cours');
    expect(content.hidden).toBe(false);
    expect(host.querySelector('.section__action button')?.textContent).toContain('pause');
  });

  it('se replie, mémorise l’état et le relit', async () => {
    const { fixture, toggle, content } = await render();
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content.hidden).toBe(true);
    expect(localStorage.getItem(UI_PREFERENCES_PREFIX + 'section:test.sons')).toBe('false');

    fixture.destroy();
    const again = await render();
    expect(again.toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
