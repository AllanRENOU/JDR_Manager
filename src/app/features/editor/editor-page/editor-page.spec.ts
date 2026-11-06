import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject, aScene, aSceneNode, anAction } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Modals } from '../../../shared/ui/modal/modals';
import { EditorPage } from './editor-page';

describe('EditorPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideRouter([]), ...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

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
    // L'étoile apparaît quand le projet est enregistré, juste après la scène.
    await vi.waitFor(() =>
      expect(el.querySelector('.scene-item [aria-label="Première scène"]')).not.toBeNull(),
    );
    expect(el.querySelector('.scene-item')?.textContent).toContain('Première scène');
    expect((el.querySelector('.scene-title') as HTMLInputElement).value).toBe('Première scène');
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

  it('organise l’écran : arborescence, textes au centre, volet droit en trois parties (7.1.1)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    expect(el.querySelector('.editor__settings')).toBeNull();
    (el.querySelector('.empty button') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(el.querySelector('.editor__settings')).not.toBeNull());

    expect(el.querySelector('.editor__tree')?.getAttribute('aria-label')).toBe('Scènes du projet');
    expect(el.querySelector('.editor__content')?.getAttribute('aria-label')).toBe(
      'Textes de la scène',
    );
    const titles = [...el.querySelectorAll('.editor__settings .section__title')].map((t) =>
      t.textContent?.trim(),
    );
    expect(titles).toEqual(['Actions', 'Battlemaps', 'Enchaînement']);
    expect(
      [...el.querySelectorAll('.editor__settings .section__toggle')].map((b) =>
        b.getAttribute('aria-expanded'),
      ),
    ).toEqual(['true', 'true', 'true']);
  });

  it('crée un dossier et une scène avec les boutons du haut, puis les renomme sur place (7.1.2)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const el = await render(project.id);
    const button = (label: string) =>
      el.querySelector(`.tree-header button[aria-label="${label}"]`) as HTMLButtonElement;

    button('Nouveau dossier').click();
    await vi.waitFor(() => expect(el.querySelector('.tree__rename')).not.toBeNull());
    const input = el.querySelector('.tree__rename') as HTMLInputElement;
    expect(input.value).toBe('Nouveau dossier');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    button('Nouvelle scène').click();
    await vi.waitFor(() =>
      expect((el.querySelector('.tree__rename') as HTMLInputElement | null)?.value).toBe(
        'Nouvelle scène',
      ),
    );
    expect((el.querySelector('.scene-title') as HTMLInputElement).value).toBe('Nouvelle scène');
    const nodes = await TestBed.inject(DATA_REPOSITORY).listSceneNodes(project.id);
    expect(nodes.map((n) => [n.kind, n.name, n.parentId])).toEqual([
      ['folder', 'Nouveau dossier', null],
      ['item', 'Nouvelle scène', null],
    ]);
  });

  it('menu des scènes et des dossiers : entrées propres aux scènes, suppression confirmée (7.1.3)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const act = aSceneNode(project.id, { kind: 'folder', name: 'Acte I' });
    const tavern = aSceneNode(project.id, { name: 'Taverne', parentId: act.id });
    await repository.saveProject({ ...project, firstSceneId: tavern.id });
    await repository.saveSceneNodes([act, tavern]);
    await repository.saveScene(aScene(project.id, tavern.id));
    const el = await render(project.id);
    await vi.waitFor(() => expect(el.querySelectorAll('.tree__row')).toHaveLength(2));
    const menu = async (row: number) => {
      (el.querySelectorAll('.tree__more')[row] as HTMLButtonElement).click();
      await vi.waitFor(() => expect(document.querySelector('.app-menu')).not.toBeNull());
      return [...document.querySelectorAll<HTMLButtonElement>('.app-menu .app-menu-item')];
    };
    const labels = (items: HTMLButtonElement[]) => items.map((b) => b.textContent?.trim());

    const folderItems = await menu(0);
    expect(labels(folderItems)).toEqual([
      'Nouvelle scène',
      'Nouveau sous-dossier',
      'Renommer',
      'Supprimer',
    ]);
    // « Renommer » ferme le menu et passe la ligne en saisie ; Échap annule.
    folderItems[2].click();
    await vi.waitFor(() => expect(document.querySelector('.app-menu')).toBeNull());
    await vi.waitFor(() => expect(el.querySelector('.tree__rename')).not.toBeNull());
    el.querySelector('.tree__rename')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    await vi.waitFor(() => expect(el.querySelector('.tree__rename')).toBeNull());

    // « Taverne » est déjà la première scène : l'entrée est masquée.
    const items = await menu(1);
    expect(labels(items)).toEqual(['Renommer', 'Dupliquer', 'Supprimer']);
    items[2].click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(
        document.querySelector('app-confirm-dialog .app-button--danger-strong'),
      ).not.toBeNull();
    });
    (
      document.querySelector('app-confirm-dialog .app-button--danger-strong') as HTMLButtonElement
    ).click();
    await vi.waitFor(async () =>
      expect(await repository.listSceneNodes(project.id)).toHaveLength(1),
    );
  });

  it('renomme la scène depuis son titre ; Échap annule, un titre vide est refusé (7.2.1)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const tavern = aSceneNode(project.id, { name: 'Taverne' });
    await repository.saveProject({ ...project, firstSceneId: tavern.id });
    await repository.saveSceneNodes([tavern]);
    await repository.saveScene(aScene(project.id, tavern.id));
    const el = await render(project.id);
    await vi.waitFor(() => expect(el.querySelector('.scene-title')).not.toBeNull());
    const title = el.querySelector('.scene-title') as HTMLInputElement;
    expect(title.getAttribute('aria-label')).toBe('Nom de la scène');

    title.value = 'Autre';
    title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    title.dispatchEvent(new Event('blur'));
    title.value = '   ';
    title.dispatchEvent(new Event('blur'));
    expect(title.value).toBe('Taverne');

    title.value = 'La taverne du Sanglier';
    title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    title.dispatchEvent(new Event('blur'));
    await vi.waitFor(async () =>
      expect((await repository.listSceneNodes(project.id))[0].name).toBe('La taverne du Sanglier'),
    );
    await vi.waitFor(() =>
      expect(el.querySelector('.tree__label')?.textContent).toContain('La taverne du Sanglier'),
    );
  });

  it('affiche un champ par texte d’action, avec la pastille de l’action (7.2.3)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id);
    const action = anAction(node.id, {
      name: 'Entrée du bourgmestre',
      elements: [{ id: 't1', type: 'add-text', text: 'Un homme corpulent entre.' }],
    });
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    await repository.saveAction(action);
    const el = await render(project.id);
    await vi.waitFor(() => expect(el.querySelector('.action-text')).not.toBeNull());

    const block = el.querySelector('.action-text') as HTMLElement;
    expect(block.querySelector('app-pill')?.textContent?.trim()).toBe('Entrée du bourgmestre');
    const field = block.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.value).toBe('Un homme corpulent entre.');
    expect(block.querySelector('label')?.textContent?.trim()).toBe(
      'Texte de l’action « Entrée du bourgmestre »',
    );

    field.value = 'Le bourgmestre entre.';
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    await vi.waitFor(async () =>
      expect((await repository.listActions(node.id))[0].elements[0]).toMatchObject({
        text: 'Le bourgmestre entre.',
      }),
    );
  });

  it('mémorise l’état plié / déplié des parties du volet droit (7.3.8)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id);
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    const toggles = (el: HTMLElement) => [
      ...el.querySelectorAll<HTMLButtonElement>('.editor__settings .section__toggle'),
    ];

    let el = await render(project.id);
    await vi.waitFor(() => expect(toggles(el)).toHaveLength(3));
    toggles(el)[1].click();
    await vi.waitFor(() => expect(toggles(el)[1].getAttribute('aria-expanded')).toBe('false'));

    // Nouvel écran : l'état est relu dans les préférences d'affichage.
    el = await render(project.id);
    await vi.waitFor(() => expect(toggles(el)).toHaveLength(3));
    expect(toggles(el).map((t) => t.getAttribute('aria-expanded'))).toEqual([
      'true',
      'false',
      'true',
    ]);
    toggles(el)[1].click();
  });

  describe('import de battlemaps (7.3.4)', () => {
    useNodeBlob();
    stubObjectUrls();

    it('ajoute les images déposées sur l’éditeur à la scène ouverte', async () => {
      const repository = TestBed.inject(DATA_REPOSITORY);
      const project = aProject();
      const node = aSceneNode(project.id, { name: 'Taverne' });
      await repository.saveProject({ ...project, firstSceneId: node.id });
      await repository.saveSceneNodes([node]);
      await repository.saveScene(aScene(project.id, node.id));
      const el = await render(project.id);
      await vi.waitFor(() => expect(el.querySelector('app-battlemaps-panel')).not.toBeNull());

      const files = [new File(['png'], 'Salle.png', { type: 'image/png' })];
      const data = {
        types: ['Files'],
        files,
        items: files.map(() => ({ kind: 'file' })),
        dropEffect: 'none',
      } as unknown as DataTransfer;
      const fire = (type: string) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', { value: data });
        window.dispatchEvent(event);
      };
      fire('dragenter');
      await vi.waitFor(() =>
        expect(el.querySelector('app-file-drop-overlay')?.textContent).toContain(
          'Scène « Taverne »',
        ),
      );
      fire('drop');
      await vi.waitFor(() => expect(el.querySelector('app-battlemap-card')).not.toBeNull());
      expect(el.querySelector('app-battlemap-card .name')?.textContent).toContain('Salle');
      expect(el.querySelector('app-battlemap-card')?.classList).toContain('default');
      expect((await repository.listBattlemaps(node.id)).map((b) => b.name)).toEqual(['Salle']);
    });

    it('le bouton « Importer » ouvre le sélecteur d’images', async () => {
      const repository = TestBed.inject(DATA_REPOSITORY);
      const project = aProject();
      const node = aSceneNode(project.id);
      await repository.saveProject({ ...project, firstSceneId: node.id });
      await repository.saveSceneNodes([node]);
      await repository.saveScene(aScene(project.id, node.id));
      const el = await render(project.id);
      await vi.waitFor(() => expect(el.querySelector('app-battlemaps-panel')).not.toBeNull());
      const input = el.querySelector('app-battlemaps-panel input[type="file"]') as HTMLInputElement;
      const pick = vi.spyOn(input, 'click').mockImplementation(() => undefined);
      (
        el.querySelector('button[aria-label="Importer des battlemaps"]') as HTMLButtonElement
      ).click();
      expect(pick).toHaveBeenCalled();
      expect(input.accept).toContain('.png');
      expect(input.multiple).toBe(true);
    });
  });
});
