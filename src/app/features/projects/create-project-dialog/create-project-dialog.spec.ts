import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Modals } from '../../../shared/ui/modal/modals';
import { CreateProjectDialog } from './create-project-dialog';

describe('CreateProjectDialog', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));
  afterEach(() => TestBed.inject(Modals).closeAll());

  it('valide à la touche Entrée et renvoie le nom sans espaces superflus, avec une majuscule ; nom vide refusé', async () => {
    const ref = TestBed.inject(Modals).open<string>(CreateProjectDialog);
    TestBed.tick();
    const dialog = document.querySelector('app-create-project-dialog') as HTMLElement;
    const input = dialog.querySelector('input') as HTMLInputElement;
    const form = dialog.querySelector('form') as HTMLFormElement;

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(document.querySelector('app-create-project-dialog')).not.toBeNull();

    const result = firstValueFrom(ref.closed);
    input.value = ' la crypte ';
    input.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(await result).toBe('La crypte');
  });
});
