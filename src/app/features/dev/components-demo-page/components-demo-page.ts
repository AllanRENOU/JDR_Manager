import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, inject, signal, viewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  LucideChevronDown,
  LucideClapperboard,
  LucideEllipsis,
  LucideMap,
  LucidePause,
  LucidePencil,
  LucidePlus,
  LucideX,
} from '@lucide/angular';

import { Id, SceneNode, newId } from '../../../core/models';
import { Theme } from '../../../core/theme/theme';
import { FileDrop } from '../../../shared/file-drop/file-drop';
import { FileDropOverlay } from '../../../shared/file-drop/file-drop-overlay/file-drop-overlay';
import { Selections } from '../../../shared/selection-dialog/selections';
import { Tree, TreeCreateEvent, TreeMenuItem, TreeRenameEvent } from '../../../shared/tree/tree';
import { TreeMoveEvent, applyMove, descendantIds } from '../../../shared/tree/tree-model';
import { DEMO_SCENES } from './demo-data';
import { Button } from '../../../shared/ui/button/button';
import { CollapsibleSection } from '../../../shared/ui/collapsible-section/collapsible-section';
import { DataError } from '../../../core/data/data-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { MarkdownEditor } from '../../../shared/markdown/markdown-editor';
import { MarkdownPipe } from '../../../shared/markdown/markdown-pipe';
import { Field } from '../../../shared/ui/field/field';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Menu } from '../../../shared/ui/menu/menu';
import { MenuItem } from '../../../shared/ui/menu/menu-item';
import { Modals } from '../../../shared/ui/modal/modals';
import { DemoModal } from './demo-modal/demo-modal';
import { Input } from '../../../shared/ui/input/input';
import { Pill, PillTone } from '../../../shared/ui/pill/pill';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';
import {
  SegmentedControl,
  SegmentedOption,
} from '../../../shared/ui/segmented-control/segmented-control';

/**
 * Page temporaire du lot 3 (route `/dev/components`) : catalogue des composants partagés
 * avec des données de test. À supprimer une fois les écrans réels en place.
 */
