import { Injector, Service, Signal, effect, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../data/data-repository';
import { Id } from '../models';

interface Entry {
  url: Promise<string>;
  count: number;
}

/** URL d'un média suivie par un composant. */
export interface MediaUrlRef {
  /** URL à mettre dans `src`, `null` tant qu'elle n'est pas prête ou si le média est introuvable. */
  readonly url: Signal<string | null>;
  /** `true` si le média n'a pas pu être chargé (supprimé, PRS-07). */
  readonly missing: Signal<boolean>;
}

/**
 * Partage les URL de médias entre composants et les libère quand plus personne ne les utilise
 * (TEC-32, TEC-33, TRD §5).
 *
 * Chaque `acquire` doit être suivi d'un `release`. Dans un composant, préférer `track()`, qui
 * s'en charge automatiquement.
 */
@Service()
export class MediaUrls {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly entries = new Map<Id, Entry>();

  /** Renvoie l'URL du média, créée au premier appel puis partagée. */
  acquire(mediaId: Id): Promise<string> {
    let entry = this.entries.get(mediaId);
    if (!entry) {
      const url = this.repository.getMediaUrl(mediaId);
      entry = { url, count: 0 };
      this.entries.set(mediaId, entry);
      // Échec : on oublie l'entrée pour qu'un prochain appel réessaie.
      url.catch(() => {
        if (this.entries.get(mediaId)?.url === url) {
          this.entries.delete(mediaId);
        }
      });
    }
    entry.count++;
    return entry.url;
  }

  /** Signale qu'un utilisateur de l'URL n'en a plus besoin ; la dernière libération révoque l'URL. */
  release(mediaId: Id): void {
    const entry = this.entries.get(mediaId);
    if (!entry) {
      return;
    }
    entry.count--;
    if (entry.count <= 0) {
      this.entries.delete(mediaId);
      entry.url.then(revoke, () => undefined);
    }
  }

  /** Nombre d'utilisateurs actuels d'un média (diagnostic, tests). */
  usageCount(mediaId: Id): number {
    return this.entries.get(mediaId)?.count ?? 0;
  }

  /**
   * Suit le média désigné par `mediaId` (signal ou fonction réactive) : l'URL est obtenue quand
   * l'id change, et libérée quand il change à nouveau ou quand le composant est détruit.
   * À appeler dans un contexte d'injection (constructeur ou champ de composant), ou avec `injector`.
   */
  track(mediaId: () => Id | null | undefined, injector?: Injector): MediaUrlRef {
    const url = signal<string | null>(null);
    const missing = signal(false);

    effect(
      (onCleanup) => {
        const id = mediaId();
        url.set(null);
        missing.set(false);
        if (!id) {
          return;
        }
        let active = true;
        this.acquire(id).then(
          (value) => active && url.set(value),
          () => active && missing.set(true),
        );
        onCleanup(() => {
          active = false;
          this.release(id);
        });
      },
      { injector },
    );

    return { url: url.asReadonly(), missing: missing.asReadonly() };
  }
}

/** Seules les URL `blob:` sont à libérer ; une URL distante (API) n'a rien à révoquer. */
function revoke(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
