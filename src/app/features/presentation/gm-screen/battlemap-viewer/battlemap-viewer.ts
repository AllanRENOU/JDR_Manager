import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideTriangleAlert } from '@lucide/angular';

import { MediaUrls } from '../../../../core/media/media-urls';
import { Battlemap } from '../../../../core/models';
import { Modal } from '../../../../shared/ui/modal/modal';

/** Battlemap en grand (FIL-04), ouverte depuis une miniature du fil ou l'aperçu du panneau. */
@Component({
  selector: 'app-battlemap-viewer',
  imports: [Modal, TranslocoPipe, LucideTriangleAlert],
  templateUrl: './battlemap-viewer.html',
  styleUrl: './battlemap-viewer.scss',
})
export class BattlemapViewer {
  protected readonly battlemap = inject<Battlemap>(DIALOG_DATA);
  protected readonly image = inject(MediaUrls).track(() => this.battlemap.mediaId);
}
