import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Placeholder } from './placeholder';

@Component({
  imports: [Placeholder],
  template: `
    <app-placeholder />
    <app-placeholder variant="alt" grid="fine" label="Carte de la taverne" />
  `,
})
class Host {}

describe('Placeholder', () => {
  it('est décoratif sans libellé, nommé avec libellé, et applique variante et grille', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [plain, alt] = fixture.nativeElement.querySelectorAll(
      'app-placeholder',
    ) as NodeListOf<HTMLElement>;
    expect(plain.getAttribute('aria-hidden')).toBe('true');
    expect(plain.getAttribute('aria-label')).toBeNull();
    expect(alt.getAttribute('aria-label')).toBe('Carte de la taverne');
    expect(alt.getAttribute('aria-hidden')).toBeNull();
    expect(alt.classList).toContain('alt');
    expect(alt.classList).toContain('fine');
  });
});
