import { Service, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { isDataError } from '../../../core/data/data-error';

export type NotificationTone = 'danger' | 'info';

export interface AppNotification {
  id: number;
  tone: NotificationTone;
  /** Texte déjà traduit. */
  message: string;
}

/** Durée d'affichage par défaut (ms) ; une erreur reste plus longtemps qu'une information. */
const DURATION: Record<NotificationTone, number> = { danger: 8000, info: 4000 };

/**
 * Notifications temporaires (Brief §6.14), affichées par `<app-notification-host>`.
 * Une erreur n'interrompt jamais la partie (NF-25) : on la signale ici et on continue.
 */
@Service()
export class Notifications {
  private readonly transloco = inject(TranslocoService);
  private readonly items = signal<readonly AppNotification[]>([]);
  private nextId = 0;

  /** Notifications visibles, de la plus ancienne à la plus récente. */
  readonly notifications = this.items.asReadonly();

  error(message: string, duration = DURATION.danger): number {
    return this.show('danger', message, duration);
  }

  info(message: string, duration = DURATION.info): number {
    return this.show('info', message, duration);
  }

  /**
   * Affiche une erreur à partir d'une exception : message traduit d'une `DataError`,
   * message générique sinon.
   */
  fromError(error: unknown): number {
    const key = isDataError(error) ? error.messageKey : 'error.generic';
    return this.error(this.transloco.translate(key));
  }

  dismiss(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  private show(tone: NotificationTone, message: string, duration: number): number {
    const id = ++this.nextId;
    this.items.update((items) => [...items, { id, tone, message }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    return id;
  }
}
