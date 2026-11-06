import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { THEMES, Theme } from '../../../core/theme/theme';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([])],
    });
  });

  async function render() {
    const fixture = TestBed.createComponent(SettingsPage);
    // Attaché au document pour pouvoir vérifier le focus clavier.
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche la section Apparence et un retour vers l’accueil (5.2.1)', async () => {
    const el = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Paramètres');
    expect(el.querySelector('#settings-appearance')?.textContent).toContain('Apparence');
    const back = el.querySelector('app-header a') as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/projects');
    expect(back.getAttribute('aria-label')).toBe('Retour aux projets');
  });

  it('présente une carte d’aperçu par thème, le thème actuel coché (5.2.2)', async () => {
    const el = await render();
    expect(el.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe(
      'Thème de l’application',
    );
    const cards = [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(cards.map((c) => c.querySelector('.theme__name')?.textContent?.trim())).toEqual(
      THEMES.map((t) => (t.id === 'nuit-doree' ? 'Nuit dorée' : 'Automne')),
    );
    expect(
      cards.map((c) => c.querySelector('app-theme-preview')?.getAttribute('data-theme')),
    ).toEqual(THEMES.map((t) => t.id));
    const current = TestBed.inject(Theme).theme();
    const checked = cards.filter((c) => c.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0].querySelector('app-theme-preview')?.getAttribute('data-theme')).toBe(current);
    expect(checked[0].textContent).toContain('Thème actuel');
  });

  it('change le thème immédiatement au clic et le mémorise (5.2.3)', async () => {
    const theme = TestBed.inject(Theme);
    theme.setTheme('nuit-doree');
    const el = await render();
    const automne = el.querySelector('[data-theme-option="automne"]') as HTMLButtonElement;
    expect(automne.tabIndex).toBe(-1);

    automne.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(theme.theme()).toBe('automne');
    expect(document.documentElement.getAttribute('data-theme')).toBe('automne');
    expect(JSON.parse(localStorage.getItem('jdr-manager:theme') ?? 'null')).toBe('automne');
    expect(automne.getAttribute('aria-checked')).toBe('true');
    expect(automne.tabIndex).toBe(0);
    theme.setTheme('nuit-doree');
  });

  it('choisit le thème voisin avec les flèches du clavier', async () => {
    const theme = TestBed.inject(Theme);
    theme.setTheme('nuit-doree');
    const el = await render();
    const nuit = el.querySelector('[data-theme-option="nuit-doree"]') as HTMLButtonElement;
    nuit.focus();

    nuit.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(theme.theme()).toBe('automne');
    expect(document.activeElement?.getAttribute('data-theme-option')).toBe('automne');

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(theme.theme()).toBe('nuit-doree');
  });
});
