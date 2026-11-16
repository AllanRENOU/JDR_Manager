import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowLeft,
  LucideFolderPlus,
  LucidePencilRuler,
  LucidePlay,
  LucidePlus,
  LucideScrollText,
  LucideSearch,
} from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { Id, SheetNode, TreeNodeKind } from '../../../core/models';
import { Tree, TreeCreateEvent, TreeRenameEvent } from '../../../shared/tree/tree';
import { TreeLabels } from '../../../shared/tree/tree-labels';
import { TreeMoveEvent } from '../../../shared/tree/tree-model';
import { Input } from '../../../shared/ui/input/input';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';
import { AudioPlayer } from '../../presentation/audio/audio-player';
import { SettingsButton } from '../../settings/settings-button/settings-button';
import { SheetsStore } from '../sheets-store';

/** Libellés de l'arborescence des fiches (TEC-61). */
const SHEET_TREE_LABELS: Partial<TreeLabels> = {
  newItem: 'sheet.newSheet',
  deleteItemMessage: 'sheet.deleteMessage',
};

/**
 * Écran « Fiches » d'un projet (FCH-02, Brief §7.2), route `/projects/:projectId/sheets` :
 * arborescence des fiches à gauche, fiche ouverte au centre.
 */
@Component({
  selector: 'app-sheets-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    Input,
    Placeholder,
    ProjectNav,
    RouterLink,
    SettingsButton,
    Tree,
    TranslocoPipe,
    LucideArrowLeft,
    LucideFolderPlus,
    LucidePencilRuler,
    LucidePlay,
    LucidePlus,
    LucideScrollText,
    LucideSearch,
  ],
  providers: [SheetsStore],
  templateUrl: './sheets-page.html',
  styleUrl: './sheets-page.scss',
})
export class SheetsPage {
  private readonly notifications = inject(Notifications);
  private readonly audio = inject(AudioPlayer);
  private readonly transloco = inject(TranslocoService);
  protected readonly store = inject(SheetsStore);
  private readonly tree = viewChild<Tree<SheetNode>>('tree');
  protected readonly treeLabels = SHEET_TREE_LABELS;

  /** Dossiers repliés hors recherche ; pendant une recherche, tout est déplié. */
  private readonly collapsed = signal<readonly Id[]>([]);
  protected readonly visibleCollapsed = computed(() =>
    this.store.searching() ? [] : this.collapsed(),
  );

  /**
   * Confirmation de suppression d'une fiche (ou d'un dossier) affichée par des actions : avertit
   * que ces actions la signaleront comme supprimée (FCH-07, PRS-07). `null` : message par défaut.
   */
  protected readonly deleteMessage = (node: SheetNode): string | null => {
    const count = this.store.usageCount(node.id);
    if (count === 0) {
      return null;
    }
    const base = node.kind === 'folder' ? 'sheet.deleteFolderUsed' : 'sheet.deleteUsed';
    return this.transloco.translate(pluralKey(base, count), { count });
  };

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
  }

  protected onCollapsedChange(ids: readonly Id[]): void {
    if (!this.store.searching()) {
      this.collapsed.set(ids);
    }
  }

  /**
   * Boutons du haut de l'arborescence : crée dans le dossier sélectionné, à côté de la fiche
   * sélectionnée, sinon dans le dossier de la fiche ouverte. Le dossier visé est déplié.
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

  /** Crée un dossier ou une fiche (boutons, menu d'un dossier, état vide), puis lance son renommage. */
  protected async create(event: TreeCreateEvent): Promise<void> {
    const name = this.transloco.translate(
      event.kind === 'folder' ? 'tree.newFolder' : 'sheet.newSheetName',
    );
    try {
      const node = await this.store.createNode(event.kind, event.parentId, name);
      // L'arborescence apparaît avec le premier nœud : on attend son rendu.
      setTimeout(() => this.tree()?.startRename(node.id));
    } catch (error) {
      this.notifications.fromError(error);
    }
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

  /** « Présenter » lance une démo sans fenêtre de lancement : l'audio est débloqué dans le clic (TEC-43). */
  protected unlockAudio(): void {
    void this.audio.unlock();
  }
}
