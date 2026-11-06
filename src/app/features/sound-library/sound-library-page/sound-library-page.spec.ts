import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject, aSoundNode } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { GLOBAL_SOUND_LIBRARY, Id } from '../../../core/models';
import { Modals } from '../../../shared/ui/modal/modals';
import { SoundLibraryPage } from './sound-library-page';

describe('SoundLibraryPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  async function render(projectId?: Id) {
    const fixture = TestBed.createComponent(SoundLibraryPage);
    if (projectId) {
      fixture.componentRef.setInput('projectId', projectId);
    }
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('sur /sounds : bibliothèque globale seule, sans navigation de projet (6.1)', async () => {
    const { el } = await render();
    expect(el.querySelector('h1')?.textContent).toContain('Bibliothèque globale');
    expect(el.querySelector('app-project-nav')).toBeNull();
    expect(el.querySelector('app-header a')?.getAttribute('href')).toBe('/projects');
  });

  it('dans un projet : nom du projet, navigation Scènes / Sons et bouton Présenter (6.1)', async () => {
    const project = aProject({ name: 'La crypte' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { fixture, el } = await render(project.id);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('h1')?.textContent).toContain('La crypte');
    });
    const links = [...el.querySelectorAll('app-project-nav a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual([`/projects/${project.id}/edit`, `/projects/${project.id}/sounds`]);
    expect(el.querySelector(`a[href="/projects/${project.id}/play"]`)).not.toBeNull();
  });

  it('signale un projet introuvable', async () => {
    const { fixture, el } = await render('inconnu');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-alert')?.textContent).toContain('introuvable');
    });
  });

  it('affiche « Ce projet » puis « Bibliothèque globale », chacune avec ses dossiers (6.2)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    await TestBed.inject(DATA_REPOSITORY).saveSoundNodes([
      aSoundNode(project.id, { kind: 'folder', name: 'Ambiances' }),
      aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Météo' }),
      aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie' }),
    ]);
    const { fixture, el } = await render(project.id);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('app-tree')).toHaveLength(2);
    });
    const roots = [...el.querySelectorAll('.lib__root')].map((b) => b.textContent?.trim());
    expect(roots).toEqual(['Ce projet', 'Bibliothèque globale']);
    const trees = [...el.querySelectorAll('app-tree')];
    expect(trees.map((t) => t.textContent?.trim())).toEqual(['Ambiances', 'Météo']);
    expect(trees[1].classList).toContain('tree--global');
    expect(el.querySelector('.lib__root')?.getAttribute('aria-current')).toBe('true');

    (trees[1].querySelector('.tree__row') as HTMLElement).click();
    await fixture.whenStable();
    expect(el.querySelector('.lib__root')?.getAttribute('aria-current')).toBeNull();
    expect(trees[1].querySelector('.tree__row--selected')?.textContent).toContain('Météo');
  });

  it('crée un dossier à la racine avec le bouton de la bibliothèque, en renommage (6.2)', async () => {
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.lib__empty')?.textContent).toContain('Aucun dossier');
    });
    const add = el.querySelector('.lib__header button[appButton]') as HTMLButtonElement;
    expect(add.getAttribute('aria-label')).toBe('Nouveau dossier dans « Bibliothèque globale »');
    add.click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.tree__rename')).not.toBeNull();
    });
    const nodes = await TestBed.inject(DATA_REPOSITORY).listSoundNodes(GLOBAL_SOUND_LIBRARY);
    expect(nodes).toEqual([expect.objectContaining({ kind: 'folder', name: 'Nouveau dossier' })]);
  });
});
