import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Id } from '../../../core/models';
import { SheetsPage } from './sheets-page';

describe('SheetsPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  async function render(projectId: Id) {
    const fixture = TestBed.createComponent(SheetsPage);
    fixture.componentRef.setInput('projectId', projectId);
    const el = fixture.nativeElement as HTMLElement;
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sheets__tree, app-alert')).not.toBeNull();
    });
    return el;
  }

  it('affiche le projet, la navigation avec « Fiches » active et l’état vide', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);

    const el = await render(project.id);

    expect(el.querySelector('h1')?.textContent).toContain('La crypte');
    const links = [...el.querySelectorAll('app-project-nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Scènes', 'Fiches', 'Bibliothèque']);
    const present = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Présenter'));
    expect(present?.getAttribute('href')).toBe(`/projects/${project.id}/play?demo=1`);
    expect(el.querySelector('app-settings-button')).not.toBeNull();
    expect(el.querySelector('.sheets__content')?.textContent).toContain(
      'Choisissez une fiche ou créez-en une.',
    );
  });

  it('signale un projet introuvable', async () => {
    const el = await render('inconnu');
    expect(el.querySelector('app-alert')?.textContent).toContain('Ce projet est introuvable');
    expect(el.querySelector('.sheets__tree')).toBeNull();
  });
});
