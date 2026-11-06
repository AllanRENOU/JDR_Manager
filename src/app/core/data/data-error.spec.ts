import { DataError, isDataError, isQuotaExceededError } from './data-error';

describe('DataError', () => {
  it('porte un code et une clé de traduction', () => {
    const error = new DataError('quota-exceeded', 'plein');
    expect(error).toBeInstanceOf(Error);
    expect(error.messageKey).toBe('error.data.quota-exceeded');
    expect(isDataError(error)).toBe(true);
    expect(isDataError(error, 'quota-exceeded')).toBe(true);
    expect(isDataError(error, 'media-not-found')).toBe(false);
    expect(isDataError(new Error('x'))).toBe(false);
  });
});

describe('isQuotaExceededError', () => {
  it('reconnaît les erreurs de quota, y compris en cause d’une autre erreur', () => {
    const quota = new DOMException('plein', 'QuotaExceededError');
    expect(isQuotaExceededError(quota)).toBe(true);
    expect(isQuotaExceededError(new DOMException('plein', 'NS_ERROR_DOM_QUOTA_REACHED'))).toBe(
      true,
    );
    expect(isQuotaExceededError(new Error('annulée', { cause: quota }))).toBe(true);
    expect(isQuotaExceededError(new DOMException('autre', 'AbortError'))).toBe(false);
    expect(isQuotaExceededError('QuotaExceededError')).toBe(false);
    expect(isQuotaExceededError(undefined)).toBe(false);
  });
});
