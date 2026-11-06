import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject, aScene, aSceneNode, anAction } from '../../../../../testing/data-builders';
import { useTestRepository } from '../../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../../core/data/data-repository';
import { GmScreenPage } from './gm-screen-page';

describe('GmScreenPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  async function render(projectId: string) {
    const fixture = TestBed.createComponent(GmScreenPage);
    fixture.componentRef.setInput('projectId', projectId);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('h1, app-alert')).not.toBeNull();
    });
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le projet en mode Présentation', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    expect(el.querySelector('app-header')?.classList).toContain('app-header--play');
    expect(el.querySelector('h1')?.textContent).toContain('La crypte');
    expect(el.querySelector('[aria-label="Mode Présentation"]')).not.toBeNull();
  });

  it('signale un projet introuvable', async () => {
    const el = await render('inconnu');
    expect(el.querySelector('app-alert')?.textContent).toContain('Ce projet est introuvable');
  });

  it('indique qu’un projet sans scène n’a rien à présenter (4.8)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    await vi.waitFor(() =>
      expect(el.querySelector('app-alert')?.textContent).toContain('pas encore de scène'),
    );
    expect(el.querySelector('app-alert a')?.getAttribute('href')).toBe(
      `/projects/${project.id}/edit`,
    );
  });

  it('affiche le texte de scène dans le fil d’actualité (4.8)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject({ name: 'La crypte' });
    const node = aSceneNode(project.id, { name: 'Entrée' });
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    await repository.saveAction(
      anAction(node.id, {
        trigger: 'scene-open',
        isSceneText: true,
        elements: [{ id: 'e1', type: 'add-text', text: 'La porte grince.' }],
      }),
    );

    const el = await render(project.id);
    await vi.waitFor(() =>
      expect(el.querySelector('.feed__text')?.textContent).toContain('La porte grince.'),
    );
    expect(el.querySelector('h1')?.textContent).toContain('› Entrée');
    expect(el.querySelector('.feed')?.getAttribute('aria-label')).toBe('Fil d’actualité');
  });
});
