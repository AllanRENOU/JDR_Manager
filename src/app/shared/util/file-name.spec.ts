import { baseName } from './file-name';

describe('baseName', () => {
  it('retire l’extension du nom de fichier', () => {
    expect(baseName('Forêt de nuit.mp3')).toBe('Forêt de nuit');
    expect(baseName('archive.tar.png')).toBe('archive.tar');
    expect(baseName('.ogg')).toBe('.ogg');
    expect(baseName('sans-extension')).toBe('sans-extension');
  });
});
