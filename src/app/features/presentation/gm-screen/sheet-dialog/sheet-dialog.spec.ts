import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { SheetDialog, SheetDialogData } from './sheet-dialog';

describe('SheetDialog', () => {
  async function render(data: SheetDialogData): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [{ provide: DIALOG_DATA, useValue: data }],
    });
    const fixture = TestBed.createComponent(SheetDialog);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le titre, le chemin et le texte mis en forme, en lecture seule (FCH-08)', async () => {
    const el = await render({
      title: 'Aubergiste',
      path: 'PNJ › Auberge',
      text: '## Caractère\n\n**Bourru** mais juste.',
    });
    expect(el.querySelector('h2')?.textContent).toContain('Aubergiste');
    expect(el.textContent).toContain('PNJ › Auberge');
    expect(el.querySelector('.sheet h2')?.textContent).toBe('Caractère');
    expect(el.querySelector('.sheet strong')?.textContent).toBe('Bourru');
    expect(el.querySelector('input, textarea, [contenteditable]')).toBeNull();
  });

  it('signale une fiche vide', async () => {
    const el = await render({ title: 'Vide', path: '', text: '  ' });
    expect(el.querySelector('.empty')?.textContent).toContain('Cette fiche est vide.');
  });
});
