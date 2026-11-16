import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';

import { aSheet, aSheetNode } from '../../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { SheetPicker, SheetPickerData } from './sheet-picker';

describe('SheetPicker', () => {
  const pnj = aSheetNode('p1', { id: 'pnj', kind: 'folder', name: 'PNJ' });
  const aubergiste = aSheetNode('p1', { id: 'aubergiste', name: 'Aubergiste', parentId: 'pnj' });
  const garde = aSheetNode('p1', { id: 'garde', name: 'Garde', parentId: 'pnj', order: 1 });
  const pont = aSheetNode('p1', { id: 'pont', name: 'Pont', order: 1 });
  const data: SheetPickerData = {
    nodes: [pnj, aubergiste, garde, pont],
    sheets: [
      aSheet('p1', 'aubergiste', { text: 'Il sert la **bière** au comptoir.' }),
      aSheet('p1', 'garde', { text: 'Surveille le pont jour et nuit.' }),
    ],
  };
  let close: ReturnType<typeof vi.fn>;

  async function render(options: SheetPickerData = data) {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        { provide: DIALOG_DATA, useValue: options },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(SheetPicker);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    const type = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const key = async (k: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
      await fixture.whenStable();
    };
    const titles = () => [...el.querySelectorAll('.option__title')].map((t) => t.textContent);
    return { el, input, type, key, titles };
  }

  it('liste les fiches dans l’ordre de l’arborescence, avec leur chemin (CTL-14)', async () => {
    const { el, input, titles } = await render();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-label')).toBe('Rechercher dans les titres et les textes');
    expect(titles()).toEqual(['Aubergiste', 'Garde', 'Pont']);
    expect(el.querySelector('.option__path')?.textContent).toBe('PNJ');
    expect(el.querySelector('.option__excerpt')).toBeNull();
    expect(el.querySelector('.option')?.getAttribute('aria-selected')).toBe('true');
  });

  it('filtre sur le titre et le texte, avec un extrait où le terme est en gras', async () => {
    const { el, type, titles } = await render();
    await type('pont');
    expect(titles()).toEqual(['Pont', 'Garde']);
    const excerpt = el.querySelectorAll('.option')[1].querySelector('.option__excerpt');
    expect(excerpt?.textContent).toBe('Surveille le pont jour et nuit.');
    expect(excerpt?.querySelector('strong')?.textContent).toBe('pont');

    await type('BIERE');
    expect(titles()).toEqual(['Aubergiste']);
    expect(el.querySelector('.option__excerpt strong')?.textContent).toBe('bière');
  });

  it('flèches haut / bas puis Entrée : renvoie la fiche active', async () => {
    const { el, input, key } = await render();
    await key('ArrowDown');
    await key('ArrowDown');
    const active = el.querySelector('.option--active')!;
    expect(active.textContent).toContain('Pont');
    expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
    await key('ArrowDown');
    expect(el.querySelector('.option--active')?.textContent).toContain('Aubergiste');
    await key('ArrowUp');
    await key('Enter');
    expect(close).toHaveBeenCalledWith('pont');
  });

  it('un clic choisit la fiche', async () => {
    const { el } = await render();
    (el.querySelectorAll('.option')[1] as HTMLElement).click();
    expect(close).toHaveBeenCalledWith('garde');
  });

  it('aucun résultat, ou aucune fiche dans le projet', async () => {
    const { el, type, key } = await render();
    await type('dragon');
    expect(el.querySelector('.empty')?.textContent).toContain(
      'Aucune fiche ne correspond à « dragon ».',
    );
    await key('Enter');
    expect(close).not.toHaveBeenCalled();

    TestBed.resetTestingModule();
    const empty = await render({ nodes: [pnj], sheets: [] });
    expect(empty.el.querySelector('.empty')?.textContent).toContain('Aucune fiche dans ce projet.');
  });
});
