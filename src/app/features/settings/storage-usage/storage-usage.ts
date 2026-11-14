import { Component, inject, resource } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideShieldCheck, LucideShieldAlert } from '@lucide/angular';

import {
  DATA_REPOSITORY,
  StorageUsage as StorageUsageData,
} from '../../../core/data/data-repository';
import { pluralKey } from '../../../core/i18n/plural';
import { StoragePersistence } from '../../../core/data/storage-persistence';
import { formatFileSize } from '../../../shared/util/file-size';

/** Lignes du tableau, dans l'ordre (clé de traduction `settings.storage.<catégorie>`). */
const CATEGORIES: readonly (keyof StorageUsageData)[] = ['images', 'sounds', 'videos'];

/**
 * Paramètres › Stockage (NF-14, optionnel) : place occupée par les images, les sons et les vidéos,
 * estimation du navigateur, protection contre l'effacement automatique (NF-12).
 */
@Component({
  selector: 'app-storage-usage',
  imports: [TranslocoPipe, LucideShieldCheck, LucideShieldAlert],
  templateUrl: './storage-usage.html',
  styleUrl: './storage-usage.scss',
})
export class StorageUsage {
  private readonly repository = inject(DATA_REPOSITORY);
  protected readonly persistence = inject(StoragePersistence);

  protected readonly usage = resource({ loader: () => this.repository.getStorageUsage() });
  protected readonly estimate = resource({ loader: () => this.persistence.estimate() });

  protected readonly categories = CATEGORIES;
  protected readonly size = formatFileSize;
  protected readonly plural = pluralKey;
}
