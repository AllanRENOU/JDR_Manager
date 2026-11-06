import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { Id, TreeNode } from '../../core/models';
import { Modals } from '../ui/modal/modals';
import { Tree, TreeCreateEvent, TreeMenuItem, TreeRenameEvent } from './tree';

const NODES: TreeNode[] = [
  { id: 'acte1', parentId: null, order: 0, kind: 'folder', name: 'Acte 1' },
  { id: 'taverne', parentId: 'acte1', order: 0, kind: 'item', name: 'La taverne' },
  { id: 'crypte', parentId: null, order: 1, kind: 'item', name: 'La crypte' },
];

@Component({
  imports: [Tree],
  template: `
    <app-tree
      #tree
      [nodes]="nodes()"
      [(collapsedIds)]="collapsed"
      [(selectedId)]="selected"
      (create)="created.push($event)"
      (rename)="renamed.push($event)"
      (remove)="removed.push($event)"
      [extraMenuItems]="extra"
      [canCreateItems]="canCreateItems()"
    />
  `,
})
class Host {
  readonly canCreateItems = signal(true);
  readonly tree = viewChild.required<Tree<TreeNode>>('tree');
  readonly created: TreeCreateEvent[] = [];
  readonly renamed: TreeRenameEvent[] = [];
  readonly removed: Id[] = [];
  readonly ran: string[] = [];
  readonly extra: TreeMenuItem<TreeNode>[] = [
    {
      label: 'common.actions.duplicate',
      appliesTo: 'item',
      run: (n) => this.ran.push(`dupliquer ${n.id}`),
    },
    {
      label: 'common.actions.edit',
      appliesTo: 'both',
      run: (n) => this.ran.push(`éditer ${n.id}`),
      hidden: (n) => n.id === 'crypte',
    },
  ];
  readonly selected = signal<Id | null>(null);
  readonly nodes = signal(NODES);
  readonly collapsed = signal<readonly Id[]>([]);
}

