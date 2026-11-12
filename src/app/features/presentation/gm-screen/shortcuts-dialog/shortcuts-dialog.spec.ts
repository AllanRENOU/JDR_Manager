import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { ShortcutsDialog } from './shortcuts-dialog';

describe('ShortcutsDialog', () => {
  it('liste chaque touche avec son effet', async () => {
    TestBed.configureTestingModule({ imports: [ShortcutsDialog, getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(ShortcutsDialog);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('Raccourcis clavier');
    const rows = [...el.querySelectorAll('.list__row')].map((row) => [
      row.querySelector('kbd')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual([
      'Entrée',
      'Cliquer pour continuer, si c’est le dernier élément du fil',
    ]);
    expect(rows[1]).toEqual(['C', 'Cliquer pour continuer (dernier clic en attente)']);
    expect(rows.map((r) => r[0])).toEqual(['Entrée', 'C', 'S', 'A', 'P', '1 – 9', '?']);
  });
});
