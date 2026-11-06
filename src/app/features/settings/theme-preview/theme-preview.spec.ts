import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ThemePreview } from './theme-preview';

describe('ThemePreview', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));

  it('porte l’attribut data-theme pour prendre les jetons du thème prévisualisé', async () => {
    const fixture = TestBed.createComponent(ThemePreview);
    fixture.componentRef.setInput('theme', 'automne');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-theme')).toBe('automne');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.textContent).toContain('Présenter');
  });
});
