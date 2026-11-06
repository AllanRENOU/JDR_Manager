import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { provideFrenchLocale } from '../../../core/i18n/locale';
import { Modals } from '../../../shared/ui/modal/modals';
import { ProjectsPage } from './projects-page';

describe('ProjectsPage (4.1)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), provideFrenchLocale(), ...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  async function render() {
    const fixture = TestBed.createComponent(ProjectsPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const names = () => [...el.querySelectorAll('.card__name')].map((n) => n.textContent?.trim());
    return { fixture, el, names };
  }

  it('affiche un message sans projet et la carte « Créer un projet » en dernier', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Mes projets');
    expect(el.querySelector('.page__empty')?.textContent).toContain('Aucun projet');
    expect(el.querySelector('.grid li:last-child')?.textContent).toContain('Créer un projet');
  });

  it('liste les projets du plus récent au plus ancien, avec leur date de modification', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    await repository.saveProject(
      aProject({ name: 'Ancien', updatedAt: '2026-01-05T10:00:00.000Z' }),
    );
    await repository.saveProject(
      aProject({ name: 'Récent', updatedAt: '2026-06-01T10:00:00.000Z' }),
    );
    const { el, names } = await render();
    expect(names()).toEqual(['Récent', 'Ancien']);
    expect(el.querySelector('.card__meta')?.textContent).toContain('Modifié le 1 juin 2026');
  });

  it('crée un projet avec le nom saisi', async () => {
    const { fixture, el, names } = await render();
    (el.querySelector('.card__create') as HTMLButtonElement).click();
    TestBed.tick();

    const dialog = document.querySelector('app-create-project-dialog') as HTMLElement;
    const submit = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    const input = dialog.querySelector('input') as HTMLInputElement;
    input.value = '  La crypte oubliée ';
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
    expect(submit.disabled).toBe(false);
    submit.click();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(names()).toEqual(['La crypte oubliée']);
    });
    const [saved] = await TestBed.inject(DATA_REPOSITORY).listProjects();
    expect(saved).toMatchObject({ name: 'La crypte oubliée', firstSceneId: null });
  });

  it('n’enregistre rien si la création est annulée', async () => {
    const { el, fixture } = await render();
    const pending = (fixture.componentInstance as ProjectsPage).createProject();
    TestBed.tick();
    (
      document.querySelector('app-create-project-dialog button[type="button"]') as HTMLButtonElement
    ).click();
    expect(await pending).toBeNull();
    expect(await TestBed.inject(DATA_REPOSITORY).listProjects()).toEqual([]);
    expect(el.querySelectorAll('.card__name')).toHaveLength(0);
  });

  it('ouvre un projet en mode Édition ou Présentation (4.2)', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { el } = await render();
    const [edit, present] = el.querySelectorAll<HTMLAnchorElement>('.card__actions a');
    expect(edit.getAttribute('href')).toBe(`/projects/${project.id}/edit`);
    expect(edit.getAttribute('aria-label')).toBe('Éditer « La crypte »');
    expect(present.getAttribute('href')).toBe(`/projects/${project.id}/play`);
  });
});
