import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
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
    expect(el.querySelector('app-settings-content #settings-appearance')?.textContent).toContain(
      'Apparence',
    );
    const back = el.querySelector('app-header a') as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/projects');
    expect(back.getAttribute('aria-label')).toBe('Retour aux projets');
  });
});
