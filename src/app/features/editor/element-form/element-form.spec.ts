import { ComponentFixture, TestBed } from '@angular/core/testing';

import { aBattlemap, aSceneNode, aSoundNode } from '../../../../testing/data-builders';
import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { ActionElement } from '../../../core/models';
import { Selections } from '../../../shared/selection-dialog/selections';
import { SummaryContext } from '../action-summary';
import { ElementForm } from './element-form';

describe('ElementForm', () => {
  const select = vi.fn();
  const folder = aSceneNode('p1', { kind: 'folder', name: 'Acte I' });
  const tavern = aSceneNode('p1', { id: 's1', name: 'La taverne', parentId: folder.id });
  const forest = aSceneNode('p1', { id: 's2', name: 'La forêt', parentId: folder.id });
  const fight = aSoundNode('p1', { id: 'snd1', name: 'Combat' });
  const rain = aSoundNode('global', { id: 'snd2', name: 'Pluie' });
  const groundFloor = aBattlemap('s1', 'm1', { id: 'b1', name: 'Rez-de-chaussée' });
  const upstairs = aBattlemap('s1', 'm2', { id: 'b2', name: 'Étage' });
  const context: SummaryContext = {
    soundNames: {},
    soundNodes: [fight, rain],
    battlemaps: [groundFloor, upstairs],
    sceneNodes: [folder, tavern, forest],
  };

  beforeEach(() => {
    select.mockReset();
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository(), { provide: Selections, useValue: { select } }],
    });
  });

  function render(element: ActionElement): {
    fixture: ComponentFixture<ElementForm>;
    el: HTMLElement;
    emitted: ActionElement[];
  } {
    const fixture = TestBed.createComponent(ElementForm);
    fixture.componentRef.setInput('element', element);
    fixture.componentRef.setInput('context', context);
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('projectId', 'p1');
    const emitted: ActionElement[] = [];
    fixture.componentInstance.elementChange.subscribe((e) => {
      emitted.push(e);
      fixture.componentRef.setInput('element', e);
    });
    TestBed.tick();
    return { fixture, el: fixture.nativeElement as HTMLElement, emitted };
  }
  const type = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    TestBed.tick();
  };
  const choiceButton = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('button.choice')!;

  it('Afficher une battlemap : choix par miniature (8.3.1)', () => {
    const { el, emitted } = render({ id: 'e1', type: 'show-battlemap', battlemapId: 'b1' });
    const radios = [...el.querySelectorAll<HTMLInputElement>('input[type=radio]')];
    expect(radios.map((r) => r.checked)).toEqual([true, false]);
    expect(el.querySelectorAll('app-battlemap-card')).toHaveLength(2);
    radios[1].click();
    TestBed.tick();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'show-battlemap', battlemapId: 'b2' });
    expect(el.querySelector('.map--checked')?.textContent).toContain('Étage');
  });

  it('Afficher une battlemap : signale une battlemap supprimée (8.3.1)', () => {
    const { el } = render({ id: 'e1', type: 'show-battlemap', battlemapId: 'absente' });
    expect(el.textContent).toContain('La battlemap choisie a été supprimée');
  });

  it('Lancer un son : son, volume, boucle et fondus convertis dans l’élément (8.3.2)', async () => {
    const { el, emitted } = render({
      id: 'e1',
      type: 'play-sound',
      soundId: 'snd1',
      volume: 0.8,
      loop: false,
      fadeInMs: 0,
      fadeOutMs: 1500,
    });
    expect(choiceButton(el).textContent).toContain('Ce projet › Combat');
    expect(choiceButton(el).textContent).toContain('Changer');
    expect(el.textContent).toContain('Volume · 80 %');
    const [fadeIn, fadeOut] = [...el.querySelectorAll<HTMLInputElement>('input[type=number]')];
    expect(fadeOut.value).toBe('1.5');

    type(el.querySelector<HTMLInputElement>('input[type=range]')!, '40');
    el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    TestBed.tick();
    type(fadeIn, '2');
    expect(emitted.at(-1)).toEqual({
      id: 'e1',
      type: 'play-sound',
      soundId: 'snd1',
      volume: 0.4,
      loop: true,
      fadeInMs: 2000,
      fadeOutMs: 1500,
    });

    type(fadeOut, '-1');
    expect(el.textContent).toContain('Durée positive ou nulle.');
    expect(emitted.at(-1)).toMatchObject({ fadeOutMs: 1500 });

    select.mockResolvedValue(['snd2']);
    choiceButton(el).click();
    await vi.waitFor(() => expect(emitted.at(-1)).toMatchObject({ soundId: 'snd2' }));
    const options = select.mock.calls[0][0];
    expect(options.mode).toBe('single');
    expect(options.checkedIds).toEqual(['snd1']);
    expect(
      options.nodes.filter((n: { parentId: string | null }) => n.parentId === null),
    ).toHaveLength(2);
    TestBed.tick();
    expect(choiceButton(el).textContent).toContain('Bibliothèque globale › Pluie');
  });

  it('Arrêter un son : sélecteur et aide sur le fondu ; son supprimé signalé (8.3.3)', async () => {
    const { el, emitted } = render({ id: 'e1', type: 'stop-sound', soundId: '' });
    expect(choiceButton(el).textContent).toContain('Aucun son choisi');
    expect(choiceButton(el).textContent).toContain('Choisir');
    expect(el.textContent).toContain('fondu de sortie défini à son lancement');

    select.mockResolvedValue(null);
    choiceButton(el).click();
    await vi.waitFor(() => expect(select).toHaveBeenCalled());
    expect(emitted).toEqual([]);

    const missing = render({ id: 'e2', type: 'stop-sound', soundId: 'absent' }).el;
    expect(choiceButton(missing).classList).toContain('choice--missing');
    expect(choiceButton(missing).textContent).toContain('Son supprimé');
  });

  it('Arrêter tous les sons : texte explicatif seul (8.3.4)', () => {
    const { el } = render({ id: 'e1', type: 'stop-all-sounds' });
    expect(el.textContent).toContain('Arrête tous les sons en cours');
    expect(el.querySelector('input, textarea, button')).toBeNull();
  });

  it('Ajouter un texte : zone de texte (8.3.5)', () => {
    const { el, emitted } = render({ id: 'e1', type: 'add-text', text: 'Bonjour' });
    const area = el.querySelector('textarea')!;
    expect(area.value).toBe('Bonjour');
    type(area, 'La porte grince.');
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'add-text', text: 'La porte grince.' });
  });

  it('Changer de scène : sélection unique, scène actuelle grisée, avertissement (8.3.6)', async () => {
    const { el, emitted } = render({ id: 'e1', type: 'change-scene', sceneId: '' });
    expect(choiceButton(el).textContent).toContain('Aucune scène choisie');
    expect(el.textContent).toContain('Les éléments placés après celui-ci ne seront pas exécutés.');

    select.mockResolvedValue(['s2']);
    choiceButton(el).click();
    await vi.waitFor(() => expect(emitted.at(-1)).toMatchObject({ sceneId: 's2' }));
    expect(select.mock.calls[0][0]).toMatchObject({
      mode: 'single',
      disabledIds: ['s1'],
      labels: { disabled: 'scene.current' },
    });
    TestBed.tick();
    expect(choiceButton(el).textContent).toContain('Acte I › La forêt');
  });

  it('Changer de scène : une scène supprimée est signalée et peut être remplacée (8.3.6, PRS-07)', () => {
    const { el } = render({ id: 'e1', type: 'change-scene', sceneId: 'supprimée' });
    expect(choiceButton(el).classList).toContain('choice--missing');
    expect(choiceButton(el).textContent).toContain('Scène supprimée');
    expect(choiceButton(el).textContent).toContain('Choisir');
  });

  it('Attendre : durée positive en secondes (8.3.7)', () => {
    const { el, emitted } = render({ id: 'e1', type: 'wait', seconds: 2 });
    const input = el.querySelector<HTMLInputElement>('input[type=number]')!;
    expect(input.value).toBe('2');
    expect(el.textContent).toContain('secondes');
    type(input, '3.5');
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'wait', seconds: 3.5 });
    type(input, '0');
    expect(el.textContent).toContain('Indiquez une durée positive, en secondes.');
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'wait', seconds: 3.5 });
  });

  it('Clic de l’utilisateur : texte obligatoire (8.3.8)', () => {
    const { el } = render({ id: 'e1', type: 'user-click', text: 'Il approche.' });
    expect(el.textContent).toContain('(obligatoire)');
    const area = el.querySelector('textarea')!;
    type(area, '   ');
    expect(el.textContent).toContain('Ce texte est obligatoire.');
    expect(area.getAttribute('aria-invalid')).toBe('true');
  });
});
