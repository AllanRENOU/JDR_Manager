import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aPlaySession, aProject, aSceneNode } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { provideFrenchLocale } from '../../../core/i18n/locale';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
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
    const settings = el.querySelector('a[href="/settings"]') as HTMLAnchorElement;
    expect(settings.getAttribute('aria-label')).toBe('Ouvrir les paramètres');
    const sounds = el.querySelector('a[href="/sounds"]') as HTMLAnchorElement;
    expect(sounds.getAttribute('aria-label')).toBe('Ouvrir la bibliothèque globale de sons');
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
    expect(el.querySelectorAll('.grid > li')).toHaveLength(3);
    expect(el.querySelector('.grid > li:last-child')?.textContent).toContain('Créer un projet');
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

  it('renomme un projet depuis le menu « ⋯ » de sa carte (5.1.5)', async () => {
    const project = aProject({ name: 'La crypte', updatedAt: '2026-01-05T10:00:00.000Z' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { fixture, el, names } = await render();

    const more = el.querySelector('.card__more') as HTMLButtonElement;
    expect(more.getAttribute('aria-label')).toBe('Plus d’actions pour « La crypte »');
    more.click();
    TestBed.tick();
    const item = [...document.querySelectorAll<HTMLButtonElement>('.app-menu button')].find((b) =>
      b.textContent?.includes('Renommer'),
    );
    item!.click();
    TestBed.tick();

    const dialog = document.querySelector('app-create-project-dialog') as HTMLElement;
    expect(dialog.textContent).toContain('Renommer le projet');
    const input = dialog.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('La crypte');
    input.value = ' La crypte oubliée ';
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
    (dialog.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(names()).toEqual(['La crypte oubliée']);
    });
    const saved = await TestBed.inject(DATA_REPOSITORY).getProject(project.id);
    expect(saved?.name).toBe('La crypte oubliée');
    expect(saved?.updatedAt).not.toBe(project.updatedAt);
  });

  it('ne modifie rien si le renommage est annulé ou garde le même nom', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { fixture } = await render();
    const page = fixture.componentInstance as ProjectsPage;

    const cancelled = page.renameProject(project);
    TestBed.tick();
    (
      document.querySelector('app-create-project-dialog button[type="button"]') as HTMLButtonElement
    ).click();
    expect(await cancelled).toBe(false);

    const unchanged = page.renameProject(project);
    TestBed.tick();
    (
      document.querySelector('app-create-project-dialog button[type="submit"]') as HTMLButtonElement
    ).click();
    expect(await unchanged).toBe(false);
    expect(await TestBed.inject(DATA_REPOSITORY).getProject(project.id)).toEqual(project);
  });

  it('supprime un projet et son contenu après confirmation (5.1.6)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const kept = aProject({ name: 'Gardé', updatedAt: '2026-01-05T10:00:00.000Z' });
    const project = aProject({ name: 'La crypte', updatedAt: '2026-06-01T10:00:00.000Z' });
    const scene = aSceneNode(project.id);
    await repository.saveProject(kept);
    await repository.saveProject(project);
    await repository.saveSceneNodes([scene]);
    await repository.savePlaySession(aPlaySession(project.id, scene.id));
    const { fixture, el, names } = await render();

    (el.querySelector('.card__more') as HTMLButtonElement).click();
    TestBed.tick();
    const item = [...document.querySelectorAll<HTMLButtonElement>('.app-menu button')].find((b) =>
      b.textContent?.includes('Supprimer'),
    );
    item!.click();
    TestBed.tick();

    const dialog = document.querySelector('app-confirm-dialog') as HTMLElement;
    expect(dialog.textContent).toContain('Supprimer « La crypte » ?');
    expect(dialog.textContent).toContain('irréversible');
    const confirm = [...dialog.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('Supprimer le projet'),
    );
    confirm!.click();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(names()).toEqual(['Gardé']);
    });
    expect(await repository.getProject(project.id)).toBeUndefined();
    expect(await repository.listSceneNodes(project.id)).toEqual([]);
    expect(await repository.getPlaySession(project.id)).toBeUndefined();
    expect(TestBed.inject(Notifications).notifications()).toEqual([
      expect.objectContaining({ tone: 'info', message: 'Projet « La crypte » supprimé.' }),
    ]);
  });

  it('ne supprime rien si la suppression est annulée', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { fixture } = await render();

    const pending = (fixture.componentInstance as ProjectsPage).deleteProject(project);
    TestBed.tick();
    (document.querySelector('app-confirm-dialog button') as HTMLButtonElement).click();
    expect(await pending).toBe(false);
    expect(await TestBed.inject(DATA_REPOSITORY).getProject(project.id)).toEqual(project);
  });
});
