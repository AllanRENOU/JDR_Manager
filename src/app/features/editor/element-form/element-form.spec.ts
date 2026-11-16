import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  aBattlemap,
  aSceneNode,
  aSheetNode,
  aSoundNode,
  anAction,
} from '../../../../testing/data-builders';
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
  const intro = aSoundNode('global', { id: 'vid1', name: 'Intro', mediaKind: 'video' });
  const ending = aSoundNode('p1', { id: 'vid2', name: 'Fin', mediaKind: 'video' });
  const groundFloor = aBattlemap('s1', 'm1', { id: 'b1', name: 'Rez-de-chaussée' });
  const upstairs = aBattlemap('s1', 'm2', { id: 'b2', name: 'Étage' });
  const npcs = aSheetNode('p1', { id: 'pnj', kind: 'folder', name: 'PNJ' });
  const guard = aSheetNode('p1', { id: 'garde', name: 'Garde', parentId: npcs.id });
  const context: SummaryContext = {
    soundNames: {},
    soundNodes: [fight, rain, intro, ending],
    battlemaps: [groundFloor, upstairs],
    sceneNodes: [folder, tavern, forest],
    sheetNodes: [npcs, guard],
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

  it('Lancer un son : la fenêtre de choix ne propose pas les vidéos', async () => {
    const { el } = render({
      id: 'e1',
      type: 'play-sound',
      soundId: '',
      volume: 1,
      loop: false,
      fadeInMs: 0,
      fadeOutMs: 0,
    });
    select.mockResolvedValue(null);
    choiceButton(el).click();
    await vi.waitFor(() => expect(select).toHaveBeenCalled());
    const items = select.mock.calls[0][0].nodes.filter((n: { kind: string }) => n.kind === 'item');
    expect(items.map((n: { name: string }) => n.name)).toEqual(['Combat', 'Pluie']);
  });

  it('Lancer la vidéo : choix parmi les vidéos seulement, volume (ACT-14)', async () => {
    const { el, emitted } = render({ id: 'e1', type: 'play-video', videoId: '', volume: 1 });
    expect(choiceButton(el).textContent).toContain('Aucune vidéo choisie');
    expect(el.textContent).toContain('Volume · 100 %');
    expect(el.textContent).toContain('0 % : vidéo muette.');
    expect(el.textContent).toContain('l’action continue sans attendre sa fin');

    select.mockResolvedValue(['vid1']);
    choiceButton(el).click();
    await vi.waitFor(() => expect(emitted.at(-1)).toMatchObject({ videoId: 'vid1' }));
    const options = select.mock.calls[0][0];
    expect(options.title).toBe('Choisir une vidéo');
    const items = options.nodes.filter((n: { kind: string }) => n.kind === 'item');
    expect(items.map((n: { name: string }) => n.name)).toEqual(['Intro', 'Fin']);
    TestBed.tick();
    expect(choiceButton(el).textContent).toContain('Bibliothèque globale › Intro');

    type(el.querySelector<HTMLInputElement>('input[type=range]')!, '0');
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'play-video', videoId: 'vid1', volume: 0 });
  });

  it('Lancer la vidéo : vidéo supprimée signalée (PRS-07)', () => {
    const { el } = render({ id: 'e1', type: 'play-video', videoId: 'absente', volume: 1 });
    expect(choiceButton(el).classList).toContain('choice--missing');
    expect(choiceButton(el).textContent).toContain('Vidéo supprimée');
  });

  it('Arrêter la vidéo : texte explicatif seul (ACT-15)', () => {
    const { el } = render({ id: 'e1', type: 'stop-video' });
    expect(el.textContent).toContain('Arrête la vidéo en cours dans la fenêtre joueurs');
    expect(el.querySelector('input, textarea, button')).toBeNull();
  });

  it('Arrêter tous les sons : texte explicatif seul (8.3.4)', () => {
    const { el } = render({ id: 'e1', type: 'stop-all-sounds' });
    expect(el.textContent).toContain('Arrête tous les sons en cours');
    expect(el.querySelector('input, textarea, button')).toBeNull();
  });

  it('Afficher un texte : zone de texte (8.3.5)', () => {
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

  it('Afficher une fiche : sélection unique dans l’arborescence des fiches, chemin affiché (ACT-16)', async () => {
    const { el, emitted } = render({ id: 'e1', type: 'show-sheet', sheetId: '' });
    expect(choiceButton(el).textContent).toContain('Aucune fiche choisie');
    expect(el.textContent).not.toContain('pas encore de fiche');

    select.mockResolvedValue(['garde']);
    choiceButton(el).click();
    await vi.waitFor(() =>
      expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'show-sheet', sheetId: 'garde' }),
    );
    expect(select.mock.calls[0][0]).toMatchObject({
      title: 'Fiche à afficher',
      nodes: [npcs, guard],
      mode: 'single',
      checkedIds: [],
    });
    TestBed.tick();
    expect(choiceButton(el).textContent).toContain('PNJ › Garde');
    expect(choiceButton(el).textContent).toContain('Changer');
  });

  it('Afficher une fiche : une fiche supprimée est signalée ; sans fiche, une aide renvoie à l’onglet Fiches', () => {
    const { el } = render({ id: 'e1', type: 'show-sheet', sheetId: 'supprimée' });
    expect(choiceButton(el).classList).toContain('choice--missing');
    expect(choiceButton(el).textContent).toContain('Fiche supprimée');

    const { fixture } = render({ id: 'e2', type: 'show-sheet', sheetId: '' });
    fixture.componentRef.setInput('context', { ...context, sheetNodes: [] });
    TestBed.tick();
    expect(fixture.nativeElement.textContent).toContain(
      'Ce projet n’a pas encore de fiche : créez-en dans l’onglet « Fiches ».',
    );
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

  it('Attendre : texte facultatif, absent de l’élément quand il est vide', () => {
    const { el, emitted } = render({ id: 'e1', type: 'wait', seconds: 2, text: 'Le garde passe.' });
    const textarea = el.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(textarea.value).toBe('Le garde passe.');
    expect(el.textContent).toContain('Texte (facultatif)');
    type(textarea, 'La porte grince.');
    expect(emitted.at(-1)).toEqual({
      id: 'e1',
      type: 'wait',
      seconds: 2,
      text: 'La porte grince.',
    });
    type(textarea, '  ');
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'wait', seconds: 2 });
  });

  it('Afficher l’action : choix parmi les actions « Clic du MJ » de la scène, sauf elle-même (ACT-12)', () => {
    const fixture = TestBed.createComponent(ElementForm);
    fixture.componentRef.setInput('element', { id: 'e1', type: 'show-action', actionIds: [] });
    fixture.componentRef.setInput('context', {
      ...context,
      actions: [
        anAction('s1', { id: 'self', name: 'Le garde', trigger: 'manual' }),
        anAction('s1', { id: 'fuite', name: 'La fuite', trigger: 'manual', hidden: true }),
        anAction('s1', { id: 'auto', name: 'Entrée', trigger: 'scene-open' }),
      ],
    });
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.componentRef.setInput('actionId', 'self');
    const emitted: ActionElement[] = [];
    fixture.componentInstance.elementChange.subscribe((e) => emitted.push(e));
    TestBed.tick();
    const el = fixture.nativeElement as HTMLElement;

    const labels = [...el.querySelectorAll('label.app-check')].map((l) =>
      l.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(labels).toEqual(['La fuite · masquée au départ']);
    expect(fixture.componentInstance.invalid()).toBe(true);
    fixture.componentInstance.revealErrors();
    TestBed.tick();
    expect(el.textContent).toContain('Choisissez au moins une action à afficher.');

    el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'show-action', actionIds: ['fuite'] });
  });

  it('Afficher l’action : plusieurs actions, dans l’ordre de la scène', () => {
    const fixture = TestBed.createComponent(ElementForm);
    fixture.componentRef.setInput('element', {
      id: 'e1',
      type: 'show-action',
      actionIds: ['garde'],
    });
    fixture.componentRef.setInput('context', {
      ...context,
      actions: [
        anAction('s1', { id: 'fuite', name: 'La fuite', trigger: 'manual' }),
        anAction('s1', { id: 'garde', name: 'Le garde', trigger: 'manual' }),
      ],
    });
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('projectId', 'p1');
    const emitted: ActionElement[] = [];
    fixture.componentInstance.elementChange.subscribe((e) => emitted.push(e));
    TestBed.tick();
    const boxes = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        'input[type=checkbox]',
      ),
    ];
    expect(boxes.map((b) => b.checked)).toEqual([false, true]);

    boxes[0].click();
    expect(emitted.at(-1)).toEqual({
      id: 'e1',
      type: 'show-action',
      actionIds: ['fuite', 'garde'],
    });
    fixture.componentRef.setInput('element', emitted.at(-1));
    TestBed.tick();
    boxes[1].click();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'show-action', actionIds: ['fuite'] });
  });

  it('Afficher l’action : action visée supprimée signalée (PRS-07), « Retirer » l’enlève', () => {
    const { el, emitted } = render({ id: 'e1', type: 'show-action', actionIds: ['disparue'] });
    const warning = el.querySelector('.warning')!;
    expect(warning.textContent).toContain('Une action choisie a été supprimée.');
    expect(el.textContent).toContain('Aucune autre action « Clic du MJ » dans cette scène.');

    warning.querySelector('button')!.click();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'show-action', actionIds: [] });
  });

  it('Masquer l’action : même choix qu’« Afficher l’action », aide et erreur propres', () => {
    const fixture = TestBed.createComponent(ElementForm);
    fixture.componentRef.setInput('element', { id: 'e1', type: 'hide-action', actionIds: [] });
    fixture.componentRef.setInput('context', {
      ...context,
      actions: [
        anAction('s1', { id: 'self', name: 'Le garde', trigger: 'manual' }),
        anAction('s1', { id: 'fuite', name: 'La fuite', trigger: 'manual' }),
      ],
    });
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.componentRef.setInput('actionId', 'self');
    const emitted: ActionElement[] = [];
    fixture.componentInstance.elementChange.subscribe((e) => emitted.push(e));
    TestBed.tick();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Retire les actions cochées de la liste de la Présentation');
    const labels = [...el.querySelectorAll('label.app-check')].map((l) =>
      l.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(labels).toEqual(['Masquer toutes les actions', 'La fuite']);
    fixture.componentInstance.revealErrors();
    TestBed.tick();
    expect(el.textContent).toContain('Choisissez au moins une action à masquer');

    el.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1].click();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'hide-action', actionIds: ['fuite'] });
  });

  it('Masquer toutes les actions : case cochée, plus d’action à choisir', () => {
    const fixture = TestBed.createComponent(ElementForm);
    fixture.componentRef.setInput('element', {
      id: 'e1',
      type: 'hide-action',
      actionIds: ['fuite'],
    });
    fixture.componentRef.setInput('context', {
      ...context,
      actions: [anAction('s1', { id: 'fuite', name: 'La fuite', trigger: 'manual' })],
    });
    fixture.componentRef.setInput('sceneId', 's1');
    fixture.componentRef.setInput('projectId', 'p1');
    const emitted: ActionElement[] = [];
    fixture.componentInstance.elementChange.subscribe((e) => emitted.push(e));
    TestBed.tick();
    const el = fixture.nativeElement as HTMLElement;
    const target = () => el.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1];
    const checkbox = () => el.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    expect(checkbox().parentElement?.textContent).toContain('Masquer toutes les actions');
    expect(target().disabled).toBe(false);

    checkbox().click();
    const all = emitted.at(-1)!;
    expect(all).toEqual({ id: 'e1', type: 'hide-action', actionIds: [], all: true });
    fixture.componentRef.setInput('element', all);
    TestBed.tick();
    expect(target().disabled).toBe(true);
    expect(target().checked).toBe(false);
    expect(fixture.componentInstance.invalid()).toBe(false);

    checkbox().click();
    expect(emitted.at(-1)).toEqual({ id: 'e1', type: 'hide-action', actionIds: [] });
  });

  it('Afficher l’action : pas de case « toutes les actions »', () => {
    const { el } = render({ id: 'e1', type: 'show-action', actionIds: [] });
    expect(el.querySelector('input[type=checkbox]')).toBeNull();
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
