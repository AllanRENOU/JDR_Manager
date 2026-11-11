import { TestBed } from '@angular/core/testing';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { UserClickElement, WaitElement } from '../../../core/models';
import { ActionPause } from './action-pause';

describe('ActionPause', () => {
  async function render(element: WaitElement | UserClickElement): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [ActionPause, getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(ActionPause);
    fixture.componentRef.setInput('element', element);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche la durée d’une attente', async () => {
    const el = await render({ id: 'w', type: 'wait', seconds: 5 });
    expect(el.textContent?.replace(/\s+/g, ' ').trim()).toBe('Attendre 5 s');
    expect(el.classList).not.toContain('pause--click');
  });

  it('affiche le texte facultatif d’une attente sous sa durée', async () => {
    const el = await render({ id: 'w', type: 'wait', seconds: 5, text: 'Le garde passe.' });
    expect(el.textContent).toContain('Attendre 5 s');
    expect(el.querySelector('.pause__note')?.textContent?.trim()).toBe('Le garde passe.');
  });

  it('attente sans texte (ou texte vide) : pas de ligne de texte', async () => {
    const el = await render({ id: 'w', type: 'wait', seconds: 5, text: '  ' });
    expect(el.querySelector('.pause__note')).toBeNull();
  });

  it('affiche le texte d’un clic de l’utilisateur, en lecture seule', async () => {
    const el = await render({ id: 'c', type: 'user-click', text: 'On continue ?' });
    expect(el.querySelector('.visually-hidden')?.textContent?.trim()).toBe(
      'Clic de l’utilisateur :',
    );
    expect(el.querySelector('.pause__text')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Clic de l’utilisateur : On continue ?',
    );
    expect(el.querySelector('textarea, input')).toBeNull();
    expect(el.classList).toContain('pause--click');
  });
});
