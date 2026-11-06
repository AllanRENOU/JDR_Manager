import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ActionElement } from '../../../core/models';
import { SummaryContext } from '../action-summary';
import { ElementCard } from './element-card';

@Component({
  imports: [ElementCard],
  template: `
    <app-element-card
      [element]="element()"
      [index]="2"
      [context]="context"
      [(expanded)]="expanded"
      (removed)="removed = removed + 1"
    >
      <p class="form">Formulaire</p>
    </app-element-card>
  `,
})
class Host {
  readonly element = signal<ActionElement>({
    id: 'e',
    type: 'play-sound',
    soundId: 'rain',
    volume: 1,
    loop: false,
    fadeInMs: 0,
    fadeOutMs: 0,
  });
  readonly context: SummaryContext = {
    soundNames: { rain: 'Pluie' },
    battlemaps: [],
    sceneNodes: [],
  };
  readonly expanded = signal(false);
  removed = 0;
}

describe('ElementCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));

  it('résume l’élément replié : numéro, couleur du type, nom du type et cible (8.2.2)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.card__index')?.textContent?.trim()).toBe('2');
    expect(el.querySelector('.card__icon')?.classList).toContain('card__icon--sound');
    expect(el.querySelector('.card__type')?.textContent?.trim()).toBe('Lancer un son');
    expect(el.querySelector('.card__detail')?.textContent?.trim()).toBe('Pluie');
    expect(el.querySelector('.form')).toBeNull();

    fixture.componentInstance.element.set({ id: 'e', type: 'add-text', text: '' });
    await fixture.whenStable();
    expect(el.querySelector('.card__detail')?.textContent?.trim()).toBe('Texte à saisir');
    expect(el.querySelector('.card__detail')?.classList).toContain('card__detail--missing');
  });

  it('se déplie pour montrer le formulaire et émet la suppression (8.2.2)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const [remove, toggle] = [...el.querySelectorAll<HTMLButtonElement>('.card__head button')];
    expect(toggle.getAttribute('aria-label')).toBe(
      'Déplier ou replier l’élément 2 « Lancer un son »',
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.expanded()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.form')?.textContent).toBe('Formulaire');
    expect(el.querySelector('app-element-card')?.classList).toContain('expanded');

    expect(remove.getAttribute('aria-label')).toBe('Supprimer l’élément 2 « Lancer un son »');
    remove.click();
    expect(fixture.componentInstance.removed).toBe(1);
  });
});
