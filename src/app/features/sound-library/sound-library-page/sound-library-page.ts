import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowLeft,
  LucideFolderPlus,
  LucideMusic,
  LucidePencil,
  LucidePencilRuler,
  LucidePlay,
  LucideSearch,
  LucideTrash2,
  LucideUpload,
} from '@lucide/angular';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { pluralKey } from '../../../core/i18n/plural';
import {
  FORMAT_LABELS,
  MediaKind,
  acceptAttribute,
  formatLabel,
} from '../../../core/media/media-types';
import { GLOBAL_SOUND_LIBRARY, Id, SoundLibraryId, SoundNode } from '../../../core/models';
import { FileDrop } from '../../../shared/file-drop/file-drop';
import { FileDropOverlay } from '../../../shared/file-drop/file-drop-overlay/file-drop-overlay';
import { ProjectNav } from '../../../shared/project-nav/project-nav';
import { Tree, TreeCreateEvent, TreeRenameEvent } from '../../../shared/tree/tree';
import { TreeLabels } from '../../../shared/tree/tree-labels';
import { TreeMoveEvent, pathTo } from '../../../shared/tree/tree-model';
import { Alert } from '../../../shared/ui/alert/alert';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { formatDuration } from '../../../shared/util/duration';
import { AudioPlayer } from '../../presentation/audio/audio-player';
import { ListenButton } from '../listen-button/listen-button';
import { SoundLibraryStore, SoundRow } from '../sound-library-store';
import { SoundPreview } from '../sound-preview';

/** Libellés des arborescences de sons (TEC-61) : dossiers et sons. */
const SOUND_TREE_LABELS: Partial<TreeLabels> = {
  deleteFolderMessage: 'sound.deleteFolderMessage',
  deleteItemMessage: 'sound.deleteMessage',
};
import { Input } from '../../../shared/ui/input/input';
import { SoundName } from '../sound-name/sound-name';

/**
 * Bibliothèques de sons (SON-01, Brief §7.2).
 * - `/projects/:projectId/sounds` : sons du projet et bibliothèque globale (onglet « Sons » de l'Édition) ;
 * - `/sounds` : bibliothèque globale seule, ouverte depuis l'accueil.
 */
import { SettingsButton } from '../../settings/settings-button/settings-button';
@Component({
  selector: 'app-sound-library-page',
  imports: [
    SoundName,
    Input,
    SettingsButton,
    AppHeader,
    Alert,
    Button,
    FileDrop,
    ListenButton,
    FileDropOverlay,
    ProjectNav,
    Tree,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucideFolderPlus,
    LucideMusic,
    LucidePencil,
    LucidePencilRuler,
    LucidePlay,
    LucideSearch,
    LucideTrash2,
    LucideUpload,
  ],
  providers: [SoundLibraryStore, SoundPreview],
  templateUrl: './sound-library-page.html',
  styleUrl: './sound-library-page.scss',
})
export class SoundLibraryPage {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly modals = inject(Modals);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly audio = inject(AudioPlayer);
  protected readonly store = inject(SoundLibraryStore);
  protected readonly preview = inject(SoundPreview);
  protected readonly progressPercent = computed(() => Math.round(this.preview.progress() * 100));
  protected readonly treeLabels = SOUND_TREE_LABELS;
  protected readonly globalLibrary = GLOBAL_SOUND_LIBRARY;
  protected readonly pluralKey = pluralKey;
  protected readonly formatDuration = formatDuration;
  protected readonly formatLabel = formatLabel;
  protected readonly accept = acceptAttribute('sound');
  protected readonly soundKinds: readonly MediaKind[] = ['sound'];

  /** Destination d'un dépôt de fichiers : le dossier ouvert, avec son chemin (SON-06). */
  protected readonly destination = computed(() => {
    const { libraryId, folderId } = this.store.opened();
    const folders = folderId ? pathTo(this.store.nodesOf(libraryId), folderId) : [];
    return [
      this.libraryName(libraryId === GLOBAL_SOUND_LIBRARY),
      ...folders.map((n) => n.name),
    ].join(' › ');
  });

  /** Chemin au-dessus du dossier ouvert : « Ce projet › Effets › ». */
  protected readonly folderPath = computed(() => {
    const { libraryId, folderId } = this.store.opened();
    const ancestors = folderId ? pathTo(this.store.nodesOf(libraryId), folderId).slice(0, -1) : [];
    const library = this.libraryName(libraryId === GLOBAL_SOUND_LIBRARY);
    return [library, ...ancestors.map((n) => n.name)].map((part) => `${part} ›`).join(' ');
  });

  /** Paramètre de route `:projectId` ; absent sur `/sounds`. */
  readonly projectId = input<Id>();

  /** Projet ouvert (`undefined` : projet introuvable ; inactif sur `/sounds`). */
  protected readonly project = resource({
    params: () => this.projectId(),
    loader: ({ params }) => this.repository.getProject(params),
  });

  /** Son en cours de renommage dans le tableau (6.8). */
  protected readonly editingId = signal<Id | null>(null);

  constructor() {
    // Son choisi dans l'arborescence : sa ligne du tableau est amenée à l'écran.
    afterRenderEffect(() => {
      const id = this.store.selectedSoundId();
      if (id) {
        this.host.nativeElement
          .querySelector(`[data-sound-id="${CSS.escape(id)}"]`)
          ?.scrollIntoView?.({ block: 'nearest' });
      }
    });
    effect(() => {
      this.store.load(this.projectId()).catch((error) => this.notifications.fromError(error));
    });
  }

