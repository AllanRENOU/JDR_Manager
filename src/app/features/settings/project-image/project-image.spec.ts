import { TestBed } from '@angular/core/testing';

import { aProject } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY, DataRepository } from '../../../core/data/data-repository';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { ProjectImage } from './project-image';

describe('ProjectImage (5.3)', () => {
  useNodeBlob();
  stubObjectUrls();
  let repository: DataRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository()],
    });
    repository = TestBed.inject(DATA_REPOSITORY);
  });

  async function render(projectId: string) {
    const fixture = TestBed.createComponent(ProjectImage);
    fixture.componentRef.setInput('projectId', projectId);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, host };
  }

  /** Choisit un fichier comme le ferait le sélecteur du navigateur. */
  async function choose(host: HTMLElement, file: File): Promise<void> {
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  const buttons = (host: HTMLElement) =>
    [...host.querySelectorAll<HTMLButtonElement>('button')].map(
      (b) => b.getAttribute('aria-label') ?? b.textContent?.trim(),
    );

  it('propose de choisir une image quand le projet n’en a pas', async () => {
    await repository.saveProject(aProject({ id: 'p1' }));
    const { host } = await render('p1');

    expect(host.querySelector('h2')?.textContent).toContain('Projet');
    expect(host.textContent).toContain('Cliquez dessus pour la changer.');
    expect(host.querySelector('.image__preview')?.textContent).toContain('Choisir une image');
    expect(buttons(host)).toEqual(['Choisir l’image du projet']);
    expect(host.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('.webp');
  });

  it('ouvre le sélecteur de fichier au clic sur l’aperçu', async () => {
    await repository.saveProject(aProject({ id: 'p1' }));
    const { host } = await render('p1');
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
    const open = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    host.querySelector<HTMLButtonElement>('.image__preview')!.click();

    expect(open).toHaveBeenCalled();
  });

  it('enregistre l’image choisie, puis la remplace et la retire', async () => {
    await repository.saveProject(aProject({ id: 'p1' }));
    const { fixture, host } = await render('p1');

    await choose(host, new File(['a'], 'crypte.png', { type: 'image/png' }));
    await vi.waitFor(async () =>
      expect((await repository.getProject('p1'))?.imageMediaId).toBeTruthy(),
    );
    const first = (await repository.getProject('p1'))!.imageMediaId!;
    await fixture.whenStable();
    await vi.waitFor(() => expect(host.querySelector('img')).not.toBeNull());
    expect(buttons(host)).toEqual(['Remplacer l’image du projet', 'Retirer l’image']);

    await choose(host, new File(['b'], 'donjon.jpg', { type: 'image/jpeg' }));
    await vi.waitFor(async () =>
      expect((await repository.getProject('p1'))?.imageMediaId).not.toBe(first),
    );
    // L'ancienne image n'est plus utilisée : supprimée.
    expect(await repository.getMediaInfo([first])).toEqual([]);

    await fixture.whenStable();
    const remove = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Retirer'),
    )!;
    remove.click();
    await vi.waitFor(async () =>
      expect((await repository.getProject('p1'))?.imageMediaId).toBeNull(),
    );
    await fixture.whenStable();
    expect(host.querySelector('img')).toBeNull();
  });

  it('refuse un fichier qui n’est pas une image, sans rien enregistrer', async () => {
    await repository.saveProject(aProject({ id: 'p1' }));
    const { host } = await render('p1');

    await choose(host, new File(['a'], 'pluie.mp3', { type: 'audio/mpeg' }));

    expect(TestBed.inject(Notifications).notifications()[0]?.message).toContain('pluie.mp3');
    expect((await repository.getProject('p1'))?.imageMediaId).toBeUndefined();
  });

  it('signale un projet introuvable et ne garde pas le fichier', async () => {
    const { host } = await render('inconnu');
    const upload = vi.spyOn(repository, 'uploadMedia');

    await choose(host, new File(['a'], 'crypte.png', { type: 'image/png' }));

    await vi.waitFor(() => expect(TestBed.inject(Notifications).notifications()).toHaveLength(1));
    const mediaId = await upload.mock.results[0].value;
    expect(await repository.getMediaInfo([mediaId])).toEqual([]);
  });
});
