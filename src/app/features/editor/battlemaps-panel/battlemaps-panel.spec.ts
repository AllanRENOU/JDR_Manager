import { TestBed } from '@angular/core/testing';

import { aBattlemap, aProject, aScene, aSceneNode } from '../../../../testing/data-builders';
import { useNodeBlob } from '../../../../testing/node-blob';
import { stubObjectUrls } from '../../../../testing/object-url';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { EditorStore } from '../editor-store';
import { BattlemapsPanel } from './battlemaps-panel';

describe('BattlemapsPanel', () => {
  useNodeBlob();
  stubObjectUrls();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [EditorStore, ...useTestRepository()],
    });
  });

  async function setup(withMaps: boolean) {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id);
    const mediaId = await repository.uploadMedia(
      new File(['png'], 'salle.png', { type: 'image/png' }),
    );
    const maps = withMaps
      ? [
          aBattlemap(node.id, mediaId, { name: 'Rez-de-chaussée', order: 0 }),
          aBattlemap(node.id, 'absent', { name: 'Étage', order: 1 }),
        ]
      : [];
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene({
      ...aScene(project.id, node.id),
      defaultBattlemapId: maps[0]?.id ?? null,
    });
    for (const map of maps) {
      await repository.saveBattlemap(map);
    }
    await TestBed.inject(EditorStore).load(project.id);
    const fixture = TestBed.createComponent(BattlemapsPanel);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('montre les miniatures en grille avec le badge « Par défaut » (7.3.3)', async () => {
    const { fixture, el } = await setup(true);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('img')).not.toBeNull();
    });
    expect(el.querySelector('.section__summary')?.textContent).toContain('· 2');
    const cards = [...el.querySelectorAll('app-battlemap-card')];
    expect(cards.map((c) => c.querySelector('.name')?.textContent?.trim())).toEqual([
      'Rez-de-chaussée',
      'Étage',
    ]);
    expect(cards[0].classList).toContain('default');
    expect(cards[0].querySelector('app-pill')?.textContent).toContain('Par défaut');
    expect(cards[0].querySelector('img')?.getAttribute('alt')).toBe(
      'Aperçu de « Rez-de-chaussée »',
    );
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(cards[1].querySelector('.card__missing')?.textContent).toContain('Image introuvable');
    });
  });

  it('indique qu’il n’y a pas encore de battlemap', async () => {
    const { el } = await setup(false);
    expect(el.querySelector('.empty')?.textContent).toContain('Aucune battlemap');
  });

  it('menu d’une battlemap : définir par défaut, renommer, supprimer avec avertissement (7.3.5)', async () => {
    const { fixture, el } = await setup(true);
    const store = TestBed.inject(EditorStore);
    const [first, second] = store.battlemaps();
    const openMenu = async (index: number) => {
      (el.querySelectorAll('button[cardActions]')[index] as HTMLButtonElement).click();
      await vi.waitFor(() => expect(document.querySelector('.app-menu')).not.toBeNull());
      return [...document.querySelectorAll<HTMLButtonElement>('.app-menu .app-menu-item')];
    };

    let items = await openMenu(1);
    expect(items.map((b) => b.textContent?.trim())).toEqual([
      'Définir par défaut',
      'Renommer',
      'Supprimer',
    ]);
    items[0].click();
    await vi.waitFor(() => expect(store.scene()?.defaultBattlemapId).toBe(second.id));
    await vi.waitFor(() => expect(document.querySelector('.app-menu')).toBeNull());

    items = await openMenu(0);
    expect(items.map((b) => b.textContent?.trim())).toEqual([
      'Définir par défaut',
      'Renommer',
      'Supprimer',
    ]);
    items[1].click();
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.name-input')).not.toBeNull();
    });
    const input = el.querySelector('.name-input') as HTMLInputElement;
    input.value = 'cave';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('Cave');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await vi.waitFor(() => expect(store.battlemaps()[0].name).toBe('Cave'));
    expect(first.id).toBe(store.battlemaps()[0].id);
  });
});
