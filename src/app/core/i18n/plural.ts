/**
 * Clé de traduction au singulier ou au pluriel, selon la règle française (0 et 1 au singulier).
 * Les traductions ont deux variantes : `<base>.one` et `<base>.other`.
 */
export function pluralKey(base: string, count: number): string {
  return `${base}.${Math.abs(count) < 2 ? 'one' : 'other'}`;
}
