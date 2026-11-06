import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideUpload } from '@lucide/angular';

import { FORMAT_LABELS, MediaKind } from '../../../core/media/media-types';

/**
 * Calque plein écran affiché pendant un glisser de fichiers (Brief §6.13) : nombre de fichiers,
 * destination et formats acceptés. À afficher quand `appFileDrop` est actif :
 *
 * ```html
 * @if (drop.active()) {
 *   <app-file-drop-overlay [fileCount]="drop.fileCount()" destination="Ambiances" kind="sound" />
 * }
 * ```
 * Le calque laisse passer les événements : le dépôt est géré par la directive.
 */
@Component({
  selector: 'app-file-drop-overlay',
  imports: [TranslocoPipe, LucideUpload],
  templateUrl: './file-drop-overlay.html',
  styleUrl: './file-drop-overlay.scss',
  host: { 'aria-live': 'polite' },
})
export class FileDropOverlay {
  /** Nombre de fichiers glissés (0 = inconnu, non affiché). */
  readonly fileCount = input(0);
  /** Destination déjà traduite (dossier ouvert, scène ouverte). */
  readonly destination = input('');
  /** Types de fichiers acceptés par l'écran hôte. */
  readonly kinds = input<readonly MediaKind[]>(['image', 'sound']);

  protected readonly formats = computed(() =>
    this.kinds()
      .flatMap((kind) => FORMAT_LABELS[kind])
      .join(', '),
  );
}
