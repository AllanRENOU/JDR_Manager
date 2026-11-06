import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <button appButton type="button" class="extra">Défaut</button>
    <button appButton="danger-strong" size="sm" [block]="true" type="button">Supprimer</button>
    <a appButton="quiet" href="#">Lien</a>
  `,
})
class Host {}

describe('Button', () => {
  it('applique la variante, la taille et garde les classes du parent', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [first, second, link] = fixture.nativeElement.querySelectorAll(
      '.app-button',
    ) as NodeListOf<HTMLElement>;

    expect(first.className).toContain('app-button--primary');
    expect(first.className).toContain('app-button--size-md');
    expect(first.classList).toContain('extra');
    expect(second.classList).toContain('app-button--danger-strong');
    expect(second.classList).toContain('app-button--size-sm');
    expect(second.classList).toContain('app-button--block');
    expect(link.classList).toContain('app-button--quiet');
  });
});
