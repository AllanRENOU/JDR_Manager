import { TestBed } from '@angular/core/testing';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ChangeSceneElement, UserClickElement, WaitElement } from '../../../core/models';
import { ActionPause } from './action-pause';

describe('ActionPause', () => {
  async function render(
    element: WaitElement | UserClickElement | ChangeSceneElement,
    sceneName: string | null = null,
  ): Promise<HTMLElement> {
    TestBed.configureTestingModule({ imports: [ActionPause, getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(ActionPause);
    fixture.componentRef.setInput('element', element);
    fixture.componentRef.setInput('sceneName', sceneName);
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

  it('Changer de scène : « Aller à la scène » avec le nom de la scène cible', async () => {
    const el = await render({ id: 's', type: 'change-scene', sceneId: 'b' }, 'La forêt');
    expect(el.querySelector('.pause__text')?.textContent?.trim()).toBe(
      "Aller à la scène 'La forêt'",
    );
    expect(el.classList).toContain('pause--scene');
    expect(el.querySelector('.pause__missing')).toBeNull();
  });

  it('Changer de scène vers une scène supprimée : signalé (PRS-07)', async () => {
    const el = await render({ id: 's', type: 'change-scene', sceneId: 'b' }, null);
    expect(el.querySelector('.pause__missing')?.textContent?.trim()).toBe(
      'Changer de scène : scène supprimée',
    );
  });
});
