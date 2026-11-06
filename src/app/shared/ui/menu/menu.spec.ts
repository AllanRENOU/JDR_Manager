import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Menu } from './menu';
import { MenuItem } from './menu-item';

@Component({
  imports: [CdkMenuTrigger, Menu, MenuItem],
  template: `
    <button type="button" class="trigger" [cdkMenuTriggerFor]="menu">Ouvrir</button>
    <ng-template #menu>
      <div appMenu>
        <button appMenuItem [selected]="true" (triggered)="last.set('renommer')">Renommer</button>
        <button appMenuItem [disabled]="true" (triggered)="last.set('désactivé')">Dupliquer</button>
        <button appMenuItem tone="danger" (triggered)="last.set('supprimer')">Supprimer</button>
      </div>
    </ng-template>
  `,
})
class Host {
  readonly last = signal('');
}

describe('Menu / MenuItem', () => {
  it('ouvre le menu, déclenche une entrée et le referme', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.trigger') as HTMLButtonElement).click();
    await fixture.whenStable();

    const menu = document.querySelector('.app-menu') as HTMLElement;
    expect(menu.getAttribute('role')).toBe('menu');
    const [rename, duplicate, remove] = menu.querySelectorAll<HTMLButtonElement>('.app-menu-item');
    expect(rename.getAttribute('role')).toBe('menuitem');
    expect(rename.classList).toContain('app-menu-item--selected');
    expect(duplicate.getAttribute('aria-disabled')).toBe('true');
    expect(remove.classList).toContain('app-menu-item--danger');

    duplicate.click();
    expect(fixture.componentInstance.last()).toBe('');
    remove.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.last()).toBe('supprimer');
    expect(document.querySelector('.app-menu')).toBeNull();
  });
});
