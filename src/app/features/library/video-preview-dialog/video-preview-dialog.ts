import { DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideTriangleAlert } from '@lucide/angular';

import { MediaUrls } from '../../../core/media/media-urls';
import { Id } from '../../../core/models';
import { Modal } from '../../../shared/ui/modal/modal';

/** Vidéo à prévisualiser : son nom et son fichier. */
export interface VideoPreviewData {
  name: string;
  mediaId: Id;
}

/**
 * Aperçu d'une vidéo de la bibliothèque (VID-04, Brief §7.2) : fenêtre `lg` avec le lecteur du
 * navigateur (lecture, pause, volume, position). Ouverte par un clic, la lecture démarre seule ;
 * l'URL du fichier est libérée à la fermeture (`MediaUrls.track`).
 */
@Component({
  selector: 'app-video-preview-dialog',
  imports: [Modal, TranslocoPipe, LucideTriangleAlert],
  templateUrl: './video-preview-dialog.html',
  styleUrl: './video-preview-dialog.scss',
})
export class VideoPreviewDialog {
  protected readonly video = inject<VideoPreviewData>(DIALOG_DATA);
  protected readonly file = inject(MediaUrls).track(() => this.video.mediaId);
}