@Component({
  selector: 'app-components-demo-page',
  imports: [
    Button,
    Alert,
    FileDrop,
    FileDropOverlay,
    Tree,
    LucideClapperboard,
    Placeholder,
    LucideMap,
    CdkMenuTrigger,
    Menu,
    MenuItem,
    LucideEllipsis,
    LucideMap,
    LucideChevronDown,
    LucidePencil,
    CollapsibleSection,
    Pill,
    Field,
    Input,
    MarkdownEditor,
    MarkdownPipe,
    SegmentedControl,
    LucidePlus,
    LucidePause,
    LucideX,
  ],
  templateUrl: './components-demo-page.html',
  styleUrl: './components-demo-page.scss',
})
export class ComponentsDemoPage {
  protected readonly theme = inject(Theme);
  protected readonly markdownDemo = signal(
    '## La crypte\nLa porte **grince** et une odeur de _terre humide_ envahit la pièce.\n\n' +
      '- Une torche éteinte\n- Un coffre fermé\n\n> « Qui ose troubler mon repos ? »',
  );
  private readonly transloco = inject(TranslocoService);
  private readonly sceneTree = viewChild.required<Tree<SceneNode>>('sceneTree');
  private readonly modals = inject(Modals);
  private readonly selections = inject(Selections);
  protected readonly targetScene = signal<Id | null>(null);
  protected readonly droppedNames = signal('');
  protected readonly notifications = inject(Notifications);
  protected readonly modalResult = signal('—');
  protected readonly scenes = signal(DEMO_SCENES);
  protected readonly collapsed = signal<readonly Id[]>([]);
  protected readonly selectedScene = signal<Id | null>('taverne');
  protected readonly firstScene = signal<Id>('prologue');
  protected readonly checkedNext = signal<readonly Id[]>(['marche']);
  protected readonly sceneMenu: TreeMenuItem<SceneNode>[] = [
    {
      label: 'scene.setFirst',
      appliesTo: 'item',
      run: (node) => this.firstScene.set(node.id),
      hidden: (node) => node.id === this.firstScene(),
    },
  ];
  protected readonly menuChoice = signal('—');
  /** Liste « Scène suivante » ouverte au-dessus du bouton (Brief §6.11). */
  protected readonly abovePositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  ];
  protected readonly tones: PillTone[] = [
    'neutral',
    'accent',
    'battlemap',
    'sound',
    'stop-all',
    'text',
    'wait',
    'click',
    'scene',
  ];

  protected readonly triggerOptions: SegmentedOption<string>[] = [
    { value: 'scene-open', label: 'À l’ouverture de la scène' },
    { value: 'manual', label: 'Manuel' },
  ];
  protected readonly trigger = signal<string | null>('manual');

  protected openModal(): void {
    this.modals
      .open<string>(DemoModal, { data: { scene: 'La taverne' }, size: 'lg' })
      .closed.subscribe((result) => this.modalResult.set(result ?? 'annulé'));
  }

  // ── Arborescence : ce que fera l'éditeur de scène (le composant ne sauvegarde rien) ──
  protected onCreate(event: TreeCreateEvent): void {
    const siblings = this.scenes().filter((n) => n.parentId === event.parentId);
    const node: SceneNode = {
      id: newId(),
      projectId: 'demo',
      parentId: event.parentId,
      order: siblings.length,
      kind: event.kind,
      name: this.transloco.translate(event.kind === 'folder' ? 'tree.newFolder' : 'scene.new'),
    };
    this.scenes.update((nodes) => [...nodes, node]);
    this.selectedScene.set(node.id);
    this.sceneTree().startRename(node.id);
  }

  protected onRename(event: TreeRenameEvent): void {
    this.scenes.update((nodes) =>
      nodes.map((n) => (n.id === event.id ? { ...n, name: event.name } : n)),
    );
  }

  protected onMove(move: TreeMoveEvent): void {
    const changed = new Map(applyMove(this.scenes(), move).map((n) => [n.id, n]));
    this.scenes.update((nodes) => nodes.map((n) => changed.get(n.id) ?? n));
  }

  protected onRemove(id: Id): void {
    const removed = descendantIds(this.scenes(), id).add(id);
    this.scenes.update((nodes) => nodes.filter((n) => !removed.has(n.id)));
  }

  protected onFiles(files: File[]): void {
    this.droppedNames.set(files.map((f) => f.name).join(', '));
  }

  protected async chooseNextScenes(): Promise<void> {
    const ids = await this.selections.select({
      title: 'Choisir les scènes suivantes',
      subtitle: 'Scène : La taverne du Sanglier',
      nodes: this.scenes(),
      mode: 'multiple',
      checkedIds: this.checkedNext(),
      disabledIds: ['taverne'],
      labels: { disabled: 'scene.current' },
    });
    if (ids) {
      this.checkedNext.set(ids);
    }
  }

  protected async chooseTarget(): Promise<void> {
    const ids = await this.selections.select({
      title: 'Scène cible',
      nodes: this.scenes(),
      mode: 'single',
      checkedIds: this.targetScene() ? [this.targetScene()!] : [],
    });
    if (ids) {
      this.targetScene.set(ids[0]);
    }
  }

  protected async openConfirm(destructive: boolean): Promise<void> {
    const confirmed = await this.modals.confirm(
      destructive
        ? {
            title: 'Supprimer le dossier « Acte 1 » ?',
            message:
              'Les 4 scènes qu’il contient seront aussi supprimées. Cette action est irréversible.',
            confirmLabel: 'Supprimer',
            destructive: true,
          }
        : { title: 'Recommencer la partie ?', message: 'La progression actuelle sera effacée.' },
    );
    this.modalResult.set(confirmed ? 'confirmé' : 'annulé');
  }

  protected notifyError(): void {
    this.notifications.fromError(new DataError('unsupported-media-type', 'demo.gif'));
  }

  protected toggleTheme(): void {
    this.theme.setTheme(this.theme.theme() === 'nuit-doree' ? 'automne' : 'nuit-doree');
  }
}
