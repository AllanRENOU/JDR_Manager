import { TestBed } from '@angular/core/testing';

import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Modals } from '../../../shared/ui/modal/modals';
import { SettingsDialog } from './settings-dialog';

describe('SettingsDialog', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  it('présente les paramètres et se ferme par le bouton Fermer', async () => {
    const modals = TestBed.inject(Modals);
    modals.open(SettingsDialog, { size: 'lg' });
    TestBed.tick();

    const dialog = document.querySelector('app-settings-dialog') as HTMLElement;
    expect(dialog.querySelector('.modal__title')?.textContent).toContain('Paramètres');
    expect(dialog.querySelector('app-settings-content #settings-appearance')).not.toBeNull();

    (dialog.querySelector('.modal__header button') as HTMLButtonElement).click();
    TestBed.tick();
    expect(modals.isOpen()).toBe(false);
  });
});
