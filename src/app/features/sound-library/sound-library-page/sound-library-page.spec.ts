import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject, aSoundNode, anAction } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { AudioDuration } from '../../../core/media/audio-duration';
import { GLOBAL_SOUND_LIBRARY, Id, SoundNode } from '../../../core/models';
import { Tree } from '../../../shared/tree/tree';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { SoundLibraryStore } from '../sound-library-store';
import { SoundLibraryPage } from './sound-library-page';

describe('SoundLibraryPage', () => {
  useNodeBlob();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideRouter([]),
        ...useTestRepository(),
        { provide: AudioDuration, useValue: { read: () => Promise.resolve(65_000) } },
      ],
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

  it('affiche « Ce projet » puis « Bibliothèque globale », chacune avec ses dossiers et ses sons (6.2)', async () => {
    const project = aProject();
    const weather = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Météo' });
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    await TestBed.inject(DATA_REPOSITORY).saveSoundNodes([
      aSoundNode(project.id, { kind: 'folder', name: 'Ambiances' }),
      weather,
      aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie', parentId: weather.id }),
    ]);
    const { fixture, el } = await render(project.id);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('app-tree')).toHaveLength(2);
    });
    const roots = [...el.querySelectorAll('.lib__root')].map((b) => b.textContent?.trim());
    expect(roots).toEqual(['Ce projet', 'Bibliothèque globale']);
    const trees = [...el.querySelectorAll('app-tree')];
    const rowNames = (tree: Element) =>
      [...tree.querySelectorAll('.tree__label')].map((l) => l.textContent?.trim());
    expect(trees.map(rowNames)).toEqual([['Ambiances'], ['Météo', 'Pluie']]);
    expect(trees[1].querySelector('.tree-sound svg')).not.toBeNull();
    expect(trees[1].classList).toContain('tree--global');
    expect(el.querySelector('.lib__root')?.getAttribute('aria-current')).toBe('true');

    (trees[1].querySelector('.tree__row') as HTMLElement).click();
    await fixture.whenStable();
    expect(el.querySelector('.lib__root')?.getAttribute('aria-current')).toBeNull();
    expect(trees[1].querySelector('.tree__row--selected')?.textContent).toContain('Météo');

    // Un son choisi dans l'arborescence : son dossier s'ouvre et sa ligne est mise en évidence.
    (trees[1].querySelectorAll('.tree__row')[1] as HTMLElement).click();
    await fixture.whenStable();
    expect(trees[1].querySelector('.tree__row--selected')?.textContent).toContain('Pluie');
    expect(el.querySelector('.content__name')?.textContent).toContain('Météo');
    expect(el.querySelector('.sound--selected .sound__name')?.textContent).toBe('Pluie');
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

  it('montre les sons du dossier ouvert : nom, durée, format, « Utilisé dans » (6.3)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const folder = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Ambiances' });
    const sub = aSoundNode(GLOBAL_SOUND_LIBRARY, {
      kind: 'folder',
      name: 'Taverne',
      parentId: folder.id,
    });
    const mediaId = await repository.uploadMedia(new File(['x'], 'foule.mp3'), {
      durationMs: 760_400,
    });
    const crowd = aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Foule', parentId: sub.id, mediaId });
    const lost = aSoundNode(GLOBAL_SOUND_LIBRARY, {
      name: 'Perdu',
      parentId: sub.id,
      mediaId: 'absent',
      order: 1,
    });
    await repository.saveSoundNodes([folder, sub, crowd, lost]);
    await repository.saveAction(
      anAction('s1', { elements: [{ id: 'e', type: 'stop-sound', soundId: crowd.id }] }),
    );
    await repository.saveAction(
      anAction('s2', { elements: [{ id: 'f', type: 'stop-sound', soundId: crowd.id }] }),
    );
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.content__empty')?.textContent).toContain('Aucun son');
      expect(el.querySelector('app-tree .tree__row')).not.toBeNull();
    });

    fixture.debugElement.injector.get(SoundLibraryStore).open(GLOBAL_SOUND_LIBRARY, sub.id);
    await fixture.whenStable();
    expect(el.querySelector('.content__path')?.textContent?.trim()).toBe(
      'Bibliothèque globale › Ambiances ›',
    );
    expect(el.querySelector('.content__name')?.textContent).toContain('Taverne');
    const cells = [...el.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    );
    expect(cells).toEqual([
      ['', 'Foule', '12:40', 'MP3', '2 actions', ''],
      ['', 'Perdu', 'Fichier introuvable', 'Non utilisé', ''],
    ]);
  });

  it('recherche un son et indique où il se trouve (6.4)', async () => {
    const folder = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Météo' });
    await TestBed.inject(DATA_REPOSITORY).saveSoundNodes([
      folder,
      aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie fine', parentId: folder.id }),
    ]);
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-tree .tree__row')).not.toBeNull();
    });
    const search = el.querySelector('input[type="search"]') as HTMLInputElement;
    expect(search.getAttribute('aria-label')).toBe('Rechercher un son');

    search.value = 'pluie';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.querySelector('.content__name')?.textContent).toContain('Résultats pour « pluie »');
    expect(el.querySelector('.sound__path')?.textContent).toBe('Bibliothèque globale › Météo');

    search.value = 'neige';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.querySelector('.content__empty')?.textContent).toContain(
      'Aucun son ne correspond à « neige »',
    );

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(search.value).toBe('');
  });

  it('importe les fichiers choisis avec « Importer des sons » et le signale (6.5)', async () => {
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.content__empty')).not.toBeNull();
    });
    const button = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Importer des sons'),
    )!;
    const input = el.querySelector('input[type="file"]') as HTMLInputElement;
    const pick = vi.spyOn(input, 'click').mockImplementation(() => undefined);
    button.click();
    expect(pick).toHaveBeenCalled();
    expect(input.multiple).toBe(true);
    expect(input.accept).toContain('.mp3');

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['x'], 'pluie.mp3', { type: 'audio/mpeg' }), new File(['y'], 'a.txt')],
    });
    input.dispatchEvent(new Event('change'));
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sound__name')?.textContent).toContain('pluie');
    });
    expect(el.querySelector('tbody td:nth-child(3)')?.textContent?.trim()).toBe('1:05');
    const messages = TestBed.inject(Notifications)
      .notifications()
      .map((n) => [n.tone, n.message]);
    expect(messages).toEqual([
      ['danger', expect.stringContaining('a.txt')],
      ['info', '1 son importé dans « Bibliothèque globale ».'],
    ]);
  });

  it('importe les sons déposés depuis le disque dans le dossier ouvert (6.6)', async () => {
    const folder = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Météo' });
    await TestBed.inject(DATA_REPOSITORY).saveSoundNodes([folder]);
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-tree .tree__row')).not.toBeNull();
    });
    (el.querySelector('app-tree .tree__row') as HTMLElement).click();
    await fixture.whenStable();

    const files = [new File(['x'], 'orage.ogg', { type: 'audio/ogg' })];
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
    await fixture.whenStable();
    const overlay = fixture.nativeElement.querySelector('app-file-drop-overlay') as HTMLElement;
    expect(overlay.textContent).toContain('Bibliothèque globale › Météo');
    expect(overlay.textContent).toContain('MP3');
    expect(overlay.textContent).not.toContain('PNG');

    fire('drop');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sound__name')?.textContent).toContain('orage');
    });
    expect(fixture.nativeElement.querySelector('app-file-drop-overlay')).toBeNull();
    const saved = await TestBed.inject(DATA_REPOSITORY).listSoundNodes(GLOBAL_SOUND_LIBRARY);
    expect(saved.find((n) => n.name === 'orage')?.parentId).toBe(folder.id);
  });

  it('renomme un son dans le tableau : Entrée valide, Échap annule (6.8)', async () => {
    const sound = aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie' });
    await TestBed.inject(DATA_REPOSITORY).saveSoundNodes([sound]);
    const { fixture, el } = await render();
    document.body.appendChild(el);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sound__name')?.textContent).toContain('Pluie');
    });
    const renameButton = () =>
      el.querySelector('button[aria-label="Renommer « Pluie »"]') as HTMLButtonElement;

    renameButton().click();
    await fixture.whenStable();
    let input = el.querySelector('.sound__rename') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe('Nouveau nom de « Pluie »');
    input.value = 'Ignoré';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(el.querySelector('.sound__name')?.textContent).toContain('Pluie');

    renameButton().click();
    await fixture.whenStable();
    input = el.querySelector('.sound__rename') as HTMLInputElement;
    input.value = '  Pluie fine ';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.sound__name')?.textContent).toContain('Pluie fine');
    });
    const [saved] = await TestBed.inject(DATA_REPOSITORY).listSoundNodes(GLOBAL_SOUND_LIBRARY);
    expect(saved.name).toBe('Pluie fine');
    el.remove();
  });

  it('supprime un son après confirmation et avertit s’il est utilisé (6.9)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const mediaId = await repository.uploadMedia(new File(['x'], 'pluie.ogg'));
    const used = aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie', mediaId });
    const unused = aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Vent', order: 1 });
    await repository.saveSoundNodes([used, unused]);
    await repository.saveAction(
      anAction('s1', { elements: [{ id: 'e', type: 'stop-sound', soundId: used.id }] }),
    );
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    });
    const deleteButton = (name: string) =>
      el.querySelector(`button[aria-label="Supprimer « ${name} »"]`) as HTMLButtonElement;
    const dialogText = () => document.querySelector('app-confirm-dialog')?.textContent ?? '';
    const dialogButton = (label: string) =>
      [...document.querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')].find(
        (b) => b.textContent?.trim() === label,
      )!;

    deleteButton('Pluie').click();
    await fixture.whenStable();
    TestBed.tick();
    expect(dialogText()).toContain('Supprimer « Pluie » ?');
    expect(dialogText()).toContain('utilisé dans 1 action : elle le signalera comme introuvable');
    dialogButton('Annuler').click();
    await fixture.whenStable();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);

    deleteButton('Vent').click();
    await fixture.whenStable();
    TestBed.tick();
    expect(dialogText()).not.toContain('utilisé');
    dialogButton('Supprimer').click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    });
    expect((await repository.listSoundNodes(GLOBAL_SOUND_LIBRARY)).map((n) => n.name)).toEqual([
      'Pluie',
    ]);
    expect(TestBed.inject(Notifications).notifications().at(-1)?.message).toBe(
      'Son « Vent » supprimé.',
    );
  });

  it('avertit avant de supprimer un dossier qui contient des sons utilisés', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const folder = aSoundNode(GLOBAL_SOUND_LIBRARY, { kind: 'folder', name: 'Météo' });
    const rain = aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie', parentId: folder.id });
    await repository.saveSoundNodes([
      folder,
      rain,
      aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Vent', parentId: folder.id, order: 1 }),
    ]);
    await repository.saveAction(
      anAction('s1', { elements: [{ id: 'e', type: 'stop-sound', soundId: rain.id }] }),
    );
    const { fixture, el } = await render();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('app-tree .tree__row')).not.toBeNull();
    });
    const tree = fixture.debugElement.query((d) => d.name === 'app-tree')
      .componentInstance as Tree<SoundNode>;
    const pending = tree.requestRemove(folder);
    TestBed.tick();
    expect(document.querySelector('app-confirm-dialog')?.textContent).toContain(
      'les sons qu’il contient (2) seront supprimés. Attention : 1 de ces sons est utilisé dans des actions',
    );
    (
      document.querySelector('app-confirm-dialog .modal__footer button') as HTMLButtonElement
    ).click();
    await pending;
  });

  describe('pré-écoute (6.10)', () => {
    stubObjectUrls();
    beforeEach(() => {
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    it('lance et arrête la pré-écoute ; la ligne en cours montre sa progression', async () => {
      const repository = TestBed.inject(DATA_REPOSITORY);
      const mediaId = await repository.uploadMedia(new File(['x'], 'pluie.ogg'));
      await repository.saveSoundNodes([
        aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Pluie', mediaId }),
        aSoundNode(GLOBAL_SOUND_LIBRARY, { name: 'Perdu', mediaId: 'absent', order: 1 }),
      ]);
      const { fixture, el } = await render();
      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
      });
      const [listen, missing] = [...el.querySelectorAll<HTMLButtonElement>('.listen')];
      expect(listen.getAttribute('aria-label')).toBe('Écouter « Pluie »');
      expect(missing.disabled).toBe(true);

      listen.click();
      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(listen.getAttribute('aria-pressed')).toBe('true');
      });
      expect(listen.getAttribute('aria-label')).toBe('Arrêter la pré-écoute de « Pluie »');
      expect(el.querySelector('.sound--playing [role="progressbar"]')).not.toBeNull();

      listen.click();
      await fixture.whenStable();
      expect(listen.getAttribute('aria-pressed')).toBe('false');
      expect(el.querySelector('[role="progressbar"]')).toBeNull();
    });
  });
});
