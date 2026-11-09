import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Capitalize, capitalizeFirst } from './capitalize';

@Component({
  imports: [Capitalize],
  template: `<input
    appCapitalize
    [value]="value()"
    (input)="value.set($any($event.target).value)"
  />`,
})
class Host {
  readonly value = signal('');
}

describe('Capitalize', () => {
  it('met en majuscule la première lettre, après d’éventuels espaces', () => {
    expect(capitalizeFirst('la crypte')).toBe('La crypte');
    expect(capitalizeFirst('  été')).toBe('  Été');
    expect(capitalizeFirst('Déjà')).toBe('Déjà');
    expect(capitalizeFirst('3 gobelins')).toBe('3 gobelins');
    expect(capitalizeFirst('')).toBe('');
  });

  it('corrige la saisie avant les autres gestionnaires et garde le curseur', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    document.body.appendChild(fixture.nativeElement);

    input.value = 'éclair';
    input.setSelectionRange(3, 3);
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('Éclair');
    expect(input.selectionStart).toBe(3);
    expect(fixture.componentInstance.value()).toBe('Éclair');
  });
});
