import { TestBed } from '@angular/core/testing';

import { aProject, aScene, aSceneNode } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Modals } from '../../../shared/ui/modal/modals';
import { EditorStore } from '../editor-store';
import { SequencePanel } from './sequence-panel';

describe('SequencePanel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [EditorStore, ...useTestRepository()],
    });
  });
  afterEach(() => TestBed.inject(Modals).closeAll());

  async function setup() {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const tavern = aSceneNode(project.id, { name: 'Taverne', order: 0 });
    const market = aSceneNode(project.id, { name: 'Marché', order: 1 });
    const forest = aSceneNode(project.id, { name: 'Forêt', order: 2 });
    await repository.saveProject({ ...project, firstSceneId: market.id });
    await repository.saveSceneNodes([tavern, market, forest]);
    for (const n of [market, forest]) {
      await repository.saveScene(aScene(project.id, n.id));
    }
    await repository.saveScene({
      ...aScene(project.id, tavern.id),
      nextSceneIds: [market.id, 'supprimée'],
    });
    const store = TestBed.inject(EditorStore);
    await store.load(project.id);
    await store.openScene(tavern.id);
    const fixture = TestBed.createComponent(SequencePanel);
    await fixture.whenStable();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      store,
      project,
      tavern,
      market,
      forest,
    };
  }

  it('coche « Première scène du projet » pour la scène ouverte, ou la décoche (7.3.6)', async () => {
    const { fixture, el, store, project, tavern } = await setup();
    const box = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(box.closest('label')?.textContent).toContain('Première scène du projet');
    expect(box.checked).toBe(false);

    box.checked = true;
    box.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(store.isFirstScene(tavern.id)).toBe(true));
    await fixture.whenStable();
    expect(box.checked).toBe(true);
    expect((await TestBed.inject(DATA_REPOSITORY).getProject(project.id))?.firstSceneId).toBe(
      tavern.id,
    );

    box.checked = false;
    box.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(store.project()?.firstSceneId).toBeNull());
  });

  it('montre les scènes suivantes, signale une scène supprimée et retire une pastille (7.3.7)', async () => {
    const { fixture, el, store, market } = await setup();
    const pills = () => [...el.querySelectorAll('app-pill')].map((p) => p.textContent?.trim());
    expect(pills()).toEqual(['Marché', 'Scène supprimée']);
    expect(el.querySelectorAll('app-pill')[1].classList).toContain('tone-stop-all');

    (el.querySelector('app-pill .pill__remove') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(store.scene()?.nextSceneIds).toEqual(['supprimée']));
    await fixture.whenStable();
    expect(pills()).toEqual(['Scène supprimée']);
    expect(market).toBeDefined();
  });

  it('« Ajouter » ouvre la sélection multiple : suivantes pré-cochées, scène actuelle grisée (7.3.7)', async () => {
    const { el, store, market, forest } = await setup();
    (
      el.querySelector('button[aria-label="Ajouter des scènes suivantes"]') as HTMLButtonElement
    ).click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-selection-dialog .tree__row')).not.toBeNull();
    });
    const dialog = document.querySelector('app-selection-dialog') as HTMLElement;
    expect(dialog.textContent).toContain('Scènes suivantes');
    expect(dialog.textContent).toContain('Après « Taverne »');
    const row = (name: string) =>
      [...dialog.querySelectorAll<HTMLElement>('.tree__row')].find((r) =>
        r.textContent?.includes(name),
      )!;
    expect(row('Marché').getAttribute('aria-checked')).toBe('true');
    expect(row('Taverne').getAttribute('aria-disabled')).toBe('true');

    row('Forêt').click();
    TestBed.tick();
    const validate = [...dialog.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('Valider'),
    )!;
    validate.click();
    // Les nouvelles scènes s'ajoutent à la fin ; la référence disparue reste signalée.
    await vi.waitFor(() =>
      expect(store.scene()?.nextSceneIds).toEqual([market.id, 'supprimée', forest.id]),
    );
  });
});
