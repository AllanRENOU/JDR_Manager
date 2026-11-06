import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ELEMENT_TONES, Pill } from './pill';

@Component({
  imports: [Pill],
  template: `
    <app-pill tone="sound">Son</app-pill>
    <app-pill [removable]="true" removeLabel="Taverne" (remove)="removed.set(true)"
      >Taverne</app-pill
    >
    <app-pill variant="badge">Par défaut</app-pill>
  `,
})
class Host {
  readonly removed = signal(false);
}

describe('Pill', () => {
  it('applique la couleur, la variante et émet remove', async () => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [sound, next, badge] = fixture.nativeElement.querySelectorAll(
      'app-pill',
    ) as NodeListOf<HTMLElement>;

    expect(sound.classList).toContain('tone-sound');
    expect(sound.querySelector('button')).toBeNull();
    expect(badge.classList).toContain('variant-badge');

    const remove = next.querySelector('button') as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Retirer : Taverne');
    remove.click();
    expect(fixture.componentInstance.removed()).toBe(true);
  });

  it('associe une couleur à chaque type d’élément', () => {
    expect(ELEMENT_TONES['play-sound']).toBe('sound');
    expect(ELEMENT_TONES['stop-sound']).toBe('stop-all');
    expect(Object.keys(ELEMENT_TONES)).toHaveLength(8);
  });
});
