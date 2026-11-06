import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Input } from '../input/input';
import { Field } from './field';

@Component({
  imports: [Field, Input],
  template: `
    <app-field label="Nom" [required]="true" hint="Visible par le MJ" #a>
      <input appInput [id]="a.controlId" />
    </app-field>
    <app-field label="Texte" [hiddenLabel]="true" error="Trop long" #b>
      <textarea appInput [id]="b.controlId"></textarea>
    </app-field>
  `,
})
class Host {}

describe('Field', () => {
  it('relie le libellé au contrôle et affiche mention obligatoire, aide et erreur', async () => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [first, second] = fixture.nativeElement.querySelectorAll(
      'app-field',
    ) as NodeListOf<HTMLElement>;

    const label = first.querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Nom');
    expect(label.textContent).toContain('(obligatoire)');
    expect(first.querySelector(`#${label.htmlFor}`)?.tagName).toBe('INPUT');
    expect(first.querySelector('.field__hint')?.textContent).toContain('Visible par le MJ');

    expect(second.querySelector('label')?.classList).toContain('visually-hidden');
    expect(second.querySelector('[role="alert"]')?.textContent).toContain('Trop long');
    expect(second.querySelector('.field__hint')).toBeNull();
  });
});
