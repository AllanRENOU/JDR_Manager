import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Modals } from '../modal/modals';

describe('Modals.confirm', () => {
  let modals: Modals;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    modals = TestBed.inject(Modals);
  });

  afterEach(() => modals.closeAll());

  function buttons(): HTMLButtonElement[] {
    TestBed.tick();
    return [...document.querySelectorAll<HTMLButtonElement>('app-confirm-dialog .modal__footer button')];
  }

  it('renvoie true à la confirmation, avec les libellés par défaut', async () => {
    const answer = modals.confirm({ title: 'Recommencer ?', message: 'La partie sera perdue.' });
    const [cancel, confirm] = buttons();
    expect(cancel.textContent).toContain('Annuler');
    expect(confirm.textContent).toContain('Confirmer');
    expect(confirm.classList).toContain('app-button--primary');
    expect(document.querySelector('app-modal')?.classList).not.toContain('danger');
    confirm.click();
    expect(await answer).toBe(true);
  });

  it('variante destructive : bordure, icône, bouton danger fort ; Annuler renvoie false', async () => {
    const answer = modals.confirm({
      title: 'Supprimer le dossier ?',
      message: 'Son contenu sera aussi supprimé.',
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    const [cancel, confirm] = buttons();
    expect(document.querySelector('app-modal')?.classList).toContain('danger');
    expect(document.querySelector('.confirm__icon')).not.toBeNull();
    expect(confirm.textContent).toContain('Supprimer');
    expect(confirm.classList).toContain('app-button--danger-strong');
    cancel.click();
    expect(await answer).toBe(false);
  });

  it('renvoie false si la fenêtre est fermée sans réponse', async () => {
    const answer = modals.confirm({ title: 'Titre', message: 'Message' });
    TestBed.tick();
    modals.closeAll();
    expect(await answer).toBe(false);
  });
});
