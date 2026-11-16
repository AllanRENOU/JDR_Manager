import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { SheetDialog, SheetDialogData } from './sheet-dialog';

describe('SheetDialog', () => {
  const close = vi.fn();

  async function render(data: SheetDialogData): Promise<HTMLElement> {
    close.mockReset();
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(SheetDialog);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le titre et le texte mis en forme, en lecture seule (FCH-08)', async () => {
    const el = await render({
      title: 'Aubergiste',
      text: '## Caractère\n\n**Bourru** mais juste.',
    });
    expect(el.querySelector('h2')?.textContent).toContain('Aubergiste');
    expect(el.querySelector('.modal__subtitle')).toBeNull();
    expect(el.querySelector('.sheet h2')?.textContent).toBe('Caractère');
    expect(el.querySelector('.sheet strong')?.textContent).toBe('Bourru');
    expect(el.querySelector('input, textarea, [contenteditable]')).toBeNull();
  });

  it('signale une fiche vide', async () => {
    const el = await render({ title: 'Vide', text: '  ' });
    expect(el.querySelector('.empty')?.textContent).toContain('Cette fiche est vide.');
  });

  it('se ferme par le bouton « Fermer » en bas à droite', async () => {
    const el = await render({ title: 'Aubergiste', text: 'Texte' });
    const button = el.querySelector('.modal__footer-end button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Fermer');
    button.click();
    expect(close).toHaveBeenCalled();
  });
});
