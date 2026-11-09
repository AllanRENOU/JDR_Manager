import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Modal } from './modal';
import { Modals } from './modals';

@Component({
  imports: [Modal],
  template: `
    <app-modal title="Titre" [subtitle]="data">
      <p>Contenu</p>
      <button modalFooterEnd type="button" (click)="ref.close('ok')">Valider</button>
    </app-modal>
  `,
})
class TestModal {
  readonly ref = inject<DialogRef<string>>(DialogRef);
  readonly data = inject<string>(DIALOG_DATA);
}

describe('Modals / Modal', () => {
  let modals: Modals;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    modals = TestBed.inject(Modals);
  });

  afterEach(() => modals.closeAll());

  function open(size?: 'sm' | 'lg') {
    const ref = modals.open<string, string>(TestModal, { data: 'Sous-titre', size });
    TestBed.tick();
    const panel = document.querySelector('.app-dialog-panel') as HTMLElement;
    return { ref, panel };
  }

  it('affiche titre, sous-titre et contenu, nomme la fenêtre par son titre', async () => {
    const { panel } = open('lg');
    const container = panel.querySelector('[role="dialog"]') as HTMLElement;
    const title = panel.querySelector('h2') as HTMLElement;
    expect(title.textContent).toContain('Titre');
    expect(panel.textContent).toContain('Sous-titre');
    expect(container.getAttribute('aria-labelledby')).toContain(title.id);
    expect(panel.style.width).toBe('var(--layout-modal-lg)');
  });

  it('renvoie le résultat de l’action et se ferme par la croix', async () => {
    const first = open();
    let result: string | undefined = 'non fermée';
    first.ref.closed.subscribe((value) => (result = value));
    (first.panel.querySelector('app-modal .modal__footer button') as HTMLButtonElement).click();
    expect(result).toBe('ok');

    const second = open();
    const closed = vi.fn();
    second.ref.closed.subscribe(closed);
    (second.panel.querySelector('button[aria-label="Fermer"]') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledWith(undefined);
  });
});
