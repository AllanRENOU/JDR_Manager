import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { EditorPage } from './editor-page';

describe('EditorPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  async function render(projectId: string) {
    const fixture = TestBed.createComponent(EditorPage);
    fixture.componentRef.setInput('projectId', projectId);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('h1, app-alert')).not.toBeNull();
    });
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le projet en mode Édition avec un lien vers la Présentation et le retour', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    expect(el.querySelector('h1')?.textContent).toContain('La crypte');
    expect(el.querySelector('[aria-label="Mode Édition"]')).not.toBeNull();
    expect(el.querySelector('a[aria-label="Retour aux projets"]')?.getAttribute('href')).toBe(
      '/projects',
    );
    expect(el.querySelector('.header__end a')?.getAttribute('href')).toBe(
      `/projects/${project.id}/play`,
    );
  });

  it('signale un projet introuvable', async () => {
    const el = await render('inconnu');
    expect(el.querySelector('app-alert')?.textContent).toContain('Ce projet est introuvable');
  });

  it('propose de créer la première scène puis l’affiche dans l’arborescence (4.3)', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    expect(el.querySelector('.empty')?.textContent).toContain('pas encore de scène');

    (el.querySelector('.empty button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(el.querySelector('.scene-item')).not.toBeNull());
    expect(el.querySelector('.scene-item')?.textContent).toContain('Première scène');
    expect(el.querySelector('.scene-item app-pill')?.textContent).toContain('1re');
    expect(el.querySelector('.scene-title')?.textContent).toContain('Première scène');
    expect(el.querySelector('.tree__row--selected')).not.toBeNull();
  });

  it('enregistre le texte de scène saisi (4.4)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    (el.querySelector('.empty button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(el.querySelector('textarea')).not.toBeNull());

    const textarea = el.querySelector('textarea') as HTMLTextAreaElement;
    expect(el.querySelector('label')?.classList).toContain('visually-hidden');
    textarea.value = 'Une odeur de terre humide.';
    textarea.dispatchEvent(new Event('input'));

    await vi.waitFor(async () => {
      const scenes = await TestBed.inject(DATA_REPOSITORY).listSceneNodes(project.id);
      const actions = await TestBed.inject(DATA_REPOSITORY).listActions(scenes[0].id);
      expect(actions[0]?.elements[0]).toMatchObject({ text: 'Une odeur de terre humide.' });
    });
  });
});
