import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Alert } from './alert';

@Component({
  imports: [Alert],
  template: `
    <app-alert>Format refusé.</app-alert>
    <app-alert tone="info">Astuce.</app-alert>
  `,
})
class Host {}

describe('Alert', () => {
  it('annonce les erreurs (role alert) et les informations (role status)', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [danger, info] = fixture.nativeElement.querySelectorAll(
      'app-alert',
    ) as NodeListOf<HTMLElement>;
    expect(danger.getAttribute('role')).toBe('alert');
    expect(danger.classList).toContain('tone-danger');
    expect(info.getAttribute('role')).toBe('status');
    expect(info.textContent).toContain('Astuce.');
  });
});
