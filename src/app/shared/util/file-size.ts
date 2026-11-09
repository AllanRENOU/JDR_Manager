const UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'];

/** Taille lisible en français : « 980 o », « 3,4 Mo », « 1,2 Go » (base 1024). */
export function formatFileSize(bytes: number): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value);
  return `${number} ${UNITS[unit]}`;
}
