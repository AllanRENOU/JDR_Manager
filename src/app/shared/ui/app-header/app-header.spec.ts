import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppHeader } from './app-header';

@Component({
  imports: [AppHeader],
  template: `
    <app-header variant="play">
      <a headerStart href="/">Retour</a>
      <h1>La crypte</h1>
      <button headerEnd type="button">Présenter</button>
    </app-header>
  `,
})
class Host {}

describe('AppHeader', () => {
  it('place le début, le titre et les actions ; variante Présentation', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const header = fixture.nativeElement.querySelector('app-header') as HTMLElement;
    expect(header.getAttribute('role')).toBe('banner');
    expect(header.classList).toContain('app-header--play');
    expect(header.querySelector('.header__start a')?.textContent).toBe('Retour');
    expect(header.querySelector('.header__title h1')?.textContent).toBe('La crypte');
    expect(header.querySelector('.header__end button')?.textContent).toBe('Présenter');
  });
});
