import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { anAction } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Action } from '../../../core/models';
import { Modals } from '../../../shared/ui/modal/modals';
import { ActionEditor, ActionEditorData, ActionEditorResult } from './action-editor';

describe('ActionEditor', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));
  afterEach(() => TestBed.inject(Modals).closeAll());

  function open(
    action: Action | null,
    context: ActionEditorData['context'] = { soundNames: {}, battlemaps: [], sceneNodes: [] },
  ): {
    ref: DialogRef<ActionEditorResult>;
    dialog: HTMLElement;
    result: Promise<ActionEditorResult | undefined>;
  } {
    const ref = TestBed.inject(Modals).open<ActionEditorResult, ActionEditorData>(ActionEditor, {
      size: 'lg',
      data: {
        action,
        sceneId: 's1',
        projectId: 'p1',
        sceneName: 'La taverne',
        context,
        defaultName: 'Nouvelle action',
      },
    });
    TestBed.tick();
    const dialog = document.querySelector('app-action-editor') as HTMLElement;
    return { ref, dialog, result: firstValueFrom(ref.closed) };
  }
  const button = (dialog: HTMLElement, label: string) =>
    [...dialog.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(label),
    )!;
  const nameInput = (dialog: HTMLElement) => dialog.querySelector('input') as HTMLInputElement;
  const segments = (dialog: HTMLElement) => [
    ...dialog.querySelectorAll<HTMLButtonElement>('app-segmented-control button'),
  ];

  it('nouvelle action : nom proposé, clic du MJ par défaut, sans bouton Supprimer (8.1.1)', async () => {
    const { dialog, result } = open(null);
    expect(dialog.textContent).toContain('Nouvelle action');
    expect(dialog.textContent).toContain('Scène : La taverne');
    expect(nameInput(dialog).value).toBe('Nouvelle action');
    expect(
      segments(dialog).map((s) => [s.textContent?.trim(), s.getAttribute('aria-checked')]),
    ).toEqual([
      ['Ouverture de la scène', 'false'],
      ['Clic du MJ', 'true'],
    ]);
    expect(button(dialog, 'Supprimer l’action')).toBeUndefined();

    nameInput(dialog).value = '  bagarre ';
    nameInput(dialog).dispatchEvent(new Event('input'));
    segments(dialog)[0].click();
    TestBed.tick();
    button(dialog, 'Enregistrer').click();
    expect(await result).toEqual({
      kind: 'save',
      draft: { name: 'Bagarre', trigger: 'scene-open', hidden: false, elements: [] },
    });
  });

  it('refuse un nom vide et l’explique sous le champ (8.1.1, 8.1.3)', async () => {
    const { ref, dialog } = open(anAction('s1', { name: 'Bagarre' }));
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    nameInput(dialog).value = '   ';
    nameInput(dialog).dispatchEvent(new Event('input'));
    button(dialog, 'Enregistrer').click();
    TestBed.tick();
    expect(closed).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain('Donnez un nom à l’action.');
    expect(nameInput(dialog).getAttribute('aria-invalid')).toBe('true');
  });

  it('Annuler ferme sans rien renvoyer ; la copie de travail ne modifie pas l’action', async () => {
    const action = anAction('s1', { name: 'Bagarre' });
    const { dialog, result } = open(action);
    nameInput(dialog).value = 'Autre';
    nameInput(dialog).dispatchEvent(new Event('input'));
    button(dialog, 'Annuler').click();
    expect(await result).toBeUndefined();
    expect(action.name).toBe('Bagarre');
  });

  it('« Texte de scène » : déclencheur figé à l’ouverture de la scène, pas de suppression', () => {
    const { dialog } = open(
      anAction('s1', { name: 'Texte de scène', isSceneText: true, trigger: 'scene-open' }),
    );
    expect(dialog.textContent).toContain('Modifier l’action');
    expect(segments(dialog).every((s) => s.disabled)).toBe(true);
    expect(dialog.textContent).toContain('se lance toujours à l’ouverture de la scène');
    expect(button(dialog, 'Supprimer l’action')).toBeUndefined();
  });

  it('supprime l’action après confirmation (8.1.2)', async () => {
    const { dialog, result } = open(anAction('s1', { name: 'Bagarre' }));
    button(dialog, 'Supprimer l’action').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(
        document.querySelector('app-confirm-dialog .app-button--danger-strong'),
      ).not.toBeNull();
    });
    expect(document.querySelector('app-confirm-dialog')?.textContent).toContain(
      'Supprimer « Bagarre » ?',
    );
    (
      document.querySelector('app-confirm-dialog .app-button--danger-strong') as HTMLButtonElement
    ).click();
    expect(await result).toEqual({ kind: 'delete' });
  });

  it('« Masquer l’action au départ » : seulement pour « Clic du MJ » (ACT-12)', async () => {
    const { dialog, result } = open(anAction('s1', { name: 'La fuite', trigger: 'manual' }));
    const checkbox = () => dialog.querySelector<HTMLInputElement>('.trigger input[type=checkbox]');
    expect(checkbox()?.checked).toBe(false);
    expect(dialog.textContent).toContain('Masquer l’action au départ');
    // Explication en infobulle, plus de texte d'aide visible sous la case.
    const label = checkbox()!.closest('label')!;
    expect(label.getAttribute('title')).toContain('masquée comme une action terminée');
    expect(dialog.querySelector('.trigger__hint')).toBeNull();
    expect(checkbox()!.getAttribute('aria-describedby')).toBe('action-hidden-help');
    checkbox()!.click();
    TestBed.tick();

    // Passée à l'ouverture de la scène : la case disparaît et la propriété n'est pas gardée.
    segments(dialog)[0].click();
    TestBed.tick();
    expect(checkbox()).toBeNull();
    segments(dialog)[1].click();
    TestBed.tick();
    expect(checkbox()?.checked).toBe(true);
    button(dialog, 'Enregistrer').click();
    expect(await result).toMatchObject({ kind: 'save', draft: { hidden: true } });
  });

  it('déclencheur « Ouverture de la scène » : jamais masquée', async () => {
    const { dialog, result } = open(
      anAction('s1', { name: 'Entrée', trigger: 'manual', hidden: true }),
    );
    segments(dialog)[0].click();
    TestBed.tick();
    button(dialog, 'Enregistrer').click();
    expect(await result).toMatchObject({ draft: { trigger: 'scene-open', hidden: false } });
  });

  it('suppression d’une action affichée par une autre : l’avertit (ACT-12, PRS-07)', async () => {
    const target = anAction('s1', { id: 'fuite', name: 'La fuite' });
    const user = anAction('s1', {
      id: 'garde',
      name: 'Le garde',
      elements: [{ id: 'e', type: 'show-action', actionId: 'fuite' }],
    });
    const { dialog } = open(target, {
      soundNames: {},
      battlemaps: [],
      sceneNodes: [],
      actions: [target, user],
    });
    button(dialog, 'Supprimer l’action').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-confirm-dialog')?.textContent).toContain(
        'Elle est affichée ou masquée par 1 autre action, qui la signalera comme introuvable.',
      );
    });
  });

  describe('éléments (8.2)', () => {
    const text = (id: string, value: string) => ({ id, type: 'add-text' as const, text: value });
    const titles = (dialog: HTMLElement) =>
      [...dialog.querySelectorAll('app-element-card')].map((c) =>
        `${c.querySelector('.card__type')?.textContent?.trim()} ${c.querySelector('.card__detail')?.textContent?.trim()}`.trim(),
      );

    it('ajoute un élément par le menu des 10 types, à la fin, seul déplié (8.2.3)', async () => {
      const { dialog, result } = open(
        anAction('s1', { name: 'Bagarre', elements: [text('a', 'Un')] }),
      );
      dialog.querySelector<HTMLButtonElement>('.card__toggle')?.click();
      TestBed.tick();
      expect(dialog.querySelectorAll('app-element-card')[0].classList).toContain('expanded');
      button(dialog, 'Ajouter un élément').click();
      await vi.waitFor(() => {
        TestBed.tick();
        expect(document.querySelectorAll('.types-menu .app-menu-item')).toHaveLength(10);
      });
      const items = [...document.querySelectorAll<HTMLButtonElement>('.types-menu .app-menu-item')];
      expect(items.map((i) => i.textContent?.trim())).toEqual([
        'Afficher une battlemap',
        'Lancer un son',
        'Arrêter un son',
        'Arrêter tous les sons',
        'Afficher un texte',
        'Changer de scène',
        'Afficher l’action',
        'Masquer l’action',
        'Attendre',
        'Clic de l’utilisateur',
      ]);
      items[8].click();
      TestBed.tick();
      expect(titles(dialog)).toEqual(['Afficher un texte Un', 'Attendre 1 s']);
      const cards = [...dialog.querySelectorAll('app-element-card')];
      expect(cards.map((c) => c.classList.contains('expanded'))).toEqual([false, true]);

      button(dialog, 'Enregistrer').click();
      const saved = await result;
      expect(saved?.kind === 'save' && saved.draft.elements.map((e) => e.type)).toEqual([
        'add-text',
        'wait',
      ]);
    });

    it('supprime un élément et réordonne la liste (8.2.1, 8.2.2)', async () => {
      const { ref, dialog, result } = open(
        anAction('s1', { elements: [text('a', 'Un'), text('b', 'Deux'), text('c', 'Trois')] }),
      );
      expect(dialog.textContent).toContain('Glisser pour réordonner');
      const editor = ref.componentInstance as unknown as {
        moveElement(from: number, to: number): void;
      };
      editor.moveElement(2, 0);
      TestBed.tick();
      expect(titles(dialog)).toEqual([
        'Afficher un texte Trois',
        'Afficher un texte Un',
        'Afficher un texte Deux',
      ]);
      expect(
        [...dialog.querySelectorAll('.card__index')].map((i) => i.textContent?.trim()),
      ).toEqual(['1', '2', '3']);

      (
        dialog
          .querySelectorAll('app-element-card')[1]
          .querySelector('.card__head button') as HTMLButtonElement
      ).click();
      TestBed.tick();
      expect(titles(dialog)).toEqual(['Afficher un texte Trois', 'Afficher un texte Deux']);

      button(dialog, 'Enregistrer').click();
      const saved = await result;
      expect(saved?.kind === 'save' && saved.draft.elements.map((e) => e.id)).toEqual(['c', 'b']);
    });
  });
  it('validation globale : bloque l’enregistrement et signale les éléments à corriger (8.4.1)', async () => {
    const { ref, dialog, result } = open(
      anAction('s1', {
        name: 'Bagarre',
        elements: [
          { id: 'e1', type: 'add-text', text: 'Bonjour' },
          { id: 'e2', type: 'user-click', text: '' },
          { id: 'e3', type: 'stop-sound', soundId: '' },
        ],
      }),
    );
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    button(dialog, 'Enregistrer').click();
    TestBed.tick();

    expect(closed).not.toHaveBeenCalled();
    expect(dialog.textContent).toContain('Corrigez les éléments signalés avant d’enregistrer.');
    const cards = [...dialog.querySelectorAll('app-element-card')];
    expect(cards.map((c) => c.classList.contains('invalid'))).toEqual([false, true, true]);
    expect(cards.map((c) => c.classList.contains('expanded'))).toEqual([false, true, true]);
    expect(cards[1].textContent).toContain('Ce texte est obligatoire.');
    expect(cards[2].textContent).toContain('Choisissez un son.');

    const area = cards[1].querySelector('textarea') as HTMLTextAreaElement;
    area.value = 'Il approche.';
    area.dispatchEvent(new Event('input'));
    TestBed.tick();
    expect(cards[1].classList).not.toContain('invalid');

    (cards[2].querySelector('button[aria-label^="Supprimer"]') as HTMLButtonElement).click();
    TestBed.tick();
    expect(dialog.textContent).not.toContain('Corrigez les éléments signalés');
    button(dialog, 'Enregistrer').click();
    expect(await result).toEqual({
      kind: 'save',
      draft: {
        name: 'Bagarre',
        trigger: 'manual',
        hidden: false,
        elements: [
          { id: 'e1', type: 'add-text', text: 'Bonjour' },
          { id: 'e2', type: 'user-click', text: 'Il approche.' },
        ],
      },
    });
  });

  it('une cible supprimée n’empêche pas l’enregistrement (PRS-07, 8.4.1)', async () => {
    const { dialog, result } = open(
      anAction('s1', {
        name: 'Fuite',
        elements: [{ id: 'e1', type: 'change-scene', sceneId: 'supprimée' }],
      }),
    );
    button(dialog, 'Enregistrer').click();
    expect(await result).toMatchObject({ kind: 'save' });
  });
});
