import { Component, effect, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideArrowLeft, LucideFolderPlus, LucidePencilRuler, LucidePlay } from '@lucide/angular';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Id, SoundLibraryId, SoundNode } from '../../../core/models';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Tree, TreeCreateEvent, TreeRenameEvent } from '../../../shared/tree/tree';
import { TreeLabels } from '../../../shared/tree/tree-labels';
import { TreeMoveEvent } from '../../../shared/tree/tree-model';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { SoundLibraryStore } from '../sound-library-store';

/** Libellés des arborescences de sons (TEC-61) : seuls les dossiers y figurent. */
const SOUND_TREE_LABELS: Partial<TreeLabels> = {
  deleteFolderMessage: 'sound.deleteFolderMessage',
};

/**
 * Bibliothèques de sons (SON-01, Brief §7.2).
 * - `/projects/:projectId/sounds` : sons du projet et bibliothèque globale (onglet « Sons » de l'Édition) ;
 * - `/sounds` : bibliothèque globale seule, ouverte depuis l'accueil.
 */
@Component({
  selector: 'app-sound-library-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    ProjectNav,
    Tree,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucideFolderPlus,
    LucidePencilRuler,
    LucidePlay,
  ],
  providers: [SoundLibraryStore],
  templateUrl: './sound-library-page.html',
  styleUrl: './sound-library-page.scss',
})
export class SoundLibraryPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  protected readonly store = inject(SoundLibraryStore);
  protected readonly treeLabels = SOUND_TREE_LABELS;

  /** Paramètre de route `:projectId` ; absent sur `/sounds`. */
  readonly projectId = input<Id>();

  /** Projet ouvert (`undefined` : projet introuvable ; inactif sur `/sounds`). */
  protected readonly project = resource({
    params: () => this.projectId(),
    loader: ({ params }) => this.repository.getProject(params),
  });

  constructor() {
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
  }

  /** Nom affiché d'une bibliothèque. */
  protected libraryName(isGlobal: boolean): string {
    return this.transloco.translate(isGlobal ? 'sound.global' : 'sound.project');
  }

  /** Crée un dossier (« + » de la bibliothèque ou menu d'un dossier) puis le passe en renommage. */
  protected async createFolder(
    libraryId: SoundLibraryId,
    event: Pick<TreeCreateEvent, 'parentId'>,
    tree: Tree<SoundNode>,
  ): Promise<void> {
    try {
      const folder = await this.store.createFolder(
        libraryId,
        event.parentId,
        this.transloco.translate('tree.newFolder'),
      );
      tree.startRename(folder.id);
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  protected rename(libraryId: SoundLibraryId, event: TreeRenameEvent): void {
    this.store
      .rename(libraryId, event.id, event.name)
      .catch((error) => this.notifications.fromError(error));
  }

  protected remove(libraryId: SoundLibraryId, id: Id): void {
    this.store.remove(libraryId, id).catch((error) => this.notifications.fromError(error));
  }

  protected move(libraryId: SoundLibraryId, move: TreeMoveEvent): void {
    this.store.move(libraryId, move).catch((error) => this.notifications.fromError(error));
  }
}
