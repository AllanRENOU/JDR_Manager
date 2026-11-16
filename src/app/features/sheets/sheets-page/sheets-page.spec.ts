import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  aProject,
  aSceneNode,
  aSheet,
  aSheetNode,
  anAction,
} from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Id } from '../../../core/models';
import { UiPreferences } from '../../../core/preferences/ui-preferences';
import { Modals } from '../../../shared/ui/modal/modals';
import { lastOpenedSheetKey } from '../sheets-store';
import { SheetsPage } from './sheets-page';

describe('SheetsPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  afterEach(() => {
    TestBed.inject(Modals).closeAll();
    localStorage.clear();
  });

  async function render(projectId: Id) {
    return (await renderFixture(projectId)).el;
  }

  async function renderFixture(projectId: Id) {
    const fixture = TestBed.createComponent(SheetsPage);
    fixture.componentRef.setInput('projectId', projectId);
    const el = fixture.nativeElement as HTMLElement;
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sheets__tree, app-alert')).not.toBeNull();
    });
    return { fixture, el };
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

  it('crée un dossier et une fiche avec les boutons du haut, puis les renomme sur place (FCH-03)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    const button = (label: string) =>
      el.querySelector(`.tree-header button[aria-label="${label}"]`) as HTMLButtonElement;

    button('Nouveau dossier').click();
    await vi.waitFor(() => expect(el.querySelector('.tree__rename')).not.toBeNull());
    expect((el.querySelector('.tree__rename') as HTMLInputElement).value).toBe('Nouveau dossier');
    el.querySelector('.tree__rename')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );

    button('Nouvelle fiche').click();
    await vi.waitFor(() =>
      expect((el.querySelector('.tree__rename') as HTMLInputElement | null)?.value).toBe(
        'Nouvelle fiche',
      ),
    );
    const input = el.querySelector('.tree__rename') as HTMLInputElement;
    input.value = 'Garde du pont';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    const repository = TestBed.inject(DATA_REPOSITORY);
    await vi.waitFor(async () =>
      expect((await repository.listSheetNodes(project.id)).map((n) => [n.kind, n.name])).toEqual([
        ['folder', 'Nouveau dossier'],
        ['item', 'Garde du pont'],
      ]),
    );
    await vi.waitFor(async () => {
      await new Promise((resolve) => setTimeout(resolve));
      expect((el.querySelector('.sheet__title') as HTMLInputElement | null)?.value).toBe(
        'Garde du pont',
      );
    });
  });

  it('crée la première fiche depuis l’état vide', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);

    (el.querySelector('.empty button') as HTMLButtonElement).click();

    await vi.waitFor(() => expect(el.querySelector('.tree__rename')).not.toBeNull());
    expect(await TestBed.inject(DATA_REPOSITORY).listSheets(project.id)).toHaveLength(1);
  });

  it('filtre l’arborescence sur le titre et le texte, et signale l’absence de résultat (FCH-06)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde' });
    const pont = aSheetNode(project.id, { name: 'Pont', order: 1 });
    await repository.saveProject(project);
    await repository.saveSheetNodes([folder, garde, pont]);
    await repository.saveSheet(aSheet(project.id, garde.id, { text: 'Surveille le **passage**.' }));
    const el = await render(project.id);
    const labels = () => [...el.querySelectorAll('.tree__label')].map((l) => l.textContent?.trim());
    await vi.waitFor(() => expect(labels()).toEqual(['PNJ', 'Garde', 'Pont']));

    const search = el.querySelector('input[type="search"]') as HTMLInputElement;
    expect(search.getAttribute('aria-label')).toBe('Rechercher dans les fiches');
    search.value = 'passage';
    search.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(labels()).toEqual(['PNJ', 'Garde']));

    search.value = 'dragon';
    search.dispatchEvent(new Event('input'));
    await vi.waitFor(() =>
      expect(el.querySelector('.no-result')?.textContent).toContain(
        'Aucune fiche ne correspond à « dragon ».',
      ),
    );
  });

  it('avertit avant de supprimer une fiche affichée par des actions (FCH-07)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
    const garde = aSheetNode(project.id, { parentId: folder.id, name: 'Garde' });
    const pont = aSheetNode(project.id, { name: 'Pont', order: 1 });
    await repository.saveProject(project);
    await repository.saveSheetNodes([folder, garde, pont]);
    await repository.saveSceneNodes([aSceneNode(project.id, { id: 'scene' })]);
    for (const name of ['Accueil', 'Fouille']) {
      await repository.saveAction(
        anAction('scene', {
          name,
          elements: [{ id: name, type: 'show-sheet', sheetId: garde.id }],
        }),
      );
    }
    const el = await render(project.id);
    await vi.waitFor(() => expect(el.querySelectorAll('.tree__row')).toHaveLength(3));

    const confirmText = async (row: string) => {
      const target = [...el.querySelectorAll<HTMLElement>('.tree__row')].find((r) =>
        r.textContent?.includes(row),
      )!;
      (target.querySelector('.tree__more') as HTMLButtonElement).click();
      await vi.waitFor(() => expect(document.querySelector('.app-menu')).not.toBeNull());
      [...document.querySelectorAll<HTMLButtonElement>('.app-menu .app-menu-item')]
        .find((b) => b.textContent?.includes('Supprimer'))!
        .click();
      await vi.waitFor(() => {
        TestBed.tick();
        expect(document.querySelector('app-confirm-dialog')).not.toBeNull();
      });
      const text = document.querySelector('app-confirm-dialog')!.textContent ?? '';
      [...document.querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')]
        .find((b) => b.textContent?.includes('Annuler'))!
        .click();
      await vi.waitFor(() => {
        TestBed.tick();
        expect(document.querySelector('app-confirm-dialog')).toBeNull();
      });
      return text;
    };

    expect(await confirmText('Garde')).toContain(
      'Cette fiche est affichée par 2 actions « Afficher une fiche », qui la signaleront comme supprimée.',
    );
    expect(await confirmText('PNJ')).toContain(
      'Ses fiches sont affichées par 2 actions « Afficher une fiche »',
    );
    expect(await confirmText('Pont')).toContain('La fiche « Pont » sera supprimée.');
  });

  describe('fiche ouverte (FCH-04, FCH-05, FCH-07)', () => {
    async function prepare() {
      const repository = TestBed.inject(DATA_REPOSITORY);
      const project = aProject();
      const folder = aSheetNode(project.id, { kind: 'folder', name: 'PNJ' });
      const sub = aSheetNode(project.id, { kind: 'folder', name: 'Village', parentId: folder.id });
      const garde = aSheetNode(project.id, { parentId: sub.id, name: 'Garde' });
      const pont = aSheetNode(project.id, { name: 'Pont', order: 1 });
      await repository.saveProject(project);
      await repository.saveSheetNodes([folder, sub, garde, pont]);
      await repository.saveSheet(aSheet(project.id, garde.id, { text: 'Fatigué' }));
      await repository.saveSheet(aSheet(project.id, pont.id, { text: 'Fatigué' }));
      await repository.saveSceneNodes([aSceneNode(project.id, { id: 'scene' })]);
      await repository.saveAction(
        anAction('scene', { elements: [{ id: 'e', type: 'show-sheet', sheetId: garde.id }] }),
      );
      TestBed.inject(UiPreferences).set(lastOpenedSheetKey(project.id), garde.id);
      return { repository, project, garde, pont };
    }

    const textarea = (el: HTMLElement) =>
      el.querySelector('.sheet__text textarea') as HTMLTextAreaElement;
    const title = (el: HTMLElement) => el.querySelector('.sheet__title') as HTMLInputElement;

    it('affiche le chemin, le titre, le texte et le nombre d’actions qui l’utilisent', async () => {
      const { project } = await prepare();
      const el = await render(project.id);
      await vi.waitFor(() => expect(title(el)).not.toBeNull());

      expect(el.querySelector('.sheet__path')?.textContent?.trim()).toBe('PNJ › Village');
      expect(title(el).value).toBe('Garde');
      expect(title(el).getAttribute('aria-label')).toBe('Titre de la fiche');
      expect(textarea(el).value).toBe('Fatigué');
      expect(el.querySelector('.sheet__usage')?.textContent).toContain('Utilisée dans 1 action');
    });

    it('enregistre le texte saisi à la sortie du champ et l’indique dans l’en-tête', async () => {
      const { project, repository, garde } = await prepare();
      const el = await render(project.id);
      await vi.waitFor(() => expect(textarea(el)).not.toBeNull());

      textarea(el).value = 'Fatigué et **bavard**';
      textarea(el).dispatchEvent(new Event('input'));
      textarea(el).dispatchEvent(new Event('blur'));

      await vi.waitFor(async () =>
        expect((await repository.getSheet(garde.id))?.text).toBe('Fatigué et **bavard**'),
      );
      await vi.waitFor(() =>
        expect(el.querySelector('.save-state')?.textContent).toContain('Enregistré'),
      );
    });

    it('repart du texte de l’autre fiche quand on en change, même si les textes sont égaux', async () => {
      const { project, repository, garde, pont } = await prepare();
      const el = await render(project.id);
      await vi.waitFor(() => expect(textarea(el)).not.toBeNull());
      textarea(el).value = 'Saisie en cours';
      textarea(el).dispatchEvent(new Event('input'));

      const row = [...el.querySelectorAll<HTMLElement>('.tree__row')].find((r) =>
        r.textContent?.includes('Pont'),
      )!;
      row.click();

      await vi.waitFor(async () => {
        await new Promise((resolve) => setTimeout(resolve));
        expect(title(el).value).toBe('Pont');
      });
      expect(textarea(el).value).toBe('Fatigué');
      expect(el.querySelector('.sheet__path')).toBeNull();
      expect(el.querySelector('.sheet__usage')?.textContent).toContain(
        'Utilisée dans aucune action',
      );
      expect((await repository.getSheet(garde.id))?.text).toBe('Saisie en cours');
      expect((await repository.getSheet(pont.id))?.text).toBe('Fatigué');
    });

    it('renomme la fiche depuis son titre ; Échap annule, un titre vide est refusé', async () => {
      const { project, repository } = await prepare();
      const el = await render(project.id);
      await vi.waitFor(() => expect(title(el)).not.toBeNull());

      title(el).value = 'Autre';
      title(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      title(el).dispatchEvent(new Event('blur'));
      title(el).value = '   ';
      title(el).dispatchEvent(new Event('blur'));
      expect(title(el).value).toBe('Garde');

      title(el).value = 'Garde du pont';
      title(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      title(el).dispatchEvent(new Event('blur'));
      await vi.waitFor(async () =>
        expect(
          (await repository.listSheetNodes(project.id)).find(
            (n) => n.kind === 'item' && n.order === 0,
          )?.name,
        ).toBe('Garde du pont'),
      );
      await vi.waitFor(() =>
        expect(
          [...el.querySelectorAll('.tree__label')].map((l) => l.textContent?.trim()),
        ).toContain('Garde du pont'),
      );
    });

    it('enregistre la saisie en attente quand on quitte l’écran', async () => {
      const { project, repository, garde } = await prepare();
      const { fixture, el } = await renderFixture(project.id);
      await vi.waitFor(() => expect(textarea(el)).not.toBeNull());
      textarea(el).value = 'Avant de partir';
      textarea(el).dispatchEvent(new Event('input'));

      fixture.destroy();

      await vi.waitFor(async () =>
        expect((await repository.getSheet(garde.id))?.text).toBe('Avant de partir'),
      );
    });
  });
});
