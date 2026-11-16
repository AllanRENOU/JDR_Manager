import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BlobWriter } from '@zip.js/zip.js';

import { aPlaySession, aProject, aSceneNode } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { provideFrenchLocale } from '../../../core/i18n/locale';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { collectProject } from '../../project-transfer/collect-project';
import { DEFAULT_EXPORT_OPTIONS, buildArchive } from '../../project-transfer/project-archive';
import { writeProjectZip } from '../../project-transfer/zip-writer';
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
    const logo = el.querySelector('.logo') as HTMLElement;
    expect(logo.textContent?.trim()).toBe('JDR Manager');
    expect(logo.querySelector('svg.logo__mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.page__empty')?.textContent).toContain('Aucun projet');
    expect(el.querySelector('.grid li:last-child')?.textContent).toContain('Créer un projet');
    const settings = el.querySelector('a[href="/settings"]') as HTMLAnchorElement;
    expect(settings.getAttribute('aria-label')).toBe('Ouvrir les paramètres');
    const library = el.querySelector('a[href="/library"]') as HTMLAnchorElement;
    expect(library.textContent?.trim()).toBe('Bibliothèque globale');
    expect(library.getAttribute('aria-label')).toBe(
      'Ouvrir la bibliothèque globale (sons et vidéos)',
    );
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

  it('crée un projet avec le nom saisi puis l’ouvre en mode Édition', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { el } = await render();
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

    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    const [saved] = await TestBed.inject(DATA_REPOSITORY).listProjects();
    expect(saved).toMatchObject({ name: 'La crypte oubliée', firstSceneId: null });
    expect(navigate).toHaveBeenCalledWith(['/projects', saved.id, 'edit']);
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
    const edit = el.querySelector('.card__link') as HTMLAnchorElement;
    const [present] = el.querySelectorAll<HTMLAnchorElement>('.card__actions a');
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

  describe('import (16.5)', () => {
    useNodeBlob();

    it('importe un projet exporté depuis « Importer un projet »', async () => {
      const repository = TestBed.inject(DATA_REPOSITORY);
      await repository.saveProject(aProject({ id: 'p1', name: 'La crypte' }));
      await repository.saveSceneNodes([aSceneNode('p1')]);
      const archive = buildArchive(await collectProject(repository, 'p1'), DEFAULT_EXPORT_OPTIONS);
      const zip = await writeProjectZip<Blob>(new BlobWriter(), archive, (id) =>
        repository.getMediaBlob(id),
      );
      await repository.deleteProject('p1');
      const { fixture, el, names } = await render();
      expect(names()).toEqual([]);

      const button = [...el.querySelectorAll<HTMLButtonElement>('.page__heading button')][0];
      expect(button.textContent).toContain('Importer un projet');
      const input = el.querySelector<HTMLInputElement>('.page__heading input[type="file"]')!;
      expect(input.accept).toBe('.zip,application/zip');
      Object.defineProperty(input, 'files', {
        value: [new File([zip], 'La crypte.zip', { type: 'application/zip' })],
      });
      input.dispatchEvent(new Event('change'));

      const submit = await vi.waitFor(() => {
        TestBed.tick();
        const found = [
          ...document.querySelectorAll<HTMLButtonElement>(
            'app-import-project-dialog .modal__footer button',
          ),
        ].find((b) => b.textContent?.includes('Importer'));
        expect(found).toBeDefined();
        return found!;
      });
      submit.click();

      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(names()).toEqual(['La crypte']);
      });
      expect(
        TestBed.inject(Notifications)
          .notifications()
          .map((n) => n.message),
      ).toContain('Projet « La crypte » importé.');
      expect(await repository.listSceneNodes('p1')).toHaveLength(1);
    });
  });

  describe('export (16.4)', () => {
    useNodeBlob();
    const objectUrls = stubObjectUrls();

    it('exporte un projet depuis le menu « ⋯ » de sa carte', async () => {
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);
      const project = aProject({ name: 'La crypte' });
      await TestBed.inject(DATA_REPOSITORY).saveProject(project);
      const { el } = await render();

      (el.querySelector('.card__more') as HTMLButtonElement).click();
      TestBed.tick();
      [...document.querySelectorAll<HTMLButtonElement>('.app-menu button')]
        .find((b) => b.textContent?.includes('Exporter'))!
        .click();
      TestBed.tick();

      // Fenêtre chargée à la demande (import dynamique).
      const dialog = await vi.waitFor(() => {
        TestBed.tick();
        const found = document.querySelector<HTMLElement>('app-export-project-dialog');
        expect(found).not.toBeNull();
        return found!;
      });
      expect(dialog.textContent).toContain('Exporter le projet');
      const submit = () =>
        [...dialog.querySelectorAll<HTMLButtonElement>('.modal__footer button')].find((b) =>
          b.textContent?.includes('Exporter'),
        );
      await vi.waitFor(() => {
        TestBed.tick();
        expect(submit()?.disabled).toBe(false);
      });
      submit()!.click();

      await vi.waitFor(() =>
        expect(
          TestBed.inject(Notifications)
            .notifications()
            .map((n) => n.message),
        ).toContain('Projet « La crypte » exporté.'),
      );
      expect(click).toHaveBeenCalled();
      expect(objectUrls.createObjectURL.mock.calls[0][0].type).toBe('application/zip');
      click.mockRestore();
    });
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
