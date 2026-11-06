import { Directive, inject, input, output, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { FORMAT_LABELS, MediaKind, resolveMediaType } from '../../core/media/media-types';
import { Notifications } from '../ui/notification-host/notifications';

/**
 * Import par glisser-déposer depuis le disque (TEC-35), posé sur l'écran hôte
 * (bibliothèque de sons, éditeur de scène) :
 *
 * ```html
 * <main appFileDrop #drop="appFileDrop" (filesDropped)="import($event)"> … </main>
 * @if (drop.active()) { … calque … }
 * ```
 * - écoute les événements de glisser au niveau de la fenêtre : on peut déposer n'importe où ;
 * - ne réagit qu'aux fichiers (`dataTransfer.types` contient `Files`), pas aux glisser-déposer
 *   internes (CDK, texte sélectionné) ;
 * - ne transmet que les formats acceptés (TEC-34) ; les fichiers refusés sont signalés par une
 *   notification (désactivable) et par la sortie `filesRejected`.
 * - un compteur d'entrées / sorties évite le clignotement quand le pointeur passe d'un élément
 *   enfant à un autre.
 */
@Directive({
  selector: '[appFileDrop]',
  exportAs: 'appFileDrop',
  host: {
    '(window:dragenter)': 'onDragEnter($event)',
    '(window:dragover)': 'onDragOver($event)',
    '(window:dragleave)': 'onDragLeave($event)',
    '(window:drop)': 'onDrop($event)',
  },
})
export class FileDrop {
  /** Désactive le dépôt (ex. fenêtre modale ouverte). */
  readonly disabled = input(false, { alias: 'appFileDropDisabled' });

  /** Types de fichiers acceptés (à passer aussi au calque, pour afficher les formats). */
  readonly kinds = input<readonly MediaKind[]>(['image', 'sound'], { alias: 'appFileDropKinds' });
  /** Affiche une notification d'erreur pour les fichiers refusés. */
  readonly notify = input(true, { alias: 'appFileDropNotify' });

  /** Fichiers déposés dont le format est accepté. */
  readonly filesDropped = output<File[]>();
  /** Fichiers déposés dont le format est refusé. */
  readonly filesRejected = output<File[]>();

  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  /** Un glisser de fichiers est en cours au-dessus de la fenêtre (affiche le calque). */
  readonly active = signal(false);
  /** Nombre de fichiers glissés, s'il est connu pendant le glisser (0 sinon). */
  readonly fileCount = signal(0);

  private depth = 0;

  protected onDragEnter(event: DragEvent): void {
    if (!this.accepts(event)) {
      return;
    }
    event.preventDefault();
    this.depth++;
    this.active.set(true);
    this.fileCount.set(countFiles(event.dataTransfer));
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.accepts(event)) {
      return;
    }
    // Indispensable pour que le navigateur autorise le dépôt (sinon il ouvre le fichier).
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected onDragLeave(event: DragEvent): void {
    if (!this.accepts(event)) {
      return;
    }
    this.depth = Math.max(0, this.depth - 1);
    if (this.depth === 0) {
      this.reset();
    }
  }

  protected onDrop(event: DragEvent): void {
    if (!this.accepts(event)) {
      return;
    }
    event.preventDefault();
    const files = [...(event.dataTransfer?.files ?? [])];
    this.reset();
    const kinds = this.kinds();
    const accepted = files.filter((file) => {
      const type = resolveMediaType(file);
      return type !== null && kinds.includes(type.kind);
    });
    const rejected = files.filter((file) => !accepted.includes(file));
    if (accepted.length > 0) {
      this.filesDropped.emit(accepted);
    }
    if (rejected.length > 0) {
      this.filesRejected.emit(rejected);
      if (this.notify()) {
        this.notifications.error(
          this.transloco.translate('fileDrop.rejected', {
            count: rejected.length,
            names: rejected.map((file) => file.name).join(', '),
            formats: kinds.flatMap((kind) => FORMAT_LABELS[kind]).join(', '),
          }),
        );
      }
    }
  }

  private accepts(event: DragEvent): boolean {
    return !this.disabled() && hasFiles(event.dataTransfer);
  }

  private reset(): void {
    this.depth = 0;
    this.active.set(false);
    this.fileCount.set(0);
  }
}

/** Vrai si le glisser transporte des fichiers venant du disque. */
export function hasFiles(transfer: DataTransfer | null): boolean {
  return !!transfer && [...transfer.types].includes('Files');
}

/** Nombre de fichiers glissés (les navigateurs l'exposent via `items` pendant le glisser). */
function countFiles(transfer: DataTransfer | null): number {
  return transfer ? [...transfer.items].filter((item) => item.kind === 'file').length : 0;
}
