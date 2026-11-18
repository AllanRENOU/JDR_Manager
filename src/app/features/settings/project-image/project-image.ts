import { Component, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideTrash2, LucideUpload } from '@lucide/angular';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { acceptAttribute, FORMAT_LABELS, resolveMediaType } from '../../../core/media/media-types';
import { MediaUrls } from '../../../core/media/media-urls';
import { Id } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';

/**
 * Paramètres › Projet : image d'illustration du projet, affichée sur sa carte de l'accueil (5.3).
 * Présente seulement quand les paramètres sont ouverts depuis un écran d'édition du projet.
 * Enregistre directement dans le dépôt (`uploadMedia` puis `setProjectImage`).
 */
@Component({
  selector: 'app-project-image',
  imports: [Button, Placeholder, TranslocoPipe, LucideTrash2, LucideUpload],
  templateUrl: './project-image.html',
  styleUrl: './project-image.scss',
})
export class ProjectImage {
  readonly projectId = input.required<Id>();

  private readonly repository = inject(DATA_REPOSITORY);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  private readonly project = resource({
    params: () => this.projectId(),
    loader: ({ params }) => this.repository.getProject(params),
  });

  /** Image affichée : celle du projet relu, puis celle qu'on vient d'enregistrer. */
  protected readonly imageId = linkedSignal(() => this.project.value()?.imageMediaId ?? null);
  protected readonly image = inject(MediaUrls).track(() => this.imageId());
  /** Enregistrement en cours : boutons désactivés. */
  protected readonly busy = signal(false);

  protected readonly accept = acceptAttribute('image');
  protected readonly formats = FORMAT_LABELS.image.join(', ');

  protected async onFileChosen(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (resolveMediaType(file)?.kind !== 'image') {
      this.notifications.error(
        this.transloco.translate('fileDrop.rejected', {
          count: 1,
          names: file.name,
          formats: this.formats,
        }),
      );
      return;
    }
    await this.save(async () => {
      const mediaId = await this.repository.uploadMedia(file);
      try {
        await this.repository.setProjectImage(this.projectId(), mediaId);
      } catch (error) {
        await this.repository.deleteMedia(mediaId).catch(() => undefined);
        throw error;
      }
      return mediaId;
    });
  }

  protected async remove(): Promise<void> {
    await this.save(async () => {
      await this.repository.setProjectImage(this.projectId(), null);
      return null;
    });
  }

  private async save(write: () => Promise<Id | null>): Promise<void> {
    this.busy.set(true);
    try {
      this.imageId.set(await write());
    } catch (error) {
      this.notifications.fromError(error);
    } finally {
      this.busy.set(false);
    }
  }
}
