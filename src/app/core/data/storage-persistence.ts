import { DOCUMENT, Service, inject, signal } from '@angular/core';

/** État du stockage persistant : `null` = inconnu ou non pris en charge par le navigateur. */
export type PersistenceState = boolean | null;

/**
 * Demande au navigateur de ne pas effacer les données de l'application quand l'espace disque
 * manque (TEC-26, NF-12). Sans cette demande, IndexedDB est en mode « au mieux » et peut être
 * vidé par le navigateur.
 */
@Service()
export class StoragePersistence {
  private readonly storage = inject(DOCUMENT).defaultView?.navigator.storage;
  private readonly state = signal<PersistenceState>(null);

  /** `true` si le stockage est persistant (affichable dans les paramètres). */
  readonly persisted = this.state.asReadonly();

  /**
   * Demande le stockage persistant s'il ne l'est pas déjà. Ne lève jamais d'erreur : en cas
   * de refus ou d'API absente, l'application continue normalement.
   */
  async request(): Promise<PersistenceState> {
    if (!this.storage?.persist || !this.storage.persisted) {
      return null;
    }
    try {
      const persisted = (await this.storage.persisted()) || (await this.storage.persist());
      this.state.set(persisted);
      return persisted;
    } catch {
      return null;
    }
  }
}
