/** Identifiant d'entité : UUID généré par `crypto.randomUUID()` (TRD §3). */
export type Id = string;

/** Crée un nouvel identifiant. */
export function newId(): Id {
  return crypto.randomUUID();
}
