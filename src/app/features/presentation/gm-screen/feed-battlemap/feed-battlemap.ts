import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideTriangleAlert } from '@lucide/angular';

import { MediaUrls } from '../../../../core/media/media-urls';
import { Battlemap, Id } from '../../../../core/models';
import { Modals } from '../../../../shared/ui/modal/modals';
import { Placeholder } from '../../../../shared/ui/placeholder/placeholder';
import { BattlemapViewer } from '../battlemap-viewer/battlemap-viewer';

/**
 * Miniature de battlemap (fil d'actualité, FIL-03, et aperçu du panneau) : un clic l'ouvre en
 * grand (FIL-04). Battlemap ou image supprimée : message d'erreur (PRS-07).
 */
@Component({
  selector: 'app-feed-battlemap',
  imports: [Placeholder, TranslocoPipe, LucideTriangleAlert],
  templateUrl: './feed-battlemap.html',
  styleUrl: './feed-battlemap.scss',
})
export class FeedBattlemap {
  private readonly modals = inject(Modals);

  readonly battlemapId = input.required<Id>();
  /** Battlemaps de la scène ; celle qui manque a été supprimée. */
  readonly battlemaps = input.required<readonly Battlemap[]>();

  protected readonly battlemap = computed(
    () => this.battlemaps().find((b) => b.id === this.battlemapId()) ?? null,
  );
  protected readonly image = inject(MediaUrls).track(() => this.battlemap()?.mediaId);

  protected open(battlemap: Battlemap): void {
    this.modals.open(BattlemapViewer, { size: 'xl', data: battlemap });
  }
}
