import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { TreeNode } from '../../core/models';
import { Modals } from '../ui/modal/modals';
import { Selections } from './selections';

const SCENES: TreeNode[] = [
  { id: 'acte1', parentId: null, order: 0, kind: 'folder', name: 'Acte 1' },
  { id: 'taverne', parentId: 'acte1', order: 0, kind: 'item', name: 'La taverne' },
  { id: 'marche', parentId: 'acte1', order: 1, kind: 'item', name: 'Le marché' },
  { id: 'crypte', parentId: null, order: 1, kind: 'item', name: 'La crypte' },
];

describe('Selections / SelectionDialog', () => {
  let selections: Selections;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    selections = TestBed.inject(Selections);
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  const dialog = () => document.querySelector('app-selection-dialog') as HTMLElement;
  const labels = () =>
    [...dialog().querySelectorAll('.tree__label')].map((el) =>
      (el as HTMLElement).textContent?.trim(),
    );
  const row = (name: string) =>
    [...dialog().querySelectorAll<HTMLElement>('.tree__row')].find((r) =>
      r.textContent?.includes(name),
    )!;
  const footer = () => dialog().querySelectorAll<HTMLButtonElement>('.modal__footer button');
  const search = (text: string) => {
    const input = dialog().querySelector('input[type="search"]') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
  };

  describe('fenêtre, recherche, compteur (3.3.1)', () => {
    it('affiche l’arborescence en lecture seule, le titre et le compteur', () => {
      void selections.select({
        title: 'Scènes suivantes',
        subtitle: 'Scène : La crypte',
        nodes: SCENES,
        mode: 'multiple',
      });
      TestBed.tick();
      expect(dialog().querySelector('h2')?.textContent).toContain('Scènes suivantes');
      expect(dialog().querySelector('[role="tree"]')?.getAttribute('aria-label')).toBe(
        'Scènes suivantes',
      );
      expect(dialog().querySelector('.tree__more')).toBeNull();
      expect(labels()).toEqual(['Acte 1', 'La taverne', 'Le marché', 'La crypte']);
      expect(dialog().querySelector('.selection__count')?.textContent).toContain(
        '0 sélectionné(s)',
      );
    });

    it('filtre par recherche (sans accents) et indique l’absence de résultat', () => {
      void selections.select({ title: 'Scènes', nodes: SCENES, mode: 'multiple' });
      TestBed.tick();
      search('marche');
      expect(labels()).toEqual(['Acte 1', 'Le marché']);
      search('dragon');
      expect(dialog().querySelector('.selection__empty')?.textContent).toContain('Aucun résultat');
      search('');
      expect(labels()).toHaveLength(4);
    });

    it('renvoie null si l’utilisateur annule', async () => {
      const result = selections.select({ title: 'Scènes', nodes: SCENES, mode: 'multiple' });
      TestBed.tick();
      footer()[0].click();
      expect(await result).toBeNull();
    });
  });

  describe('modes de sélection (3.3.2)', () => {
    it('multiple : pré-cochés, élément désactivé, compteur et résultat', async () => {
      const result = selections.select({
        title: 'Scènes suivantes',
        nodes: SCENES,
        mode: 'multiple',
        checkedIds: ['marche'],
        disabledIds: ['crypte'],
        labels: { disabled: 'scene.current' },
      });
      TestBed.tick();
      expect(row('La crypte').textContent).toContain('scène actuelle');
      expect(dialog().querySelector('.selection__count')?.textContent).toContain(
        '1 sélectionné(s)',
      );

      row('La taverne').click();
      row('La crypte').click(); // désactivée : ignorée
      TestBed.tick();
      expect(dialog().querySelector('.selection__count')?.textContent).toContain(
        '2 sélectionné(s)',
      );
      footer()[1].click();
      expect(await result).toEqual(['marche', 'taverne']);
    });

    it('unique : bouton radio, validation impossible tant que rien n’est choisi', async () => {
      const result = selections.select({
        title: 'Scène cible',
        nodes: SCENES,
        mode: 'single',
        confirmLabel: 'Choisir',
      });
      TestBed.tick();
      const [, confirm] = footer();
      expect(confirm.textContent).toContain('Choisir');
      expect(confirm.disabled).toBe(true);
      expect(dialog().querySelector('.tree__check')?.getAttribute('type')).toBe('radio');

      row('La taverne').click();
      row('La crypte').click();
      TestBed.tick();
      expect(confirm.disabled).toBe(false);
      confirm.click();
      expect(await result).toEqual(['crypte']);
    });

    it('la recherche ne perd pas les éléments déjà cochés', async () => {
      const result = selections.select({
        title: 'Scènes',
        nodes: SCENES,
        mode: 'multiple',
        checkedIds: ['crypte'],
      });
      TestBed.tick();
      search('taverne');
      row('La taverne').click();
      TestBed.tick();
      footer()[1].click();
      expect(await result).toEqual(['crypte', 'taverne']);
    });
  });
});
