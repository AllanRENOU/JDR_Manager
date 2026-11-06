/** Cause d'une erreur de la couche de données. */
export type DataErrorCode = 'unsupported-media-type' | 'quota-exceeded' | 'media-not-found';

/**
 * Erreur métier de la couche de données. `messageKey` est la clé de traduction à afficher
 * (domaine `error` de `fr.json`).
 */
export class DataError extends Error {
  readonly messageKey: string;

  constructor(
    readonly code: DataErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'DataError';
    this.messageKey = `error.data.${code}`;
  }
}

export function isDataError(error: unknown, code?: DataErrorCode): error is DataError {
  return error instanceof DataError && (code === undefined || error.code === code);
}

/** Vrai si l'erreur signale un espace de stockage insuffisant (quota du navigateur). */
export function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error) && !(error instanceof DOMException)) {
    return false;
  }
  // Firefox ancien : NS_ERROR_DOM_QUOTA_REACHED ; une transaction annulée garde la cause dans `cause`.
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    isQuotaExceededError((error as { cause?: unknown }).cause)
  );
}
