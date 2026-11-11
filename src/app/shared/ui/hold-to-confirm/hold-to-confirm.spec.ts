import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HoldToConfirm } from './hold-to-confirm';

@Component({
  imports: [HoldToConfirm],
  template: `
    <button
      type="button"
      appHoldToConfirm
      #hold="appHoldToConfirm"
      [appHoldToConfirmDuration]="1000"
      (holdStarted)="starts.set(starts() + 1)"
      (holdConfirmed)="confirmed.set(confirmed() + 1)"
    >
      Supprimer
    </button>
    @if (hold.tooShort()) {
      <p class="too-short">Restez appuyé</p>
    }
  `,
})
class Host {
  readonly starts = signal(0);
  readonly confirmed = signal(0);
}

describe('HoldToConfirm', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector('button')!;
    const send = (event: Event) => {
      button.dispatchEvent(event);
      fixture.detectChanges();
    };
    return {
      fixture,
      root,
      button,
      pointer: (type: string, buttonIndex = 0) =>
        send(new MouseEvent(type, { button: buttonIndex, bubbles: true })),
      key: (type: string, init: KeyboardEventInit) =>
        send(new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })),
    };
  }

  it('clic simple : rien de validé, le fond se vide et tooShort passe à vrai', () => {
    const { fixture, root, button, pointer } = setup();
    button.click();
    pointer('pointerdown');
    expect(button.classList).toContain('app-hold');
    expect(button.classList).toContain('app-hold--active');
    expect(fixture.componentInstance.starts()).toBe(1);
    vi.advanceTimersByTime(300);
    pointer('pointerup');

    expect(button.classList).not.toContain('app-hold--active');
    expect(button.style.getPropertyValue('--hold-progress')).toBe('0');
    expect(root.querySelector('.too-short')).not.toBeNull();
    vi.advanceTimersByTime(2000);
    expect(fixture.componentInstance.confirmed()).toBe(0);
  });

  it('nouvel appui : le message reste affiché ; maintenu jusqu’au bout, l’action est validée', () => {
    const { fixture, root, pointer } = setup();
    pointer('pointerdown');
    pointer('pointerup');
    pointer('pointerdown');
    expect(root.querySelector('.too-short')).not.toBeNull();
    vi.advanceTimersByTime(999);
    expect(fixture.componentInstance.confirmed()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.confirmed()).toBe(1);
  });

  it('relâché avant la fin : il faut recommencer toute la durée', () => {
    const { fixture, pointer } = setup();
    pointer('pointerdown');
    vi.advanceTimersByTime(900);
    pointer('pointerup');
    pointer('pointerdown');
    vi.advanceTimersByTime(900);
    expect(fixture.componentInstance.confirmed()).toBe(0);
    vi.advanceTimersByTime(100);
    expect(fixture.componentInstance.confirmed()).toBe(1);
  });

  it('bouton droit ignoré ; perte du focus = relâchement', () => {
    const { fixture, button, pointer } = setup();
    pointer('pointerdown', 2);
    expect(button.classList).not.toContain('app-hold--active');
    pointer('pointerdown');
    button.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    vi.advanceTimersByTime(2000);
    expect(fixture.componentInstance.confirmed()).toBe(0);
  });

  it('au clavier : Espace ou Entrée maintenus, répétitions ignorées', () => {
    const { fixture, key } = setup();
    key('keydown', { key: 'Enter' });
    key('keydown', { key: 'Enter', repeat: true });
    vi.advanceTimersByTime(500);
    key('keyup', { key: 'Enter' });
    expect(fixture.componentInstance.starts()).toBe(1);

    key('keydown', { key: ' ' });
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.confirmed()).toBe(1);
  });
});
