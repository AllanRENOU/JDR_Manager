import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ListenButton } from './listen-button';

@Component({
  imports: [ListenButton],
  template: `<app-listen-button
    name="Pluie"
    [playing]="playing()"
    (toggled)="count = count + 1"
  />`,
})
class Host {
  readonly playing = signal(false);
  count = 0;
}

describe('ListenButton', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));

  it('annonce « Écouter » ou « Arrêter la pré-écoute » et émet toggled au clic', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Écouter « Pluie »');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    expect(fixture.componentInstance.count).toBe(1);

    fixture.componentInstance.playing.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('aria-label')).toBe('Arrêter la pré-écoute de « Pluie »');
    expect(fixture.nativeElement.querySelector('app-listen-button').classList).toContain('playing');
  });
});
