import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Input } from './input';

@Component({
  imports: [Input],
  template: `<input appInput /><textarea appInput surface="card"></textarea>`,
})
class Host {}

describe('Input', () => {
  it('applique le style de champ et la variante de surface', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [input, textarea] = fixture.nativeElement.querySelectorAll(
      '.app-input',
    ) as NodeListOf<HTMLElement>;
    expect(input.classList).not.toContain('app-input--on-card');
    expect(textarea.classList).toContain('app-input--on-card');
  });
});
