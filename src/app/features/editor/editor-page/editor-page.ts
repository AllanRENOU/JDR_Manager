import { Component, DestroyRef, effect, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowLeft,
  LucideClapperboard,
  LucideFolderPlus,
  LucidePencilRuler,
  LucidePlay,
  LucidePlus,
  LucideStar,
} from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { FORMAT_LABELS, MediaKind } from '../../../core/media/media-types';
import { Id, SceneNode, TreeNodeKind } from '../../../core/models';
import { FileDrop } from '../../../shared/file-drop/file-drop';
import { FileDropOverlay } from '../../../shared/file-drop/file-drop-overlay/file-drop-overlay';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Tree, TreeCreateEvent, TreeMenuItem, TreeRenameEvent } from '../../../shared/tree/tree';
import { TreeLabels } from '../../../shared/tree/tree-labels';
import { TreeMoveEvent } from '../../../shared/tree/tree-model';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Pill } from '../../../shared/ui/pill/pill';
import { ActionsPanel } from '../actions-panel/actions-panel';
import { BattlemapsPanel } from '../battlemaps-panel/battlemaps-panel';
import { EditorStore } from '../editor-store';
import { SequencePanel } from '../sequence-panel/sequence-panel';

/** Libellés de l'arborescence des scènes (TEC-61). */
const SCENE_TREE_LABELS: Partial<TreeLabels> = { newItem: 'scene.newScene' };
import { Capitalize } from '../../../shared/ui/capitalize/capitalize';

/** Mode Édition d'un projet (`/projects/:projectId/edit`, PRJ-03). */
import { SettingsButton } from '../../settings/settings-button/settings-button';
@Component({
  selector: 'app-editor-page',
  imports: [
    Capitalize,
    SettingsButton,
    AppHeader,
    ActionsPanel,
    BattlemapsPanel,
    Alert,
    Button,
    SequencePanel,
    FileDrop,
    FileDropOverlay,
    Pill,
    ProjectNav,
    Tree,
    Field,
    Input,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucideClapperboard,
    LucideFolderPlus,
    LucidePencilRuler,
    LucidePlay,
    LucidePlus,
    LucideStar,
  ],
  providers: [EditorStore],
  host: { '(window:beforeunload)': 'onBeforeUnload()' },
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage {
  protected readonly store = inject(EditorStore);
  private readonly notifications = inject(Notifications);

  private readonly transloco = inject(TranslocoService);
  private readonly tree = viewChild<Tree<SceneNode>>('tree');
  protected readonly treeLabels = SCENE_TREE_LABELS;

  /**
   * Confirmation de suppression d'une scène (ou d'un dossier) visée par des « Changer de scène » :
   * avertit, comme pour les sons et les battlemaps utilisés (12.3). `null` : message par défaut.
   */
  protected readonly sceneDeleteMessage = (node: SceneNode): string | null => {
    const count = this.store.sceneTargetCount(node.id);
    if (count === 0) {
      return null;
    }
    const base = node.kind === 'folder' ? 'scene.deleteFolderTargeted' : 'scene.deleteTargeted';
    return this.transloco.translate(pluralKey(base, count), { count });
  };
  protected readonly imageKinds: readonly MediaKind[] = ['image'];

  /** Entrées propres aux scènes dans le menu de l'arborescence (SCN-09). */
  protected readonly menuItems: TreeMenuItem<SceneNode>[] = [
    {
      label: 'scene.setFirst',
      appliesTo: 'item',
      run: (node) => this.run(this.store.setFirstScene(node.id)),
      hidden: (node) => this.store.isFirstScene(node.id),
    },
    {
      label: 'common.actions.duplicate',
      appliesTo: 'item',
      run: (node) => this.run(this.store.duplicateScene(node.id)),
    },
  ];

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
    // Rien ne se perd en quittant l'écran : la saisie en attente est enregistrée.
    inject(DestroyRef).onDestroy(() => {
      this.store.flush().catch((error) => this.notifications.fromError(error));
    });
  }

  /** Fermeture ou rechargement de l'onglet : enregistrement de la saisie en attente. */
  protected onBeforeUnload(): void {
    void this.store.flush();
  }

  protected onSceneTextBlur(): void {
    this.store.flush().catch((error) => this.notifications.fromError(error));
  }

  /** Bouton « Créer la première scène » : comme depuis l'arborescence, lance son renommage. */
  protected async createFirstScene(): Promise<void> {
    try {
      const scene = await this.store.createFirstScene();
      // L'arborescence apparaît avec le premier nœud : on attend son rendu.
      setTimeout(() => this.tree()?.startRename(scene.id));
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  protected onSceneTextInput(text: string): void {
    this.store.editSceneText(text);
  }

  protected openScene(id: Id | null): void {
    this.store.openScene(id).catch((error) => this.notifications.fromError(error));
  }

  /**
   * Boutons du haut de l'arborescence : crée dans le dossier sélectionné, à côté de la scène
   * sélectionnée, sinon dans le dossier de la scène ouverte. Le dossier visé est déplié.
   */
  protected createFromHeader(kind: TreeNodeKind): void {
    const tree = this.tree();
    const parentId = this.store.creationParent(tree?.selectedId() ?? null);
    if (tree) {
      tree.requestCreate(parentId, kind);
    } else {
      void this.create({ parentId, kind });
    }
  }

  /** Crée un dossier ou une scène (boutons du haut, menu d'un dossier), puis lance son renommage. */
  protected async create(event: TreeCreateEvent): Promise<void> {
    const name = this.transloco.translate(
      event.kind === 'folder' ? 'tree.newFolder' : 'scene.newSceneName',
    );
    try {
      const node = await this.store.createNode(event.kind, event.parentId, name);
      // L'arborescence apparaît avec le premier nœud : on attend son rendu.
      setTimeout(() => this.tree()?.startRename(node.id));
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  /** Titre de la scène modifié dans la zone centrale ; un nom vide rétablit l'ancien. */
  protected renameScene(node: SceneNode, input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name) {
      input.value = node.name;
      return;
    }
    this.run(this.store.renameNode(node.id, name));
  }

  protected rename(event: TreeRenameEvent): void {
    this.run(this.store.renameNode(event.id, event.name));
  }

  protected remove(id: Id): void {
    this.run(this.store.removeNode(id));
  }

  protected move(move: TreeMoveEvent): void {
    this.run(this.store.moveNode(move));
  }

  private run(task: Promise<unknown>): void {
    task.catch((error) => this.notifications.fromError(error));
  }

  /** Images importées par le bouton « Importer » ou déposées sur l'éditeur (BTM-01, BTM-04). */
  protected async importImages(files: readonly File[]): Promise<void> {
    const scene = this.store.selectedNode()?.name ?? '';
    const { imported, rejected, failure } = await this.store.importBattlemaps(files);
    if (rejected.length > 0) {
      this.notifications.error(
        this.transloco.translate('fileDrop.rejected', {
          count: rejected.length,
          names: rejected.map((file) => file.name).join(', '),
          formats: FORMAT_LABELS.image.join(', '),
        }),
      );
    }
    if (imported.length > 0) {
      this.notifications.info(
        this.transloco.translate(pluralKey('battlemap.imported', imported.length), {
          count: imported.length,
          scene,
        }),
      );
    }
    if (failure !== undefined) {
      this.notifications.fromError(failure);
    }
  }
}
