import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SegmentedControl, SegmentedOption } from './segmented-control';

type Trigger = 'scene-open' | 'manual';

@Component({
  imports: [SegmentedControl],
  template: `<app-segmented-control label="Déclencheur" [options]="options" [(value)]="trigger" />`,
})
class Host {
  readonly options: SegmentedOption<Trigger>[] = [
    { value: 'scene-open', label: 'À l’ouverture' },
    { value: 'manual', label: 'Manuel' },
  ];
  readonly trigger = signal<Trigger | null>('scene-open');
}

describe('SegmentedControl', () => {
  it('reflète la valeur, change au clic et aux flèches', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const group = fixture.nativeElement.querySelector('app-segmented-control') as HTMLElement;
    const [first, second] = group.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Déclencheur');
    expect(first.getAttribute('aria-checked')).toBe('true');
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);

    second.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.trigger()).toBe('manual');
    expect(second.classList).toContain('segment--active');

    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.trigger()).toBe('scene-open');
    expect(document.activeElement).toBe(first);
  });
});