describe('Tree', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] }));
  afterEach(() => TestBed.inject(Modals).closeAll());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const labels = () =>
      [...fixture.nativeElement.querySelectorAll('.tree__label')].map((el) =>
        (el as HTMLElement).textContent?.trim(),
      );
    return { fixture, labels };
  }

  describe('construction et repli (3.2.1)', () => {
    it('construit l’arbre depuis la liste plate', async () => {
      const { labels } = await render();
      expect(labels()).toEqual(['Acte 1', 'La taverne', 'La crypte']);
    });

    it('replie et déplie un dossier, et expose l’état au parent', async () => {
      const { fixture, labels } = await render();
      const chevron = fixture.nativeElement.querySelector('.tree__chevron') as HTMLButtonElement;
      chevron.click();
      await fixture.whenStable();
      expect(labels()).toEqual(['Acte 1', 'La crypte']);
      expect(fixture.componentInstance.collapsed()).toEqual(['acte1']);

      chevron.click();
      await fixture.whenStable();
      expect(labels()).toEqual(['Acte 1', 'La taverne', 'La crypte']);
    });

    it('suit les changements de la liste de nœuds', async () => {
      const { fixture, labels } = await render();
      fixture.componentInstance.nodes.update((nodes) => [
        ...nodes,
        { id: 'cave', parentId: 'acte1', order: 1, kind: 'item', name: 'La cave' },
      ]);
      await fixture.whenStable();
      expect(labels()).toEqual(['Acte 1', 'La taverne', 'La cave', 'La crypte']);
    });
  });

  describe('sélection et modèle d’affichage (3.2.2)', () => {
    it('sélectionne une ligne au clic et suit la sélection du parent', async () => {
      const { fixture } = await render();
      const rows = () =>
        fixture.nativeElement.querySelectorAll('.tree__row') as NodeListOf<HTMLElement>;
      rows()[1].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toBe('taverne');
      expect(rows()[1].classList).toContain('tree__row--selected');

      fixture.componentInstance.selected.set('crypte');
      await fixture.whenStable();
      expect(rows()[1].classList).not.toContain('tree__row--selected');
      expect(rows()[2].classList).toContain('tree__row--selected');
    });

    it('déplier un dossier ne le sélectionne pas', async () => {
      const { fixture } = await render();
      (fixture.nativeElement.querySelector('.tree__chevron') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(fixture.componentInstance.selected()).toBeNull();
    });

    it('affiche les éléments avec le modèle fourni par le parent', async () => {
      @Component({
        imports: [Tree],
        template: `
          <app-tree [nodes]="nodes">
            <ng-template #item let-node let-row="row">
              <em class="custom">{{ node.name }} ({{ row.depth }})</em>
            </ng-template>
          </app-tree>
        `,
      })
      class TemplateHost {
        readonly nodes = NODES;
      }
      const fixture = TestBed.createComponent(TemplateHost);
      await fixture.whenStable();
      const custom = [...fixture.nativeElement.querySelectorAll('.custom')].map(
        (el) => (el as HTMLElement).textContent,
      );
      expect(custom).toEqual(['La taverne (1)', 'La crypte (0)']);
      // Les dossiers gardent l'affichage par défaut.
      expect(
        fixture.nativeElement.querySelector('.tree__row--folder .tree__label').textContent.trim(),
      ).toBe('Acte 1');
    });
  });

  describe('création, renommage, suppression (3.2.3)', () => {
    it('émet create et déplie le dossier parent', async () => {
      const { fixture } = await render();
      fixture.componentInstance.collapsed.set(['acte1']);
      fixture.componentInstance.tree().requestCreate('acte1', 'item');
      fixture.componentInstance.tree().requestCreate(null, 'folder');
      await fixture.whenStable();
      expect(fixture.componentInstance.created).toEqual([
        { parentId: 'acte1', kind: 'item' },
        { parentId: null, kind: 'folder' },
      ]);
      expect(fixture.componentInstance.collapsed()).toEqual([]);
    });

    it('renomme en place : Entrée valide, Échap annule, nom vide ou identique ignoré', async () => {
      const { fixture } = await render();
      const host = fixture.componentInstance;
      const input = async () => {
        await fixture.whenStable();
        return fixture.nativeElement.querySelector('.tree__rename') as HTMLInputElement | null;
      };

      host.tree().startRename('crypte');
      const field = (await input())!;
      expect(field.value).toBe('La crypte');
      expect(document.activeElement).toBe(field);
      expect(field.getAttribute('aria-label')).toBe('Nouveau nom de « La crypte »');
      field.value = '  La crypte maudite ';
      field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(await input()).toBeNull();
      expect(host.renamed).toEqual([{ id: 'crypte', name: 'La crypte maudite' }]);

      host.tree().startRename('crypte');
      const second = (await input())!;
      second.value = 'Autre';
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(await input()).toBeNull();

      host.tree().startRename('crypte');
      const third = (await input())!;
      third.value = '   ';
      third.dispatchEvent(new Event('blur'));
      expect(host.renamed).toHaveLength(1);
    });

    it('F2 sur une ligne lance le renommage', async () => {
      const { fixture } = await render();
      const row = fixture.nativeElement.querySelectorAll('.tree__row')[2] as HTMLElement;
      row.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
      await fixture.whenStable();
      expect((fixture.nativeElement.querySelector('.tree__rename') as HTMLInputElement).value).toBe(
        'La crypte',
      );
    });

    it('demande confirmation avant de supprimer ; le message d’un dossier précise son contenu', async () => {
      const { fixture } = await render();
      const host = fixture.componentInstance;

      const pending = host.tree().requestRemove(NODES[0]);
      TestBed.tick();
      const dialog = document.querySelector('app-confirm-dialog') as HTMLElement;
      expect(dialog.textContent).toContain('Supprimer « Acte 1 » ?');
      expect(dialog.textContent).toContain('tout son contenu (1 élément(s))');
      const [cancel, confirm] = dialog.querySelectorAll<HTMLButtonElement>('footer button');
      confirm.click();
      await pending;
      expect(host.removed).toEqual(['acte1']);

      const cancelled = host.tree().requestRemove(NODES[2]);
      TestBed.tick();
      expect(document.querySelector('app-confirm-dialog')?.textContent).toContain(
        'Cette action est irréversible.',
      );
      (document.querySelector('app-confirm-dialog footer button') as HTMLButtonElement).click();
      await cancelled;
      expect(host.removed).toEqual(['acte1']);
      expect(cancel).toBeDefined();
    });
  });

  describe('menu contextuel (3.2.4)', () => {
    const menuLabels = () =>
      [...document.querySelectorAll('.app-menu .app-menu-item')].map((el) =>
        (el as HTMLElement).textContent?.trim(),
      );

    it('ouvre le menu d’un dossier par le bouton « ⋯ » avec les entrées communes', async () => {
      const { fixture } = await render();
      const more = fixture.nativeElement.querySelector('.tree__more') as HTMLButtonElement;
      expect(more.getAttribute('aria-label')).toBe('Plus d’actions pour « Acte 1 »');
      more.click();
      await fixture.whenStable();
      expect(menuLabels()).toEqual([
        'Nouvel élément',
        'Nouveau sous-dossier',
        'Renommer',
        'Modifier',
        'Supprimer',
      ]);
      expect(fixture.componentInstance.selected()).toBeNull();

      (document.querySelectorAll('.app-menu-item')[1] as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(fixture.componentInstance.created).toEqual([{ parentId: 'acte1', kind: 'folder' }]);
    });

    it('sans « Nouvel élément » quand le parent crée les éléments autrement (canCreateItems)', async () => {
      const { fixture } = await render();
      fixture.componentInstance.canCreateItems.set(false);
      await fixture.whenStable();
      (fixture.nativeElement.querySelector('.tree__more') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(menuLabels()).toEqual(['Nouveau sous-dossier', 'Renommer', 'Modifier', 'Supprimer']);
    });

    it('ouvre le même menu au clic droit ; entrées spécifiques filtrées par type et par nœud', async () => {
      const { fixture } = await render();
      const rows = fixture.nativeElement.querySelectorAll('.tree__row') as NodeListOf<HTMLElement>;
      rows[2].dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }),
      );
      await fixture.whenStable();
      // « La crypte » : élément, l'entrée « Modifier » est masquée pour lui.
      expect(menuLabels()).toEqual(['Renommer', 'Dupliquer', 'Supprimer']);

      (document.querySelectorAll('.app-menu-item')[1] as HTMLButtonElement).click();
      await fixture.whenStable();
      expect(fixture.componentInstance.ran).toEqual(['dupliquer crypte']);
    });

    it('« Renommer » du menu passe la ligne en saisie', async () => {
      const { fixture } = await render();
      (fixture.nativeElement.querySelectorAll('.tree__more')[1] as HTMLButtonElement).click();
      await fixture.whenStable();
      (document.querySelector('.app-menu-item') as HTMLButtonElement).click();
      await fixture.whenStable();
      expect((fixture.nativeElement.querySelector('.tree__rename') as HTMLInputElement).value).toBe(
        'La taverne',
      );
    });
  });

  describe('lecture seule et modes de sélection (3.2.6)', () => {
    @Component({
      imports: [Tree],
      template: `
        <app-tree
          [nodes]="nodes"
          [editable]="false"
          [selectionMode]="mode()"
          [disabledIds]="['crypte']"
          [labels]="{ disabled: 'scene.current' }"
          [(checkedIds)]="checked"
          (rename)="renamed = true"
        />
      `,
    })
    class SelectionHost {
      readonly nodes = [
        ...NODES,
        { id: 'cave', parentId: null, order: 2, kind: 'item', name: 'La cave' } as TreeNode,
      ];
      readonly mode = signal<'single' | 'multiple'>('multiple');
      readonly checked = signal<readonly Id[]>(['taverne']);
      renamed = false;
    }

    async function renderSelection() {
      const fixture = TestBed.createComponent(SelectionHost);
      await fixture.whenStable();
      const rows = () =>
        fixture.nativeElement.querySelectorAll('.tree__row') as NodeListOf<HTMLElement>;
      return { fixture, rows };
    }

    it('lecture seule : ni bouton « ⋯ », ni menu au clic droit, ni renommage', async () => {
      const { fixture, rows } = await renderSelection();
      expect(fixture.nativeElement.querySelector('.tree__more')).toBeNull();
      rows()[1].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
      rows()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));
      await fixture.whenStable();
      expect(document.querySelector('.app-menu')).toBeNull();
      expect(fixture.nativeElement.querySelector('.tree__rename')).toBeNull();
    });

    it('sélection multiple : cases pré-cochées, clic pour cocher / décocher, élément désactivé grisé', async () => {
      const { fixture, rows } = await renderSelection();
      const checks = () =>
        [...fixture.nativeElement.querySelectorAll('.tree__check')].map(
          (el) => (el as HTMLInputElement).checked,
        );
      // Lignes : Acte 1 (dossier), La taverne, La crypte (désactivée), La cave
      expect(fixture.nativeElement.querySelector('.tree__check').type).toBe('checkbox');
      expect(checks()).toEqual([true, false, false]);
      expect(rows()[2].classList).toContain('tree__row--disabled');
      expect(rows()[2].textContent).toContain('scène actuelle');

      rows()[3].click();
      rows()[1].click();
      rows()[2].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.checked()).toEqual(['cave']);

      // Clic sur un dossier : plie / déplie sans cocher.
      rows()[0].click();
      await fixture.whenStable();
      expect(rows()).toHaveLength(3);
      expect(fixture.componentInstance.checked()).toEqual(['cave']);
    });

    it('sélection unique : boutons radio, un seul élément coché', async () => {
      const { fixture, rows } = await renderSelection();
      fixture.componentInstance.mode.set('single');
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.tree__check').type).toBe('radio');
      rows()[3].click();
      await fixture.whenStable();
      expect(fixture.componentInstance.checked()).toEqual(['cave']);
    });
  });

  describe('clavier et ARIA (3.2.7)', () => {
    const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) =>
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
      );

    it('expose le motif tree WAI-ARIA', async () => {
      const { fixture } = await render();
      const tree = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
      const items = tree.querySelectorAll<HTMLElement>('[role="treeitem"]');
      expect(items).toHaveLength(3);
      expect(items[0].getAttribute('aria-level')).toBe('1');
      expect(items[0].getAttribute('aria-expanded')).toBe('true');
      expect(items[1].getAttribute('aria-level')).toBe('2');
      expect(items[1].getAttribute('aria-expanded')).toBeNull();
      expect(items[1].getAttribute('aria-selected')).toBe('false');
      // Une seule ligne atteignable par Tab (la première, faute de sélection).
      expect([...items].map((i) => i.tabIndex)).toEqual([0, -1, -1]);
    });

    it('navigue aux flèches, déplie / replie, remonte au parent, active à Entrée', async () => {
      const { fixture } = await render();
      const items = () =>
        fixture.nativeElement.querySelectorAll('[role="treeitem"]') as NodeListOf<HTMLElement>;
      const settle = () => fixture.whenStable();

      key(items()[0], 'ArrowLeft'); // replie Acte 1
      await settle();
      expect(items()).toHaveLength(2);
      key(items()[0], 'ArrowRight'); // déplie
      await settle();
      expect(items()).toHaveLength(3);
      key(items()[0], 'ArrowRight'); // descend au premier enfant
      await settle();
      expect(document.activeElement).toBe(items()[1]);
      expect(items()[1].tabIndex).toBe(0);

      key(items()[1], 'End');
      await settle();
      expect(document.activeElement).toBe(items()[2]);
      key(items()[2], 'Home');
      key(items()[0], 'ArrowDown');
      await settle();
      key(items()[1], 'ArrowLeft'); // remonte au dossier parent
      await settle();
      expect(document.activeElement).toBe(items()[0]);

      key(items()[0], 'ArrowDown');
      key(items()[1], 'Enter');
      await settle();
      expect(fixture.componentInstance.selected()).toBe('taverne');
      expect(items()[1].getAttribute('aria-selected')).toBe('true');
    });

    it('Suppr demande la suppression, Maj+F10 ouvre le menu', async () => {
      const { fixture } = await render();
      const items = fixture.nativeElement.querySelectorAll(
        '[role="treeitem"]',
      ) as NodeListOf<HTMLElement>;
      key(items[2], 'F10', { shiftKey: true });
      await fixture.whenStable();
      expect(document.querySelector('.app-menu')).not.toBeNull();
      TestBed.inject(Modals).closeAll();

      key(items[2], 'Delete');
      TestBed.tick();
      expect(document.querySelector('app-confirm-dialog')?.textContent).toContain(
        'Supprimer « La crypte » ?',
      );
    });

    it('en sélection multiple : Espace coche, aria-checked et aria-multiselectable', async () => {
      @Component({
        imports: [Tree],
        template: `<app-tree
          [nodes]="nodes"
          selectionMode="multiple"
          [editable]="false"
          ariaLabel="Scènes"
          [(checkedIds)]="checked"
        />`,
      })
      class CheckHost {
        readonly nodes = NODES;
        readonly checked = signal<readonly Id[]>([]);
      }
      const fixture = TestBed.createComponent(CheckHost);
      await fixture.whenStable();
      const tree = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
      expect(tree.getAttribute('aria-label')).toBe('Scènes');
      expect(tree.getAttribute('aria-multiselectable')).toBe('true');
      const crypte = tree.querySelectorAll<HTMLElement>('[role="treeitem"]')[2];
      expect(crypte.getAttribute('aria-checked')).toBe('false');
      key(crypte, ' ');
      await fixture.whenStable();
      expect(fixture.componentInstance.checked()).toEqual(['crypte']);
      expect(crypte.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('glisser-déposer : branchement du composant (3.2.5)', () => {
    /** Accès aux gestionnaires d'événements CDK, appelés directement (jsdom ne sait pas glisser). */
    interface DragApi {
      onDragStarted(id: Id): void;
      onDragMoved(event: { pointerPosition: { x: number; y: number } }): void;
      onDragEnded(): void;
    }

    async function setup() {
      // jsdom ne fournit pas elementFromPoint : on l'ajoute pour pouvoir le simuler.
      if (!('elementFromPoint' in document)) {
        Object.assign(document, { elementFromPoint: () => null });
      }
      const { fixture } = await render();
      const host = fixture.componentInstance;
      const api = host.tree() as unknown as DragApi;
      const moved: unknown[] = [];
      host.tree().move.subscribe((m) => moved.push(m));
      const rows = fixture.nativeElement.querySelectorAll('.tree__row') as NodeListOf<HTMLElement>;
      // Lignes de 40 px empilées : Acte 1 (0-40), La taverne (40-80), La crypte (80-120).
      rows.forEach((row, i) => {
        row.getBoundingClientRect = () =>
          ({ top: i * 40, height: 40, bottom: i * 40 + 40 }) as DOMRect;
      });
      const treeHost = fixture.nativeElement.querySelector('app-tree') as HTMLElement;
      treeHost.getBoundingClientRect = () =>
        ({ left: 0, right: 300, top: 0, bottom: 200 }) as DOMRect;
      const pointAt = (y: number) =>
        vi
          .spyOn(document, 'elementFromPoint')
          .mockReturnValue(y < 120 ? rows[Math.floor(y / 40)] : treeHost);
      return { fixture, api, moved, rows, pointAt };
    }

    afterEach(() => vi.restoreAllMocks());

    it('dépose un élément dans un dossier et le signale visuellement pendant le glissement', async () => {
      const { fixture, api, moved, rows, pointAt } = await setup();
      api.onDragStarted('crypte');
      pointAt(20);
      api.onDragMoved({ pointerPosition: { x: 50, y: 20 } });
      await fixture.whenStable();
      expect(rows[0].classList).toContain('tree__row--drop-inside');

      api.onDragEnded();
      expect(moved).toEqual([{ id: 'crypte', parentId: 'acte1', order: 1 }]);
    });

    it('dépose avant une ligne, ou à la fin de la racine sous la dernière ligne', async () => {
      const { fixture, api, moved, rows, pointAt } = await setup();
      api.onDragStarted('crypte');
      pointAt(42);
      api.onDragMoved({ pointerPosition: { x: 50, y: 42 } });
      await fixture.whenStable();
      expect(rows[1].classList).toContain('tree__row--drop-before');
      api.onDragEnded();

      api.onDragStarted('taverne');
      pointAt(150);
      api.onDragMoved({ pointerPosition: { x: 50, y: 150 } });
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.tree').classList).toContain('tree--drop-root');
      api.onDragEnded();

      expect(moved).toEqual([
        { id: 'crypte', parentId: 'acte1', order: 0 },
        { id: 'taverne', parentId: null, order: 2 },
      ]);
    });

    it('n’émet rien pour un dépôt impossible ou hors de l’arborescence', async () => {
      const { api, moved, pointAt } = await setup();
      api.onDragStarted('acte1');
      pointAt(60); // dans son propre enfant
      api.onDragMoved({ pointerPosition: { x: 50, y: 60 } });
      api.onDragEnded();

      api.onDragStarted('crypte');
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(document.body);
      api.onDragMoved({ pointerPosition: { x: 999, y: 999 } });
      api.onDragEnded();
      expect(moved).toEqual([]);
    });
  });
});
