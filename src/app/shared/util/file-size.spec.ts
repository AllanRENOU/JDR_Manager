import { formatFileSize } from './file-size';

describe('formatFileSize', () => {
  it('affiche la taille dans l’unité adaptée, à la française', () => {
    expect(formatFileSize(0)).toBe('0 o');
    expect(formatFileSize(980)).toBe('980 o');
    expect(formatFileSize(3.4 * 1024 * 1024)).toBe('3,4 Mo');
    expect(formatFileSize(250 * 1024 * 1024)).toBe('250 Mo');
    expect(formatFileSize(1.25 * 1024 ** 3)).toBe('1,3 Go');
  });
});