  /** « Présenter » lance une démo sans fenêtre de lancement : l'audio est débloqué dans le clic (TEC-43). */
  protected unlockAudio(): void {
    void this.audio.unlock();
  }

  /** Fichiers choisis avec « Importer des sons » (SON-02). */
  protected onFilesChosen(input: HTMLInputElement): void {
    const files = [...(input.files ?? [])];
    // Permet de choisir à nouveau les mêmes fichiers.
    input.value = '';
    void this.importFiles(files);
  }

  /** Importe dans le dossier ouvert et rend compte du résultat. */
  protected async importFiles(files: readonly File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }
    const folder =
      this.store.openedFolder()?.name ??
      this.libraryName(this.store.opened().libraryId === GLOBAL_SOUND_LIBRARY);
    try {
      const { imported, rejected, failure } = await this.store.importFiles(files);
      if (rejected.length > 0) {
        this.notifications.error(
          this.transloco.translate('fileDrop.rejected', {
            count: rejected.length,
            names: rejected.map((file) => file.name).join(', '),
            formats: FORMAT_LABELS.sound.join(', '),
          }),
        );
      }
      if (imported.length > 0) {
        this.notifications.info(
          this.transloco.translate(pluralKey('sound.imported', imported.length), {
            count: imported.length,
            folder,
          }),
        );
      }
      if (failure !== undefined) {
        this.notifications.fromError(failure);
      }
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  /** Messages de suppression de l'arborescence, par bibliothèque (fonctions stables pour `app-tree`). */
  private readonly treeDeleteMessages = new Map<
    SoundLibraryId,
    (node: SoundNode) => string | null
  >();

  /**
   * Avertissement à la suppression d'un son utilisé par des actions, ou d'un dossier qui en
   * contient (NF-31, décision d'Allan) ; sinon, message générique de l'arborescence.
   */
  protected treeDeleteMessage(libraryId: SoundLibraryId): (node: SoundNode) => string | null {
    let message = this.treeDeleteMessages.get(libraryId);
    if (!message) {
      message = (node) => {
        if (node.kind === 'item') {
          const count = this.store.soundUsages(node.id);
          return count === 0
            ? null
            : this.transloco.translate(pluralKey('sound.deleteUsedMessage', count), { count });
        }
        const { sounds, used } = this.store.folderUsage(libraryId, node.id);
        return used === 0
          ? null
          : this.transloco.translate(pluralKey('sound.deleteFolderUsedMessage', used), {
              count: used,
              sounds,
            });
      };
      this.treeDeleteMessages.set(libraryId, message);
    }
    return message;
  }

  /** Pré-écoute (SON-05) : lance ou arrête le son de la ligne. */
  protected togglePreview(row: SoundRow): void {
    this.preview
      .toggle(row.node)
      .catch(() =>
        this.notifications.error(
          this.transloco.translate('sound.playError', { name: row.node.name }),
        ),
      );
  }

  protected startRename(id: Id): void {
    this.editingId.set(id);
  }

  /** Entrée ou sortie du champ : enregistre un nom non vide et différent. */
  protected commitRename(row: SoundRow, value: string): void {
    if (this.editingId() !== row.node.id) {
      return;
    }
    this.editingId.set(null);
    const name = value.trim();
    if (name && name !== row.node.name) {
      this.store
        .rename(row.libraryId, row.node.id, name)
        .catch((error) => this.notifications.fromError(error));
    }
  }

  protected cancelRename(): void {
    this.editingId.set(null);
  }

  /**
   * Supprime un son après confirmation (NF-31) ; avertit s'il est utilisé par des actions, qui le
   * signaleront comme introuvable (PRS-07).
   */
  protected async deleteSound(row: SoundRow): Promise<boolean> {
    const name = row.node.name;
    const t = (key: string, params: Record<string, unknown> = {}) =>
      this.transloco.translate(key, { name, ...params });
    const confirmed = await this.modals.confirm({
      title: t('sound.deleteTitle'),
      message:
        row.usages > 0
          ? t(pluralKey('sound.deleteUsedMessage', row.usages), { count: row.usages })
          : t('sound.deleteMessage'),
      confirmLabel: t('common.actions.delete'),
      destructive: true,
      holdToConfirm: true,
    });
    if (!confirmed) {
      return false;
    }
    try {
      if (this.preview.playingId() === row.node.id) {
        this.preview.stop();
      }
      await this.store.remove(row.libraryId, row.node.id);
      this.notifications.info(t('sound.deleted'));
      return true;
    } catch (error) {
      this.notifications.fromError(error);
      return false;
    }
  }

  /** Emplacement d'un résultat de recherche : « Ce projet › Ambiances ». */
  protected rowPath(row: SoundRow): string {
    return [this.libraryName(row.libraryId === GLOBAL_SOUND_LIBRARY), ...row.folders].join(' › ');
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

  /** Suppression confirmée dans l'arborescence (dossier ou son) ; arrête la pré-écoute d'un son supprimé. */
  protected async remove(libraryId: SoundLibraryId, id: Id): Promise<void> {
    const node = this.store.nodesOf(libraryId).find((n) => n.id === id);
    try {
      const removed = await this.store.remove(libraryId, id);
      const playing = this.preview.playingId();
      if (playing && removed.has(playing)) {
        this.preview.stop();
      }
      if (node?.kind === 'item') {
        this.notifications.info(this.transloco.translate('sound.deleted', { name: node.name }));
      }
    } catch (error) {
      this.notifications.fromError(error);
    }
  }

  protected move(libraryId: SoundLibraryId, move: TreeMoveEvent): void {
    this.store.move(libraryId, move).catch((error) => this.notifications.fromError(error));
  }
}
