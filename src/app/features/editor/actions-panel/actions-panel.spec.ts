import { TestBed } from '@angular/core/testing';

import {
  aProject,
  aScene,
  aSceneNode,
  aSoundNode,
  anAction,
} from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Modals } from '../../../shared/ui/modal/modals';
import { EditorStore } from '../editor-store';
import { ActionsPanel } from './actions-panel';

describe('ActionsPanel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [EditorStore, ...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  it('range les actions par déclencheur, résume leurs éléments et verrouille « Texte de scène » (7.3.1)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id);
    const tavern = aSoundNode(project.id, { name: 'Taverne animée' });
    const play = (soundId: string) => ({
      id: crypto.randomUUID(),
      type: 'play-sound' as const,
      soundId,
      volume: 1,
      loop: false,
      fadeInMs: 0,
      fadeOutMs: 0,
    });
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveSoundNodes([tavern]);
    await repository.saveScene(aScene(project.id, node.id));
    await repository.saveAction(
      anAction(node.id, {
        name: 'Texte de scène',
        isSceneText: true,
        trigger: 'scene-open',
        elements: [{ id: 't', type: 'add-text', text: 'x' }, play(tavern.id)],
      }),
    );
    await repository.saveAction(
      anAction(node.id, {
        name: 'Fuite',
        order: 2,
        elements: [{ id: 'c', type: 'change-scene', sceneId: 'supprimée' }],
      }),
    );
    await TestBed.inject(EditorStore).load(project.id);

    const fixture = TestBed.createComponent(ActionsPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.section__summary')?.textContent).toContain('· 2');
    expect([...el.querySelectorAll('.group')].map((g) => g.textContent?.trim())).toEqual([
      'À l’ouverture de la scène',
      'Sur clic du MJ',
    ]);
    const rows = [...el.querySelectorAll('.action')];
    expect(rows[0].querySelector('.action__name')?.textContent).toContain('Texte de scène');
    expect(rows[0].querySelector('.action__lock')).not.toBeNull();
    expect(
      rows[0].querySelector('.action__summary')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('2 éléments · texte, lancer « Taverne animée »');
    expect(rows[1].classList).toContain('action--missing');
    expect(rows[1].querySelector('.action__summary')?.textContent).toContain('scène supprimée');
    expect(el.querySelector('button[sectionAction]')?.textContent).toContain('Nouvelle');
  });

  it('signale une action masquée au départ qu’aucune autre action n’affiche', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id);
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    await repository.saveAction(
      anAction(node.id, { id: 'cachee', name: 'Cachée', order: 1, hidden: true }),
    );
    await repository.saveAction(
      anAction(node.id, { id: 'revelee', name: 'Révélée', order: 2, hidden: true }),
    );
    await repository.saveAction(
      anAction(node.id, {
        id: 'visible',
        name: 'Visible',
        order: 3,
        elements: [{ id: 's', type: 'show-action', actionIds: ['revelee'] }],
      }),
    );
    await TestBed.inject(EditorStore).load(project.id);

    const fixture = TestBed.createComponent(ActionsPanel);
    await fixture.whenStable();
    const rows = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.action')];

    const warning = rows[0].querySelector('.action__never-shown');
    expect(warning?.getAttribute('title')).toBe('Cette action n’est jamais affichée');
    expect(warning?.nextElementSibling?.classList).toContain('action__icon');
    expect(rows[1].querySelector('.action__never-shown')).toBeNull();
    expect(rows[2].querySelector('.action__never-shown')).toBeNull();
  });

  it('« Nouvelle » ouvre l’éditeur d’action et enregistre la nouvelle action (8.1.1)', async () => {
    const repository = TestBed.inject(DATA_REPOSITORY);
    const project = aProject();
    const node = aSceneNode(project.id, { name: 'Taverne' });
    await repository.saveProject({ ...project, firstSceneId: node.id });
    await repository.saveSceneNodes([node]);
    await repository.saveScene(aScene(project.id, node.id));
    await TestBed.inject(EditorStore).load(project.id);
    const fixture = TestBed.createComponent(ActionsPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('button[sectionAction]') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-action-editor input')).not.toBeNull();
    });
    const dialog = document.querySelector('app-action-editor') as HTMLElement;
    expect(dialog.textContent).toContain('Scène : Taverne');
    const input = dialog.querySelector('input') as HTMLInputElement;
    input.value = 'Bagarre';
    input.dispatchEvent(new Event('input'));
    [...dialog.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Enregistrer'))!
      .click();

    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('.action__name')?.textContent).toContain('Bagarre');
    });
    expect((await repository.listActions(node.id)).map((a) => a.name)).toEqual(['Bagarre']);
  });
});
