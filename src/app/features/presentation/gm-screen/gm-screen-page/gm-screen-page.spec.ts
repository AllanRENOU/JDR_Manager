import { TestBed } from '@angular/core/testing';

import { aProject, anAction } from '../../../../../testing/data-builders';
import { seedPresentation, usePresentation } from '../../../../../testing/presentation-harness';
import { DATA_REPOSITORY } from '../../../../core/data/data-repository';
import { lastEditedSceneKey } from '../../../../core/preferences/last-edited-scene';
import { UiPreferences } from '../../../../core/preferences/ui-preferences';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { PresentationEngine } from '../../engine/presentation-engine';
import { GmScreenPage } from './gm-screen-page';

describe('GmScreenPage', () => {
  usePresentation();

  async function render(projectId: string) {
    const fixture = TestBed.createComponent(GmScreenPage);
    fixture.componentRef.setInput('projectId', projectId);
    await vi.waitFor(async () => {
      await fixture.whenStable();
      TestBed.tick();
      expect(
        fixture.nativeElement.querySelector('app-alert') ??
          document.querySelector('app-launch-dialog'),
      ).not.toBeNull();
    });
    const engine = fixture.debugElement.injector.get(PresentationEngine);
    return { el: fixture.nativeElement as HTMLElement, fixture, engine };
  }
  const button = (root: ParentNode, label: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(label),
    )!;
  /** Lance la partie depuis la fenêtre de lancement (bouton `label`). */
  async function launch(label: string, page: Awaited<ReturnType<typeof render>>) {
    button(document.querySelector('app-launch-dialog')!, label).click();
    await vi.waitFor(async () => {
      await page.fixture.whenStable();
      expect(page.engine.sounds()).toHaveLength(1);
      expect(page.el.querySelector('app-feed .text')).not.toBeNull();
    });
  }

  it('signale un projet introuvable', async () => {
    const { el } = await render('inconnu');
    expect(el.querySelector('app-alert')?.textContent).toContain('Ce projet est introuvable');
  });

  it('indique qu’un projet sans scène n’a rien à présenter (4.8)', async () => {
    const project = aProject();
    await TestBed.inject(DATA_REPOSITORY).saveProject(project);
    const { el } = await render(project.id);
    expect(el.querySelector('app-alert')?.textContent).toContain('pas encore de scène');
    expect(el.querySelector('app-alert a')?.getAttribute('href')).toBe(
      `/projects/${project.id}/edit`,
    );
    expect(document.querySelector('app-launch-dialog')).toBeNull();
  });

  it('sans partie : la fenêtre de lancement ouvre la première scène (10.1.3, 10.2.1)', async () => {
    await seedPresentation();
    const page = await render('p1');
    expect(document.querySelector('app-launch-dialog')?.textContent).toContain('La taverne');
    await launch('Commencer la partie', page);

    const { el } = page;
    expect(document.querySelector('app-launch-dialog')).toBeNull();
    expect(el.querySelector('app-header')?.classList).toContain('app-header--play');
    expect(el.querySelector('.heading__context')?.textContent).toContain('La crypte · Acte I');
    expect(el.querySelector('h1')?.textContent).toContain('La taverne');
    expect(el.querySelector('[aria-label="Mode Présentation"]')).not.toBeNull();
    expect(el.querySelector('app-feed .text')?.textContent).toContain('Odeur de bière.');
    expect(el.querySelector('.panel')?.getAttribute('aria-label')).toBe('Panneau de contrôle');
    expect(
      [...el.querySelectorAll('.panel .section__title')].map((h) => h.textContent?.trim()),
    ).toEqual(['Battlemap', 'Actions', 'Sons']);
  });

  it('partie sauvegardée : Continuer reprend la dernière scène (10.1.2)', async () => {
    await seedPresentation();
    let page = await render('p1');
    await launch('Commencer la partie', page);
    await page.engine.openScene('B');
    await page.engine.stop();
    page.fixture.destroy();

    page = await render('p1');
    const dialog = document.querySelector('app-launch-dialog') as HTMLElement;
    expect(dialog.textContent).toContain('Une partie est en cours');
    expect(dialog.textContent).toContain('La forêt');
    button(dialog, 'Continuer la partie').click();
    await vi.waitFor(async () => {
      await page.fixture.whenStable();
      expect(page.el.querySelector('h1')?.textContent).toContain('La forêt');
    });
  });

  describe('mode démo', () => {
    async function renderDemo(scene?: string) {
      const fixture = TestBed.createComponent(GmScreenPage);
      fixture.componentRef.setInput('projectId', 'p1');
      fixture.componentRef.setInput('demo', '1');
      if (scene) {
        fixture.componentRef.setInput('scene', scene);
      }
      const engine = fixture.debugElement.injector.get(PresentationEngine);
      await vi.waitFor(async () => {
        await fixture.whenStable();
        expect(engine.status()).toBe('ready');
      });
      await fixture.whenStable();
      return { el: fixture.nativeElement as HTMLElement, fixture, engine };
    }

    it('démarre sans fenêtre de lancement à la scène demandée ; pastille et retour à l’éditeur', async () => {
      await seedPresentation();
      const { el, engine, fixture } = await renderDemo('B');
      TestBed.tick();
      expect(document.querySelector('app-launch-dialog')).toBeNull();
      expect(engine.scene()?.id).toBe('B');
      expect(engine.demo()).toBe(true);
      expect(el.querySelector('.demo-pill')?.textContent).toContain('Démo');
      expect(button(el, 'Ouvrir la fenêtre joueurs')).toBeDefined();

      await engine.openScene('C');
      await fixture.whenStable();
      const back = el.querySelector('app-header a') as HTMLAnchorElement;
      expect(back.getAttribute('aria-label')).toBe('Retour à l’éditeur');
      expect(back.getAttribute('href')).toBe('/projects/p1/edit?scene=C');
      await engine.stop();
      expect(await TestBed.inject(DATA_REPOSITORY).getPlaySession('p1')).toBeUndefined();
    });

    it('sans scène demandée : dernière scène ouverte dans l’éditeur', async () => {
      await seedPresentation();
      TestBed.inject(UiPreferences).set(lastEditedSceneKey('p1'), 'C');
      const { engine } = await renderDemo();
      expect(engine.scene()?.id).toBe('C');
      await engine.stop();
    });
  });

  it('« Aller à une scène » : arborescence, scène actuelle grisée (10.2.2)', async () => {
    await seedPresentation();
    const page = await render('p1');
    await launch('Commencer la partie', page);

    button(page.el, 'Aller à une scène').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-selection-dialog .tree__row')).not.toBeNull();
    });
    const dialog = document.querySelector('app-selection-dialog') as HTMLElement;
    const row = (name: string) =>
      [...dialog.querySelectorAll<HTMLElement>('.tree__row')].find((r) =>
        r.textContent?.includes(name),
      )!;
    expect(row('La taverne').getAttribute('aria-disabled')).toBe('true');
    row('Le marché').click();
    TestBed.tick();
    button(dialog, 'Ouvrir la scène').click();
    await vi.waitFor(async () => {
      await page.fixture.whenStable();
      expect(page.el.querySelector('h1')?.textContent).toContain('Le marché');
    });
  });
  it('« Deux fenêtres » ouvre la fenêtre joueurs au lancement ; pastille, fenêtre bloquée (11.1, 11.7)', async () => {
    await seedPresentation();
    const popup = { closed: false, focus: vi.fn() } as unknown as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const page = await render('p1');
    (document.querySelector('app-launch-dialog input[value=dual]') as HTMLInputElement).click();
    TestBed.tick();
    await launch('Commencer la partie', page);

    // Fenêtre bloquée par le navigateur : message et bouton pour réessayer.
    expect(open).toHaveBeenCalledWith('/projects/p1/player', 'jdr-manager-player-p1', 'popup');
    expect(TestBed.inject(Notifications).notifications().at(-1)?.message).toContain(
      'Le navigateur a bloqué la fenêtre joueurs',
    );
    expect(page.el.querySelector('.player-pill')).toBeNull();

    open.mockReturnValue(popup);
    button(page.el, 'Ouvrir la fenêtre joueurs').click();
    await page.fixture.whenStable();
    expect(page.el.querySelector('.player-pill')?.textContent).toContain('Fenêtre joueurs ouverte');
    expect(button(page.el, 'Ouvrir la fenêtre joueurs')).toBeUndefined();
  });

  it('raccourcis clavier : action n°1, clic à continuer, aide ; ignorés pendant une saisie (13.4.3)', async () => {
    await seedPresentation([
      anAction('A', {
        id: 'm1',
        name: 'Le garde',
        trigger: 'manual',
        order: 2,
        elements: [
          { id: 'uc', type: 'user-click', text: 'Il approche.' },
          { id: 't-m1', type: 'add-text', text: 'Il parle.' },
        ],
      }),
    ]);
    const page = await render('p1');
    await launch('Commencer la partie', page);
    const press = (key: string, target: EventTarget = document.body) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    const input = document.body.appendChild(document.createElement('input'));
    press('1', input);
    await page.fixture.whenStable();
    expect(page.el.querySelector('.click')).toBeNull();
    input.remove();

    press('1');
    await vi.waitFor(async () => {
      await page.fixture.whenStable();
      expect(page.el.querySelector('.click')?.textContent).toContain('Il approche.');
    });
    press('c');
    await vi.waitFor(async () => {
      await page.fixture.whenStable();
      expect(page.el.textContent).toContain('Il parle.');
    });

    press('?');
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-shortcuts-dialog')).not.toBeNull();
    });
    // Fenêtre ouverte : les raccourcis de l'écran sont ignorés.
    const open = vi.spyOn(page.engine, 'togglePlayback');
    press('p');
    expect(open).not.toHaveBeenCalled();
  });
});
