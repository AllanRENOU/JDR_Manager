import { Service } from '@angular/core';

/** Préfixe de toutes les clés. Doit rester identique au script de `index.html`. */
export const UI_PREFERENCES_PREFIX = 'jdr-manager:';

/**
 * Préférences d'affichage du MJ (thème, parties repliées…), stockées dans le navigateur.
 *
 * Elles ne font pas partie des données de projet et ne passent donc pas par `DataRepository`
 * (TRD TEC-62). Le stockage peut être indisponible (navigation privée, données bloquées) :
 * chaque accès est protégé et se rabat sur la valeur par défaut.
 */
@Service()
export class UiPreferences {
  /** Lit une préférence ; renvoie `fallback` si elle est absente, illisible ou si le stockage est indisponible. */
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(UI_PREFERENCES_PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** Enregistre une préférence. Renvoie `false` si le stockage est indisponible. */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(UI_PREFERENCES_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /** Supprime une préférence. */
  remove(key: string): void {
    try {
      localStorage.removeItem(UI_PREFERENCES_PREFIX + key);
    } catch {
      // stockage indisponible : rien à faire
    }
  }
}
