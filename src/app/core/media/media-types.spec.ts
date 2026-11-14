import { acceptAttribute, formatLabel, resolveMediaType } from './media-types';

describe('resolveMediaType', () => {
  it.each([
    ['carte.png', 'image/png', 'image/png'],
    ['carte.JPG', 'image/jpeg', 'image/jpeg'],
    ['carte.webp', 'image/webp', 'image/webp'],
    ['pluie.mp3', 'audio/mpeg', 'audio/mpeg'],
    ['pluie.ogg', 'audio/ogg', 'audio/ogg'],
    ['pluie.wav', 'audio/x-wav', 'audio/wav'],
    ['pluie.m4a', 'audio/x-m4a', 'audio/mp4'],
    ['intro.mp4', 'video/mp4', 'video/mp4'],
    ['intro.webm', 'video/webm', 'video/webm'],
  ])('accepte %s (%s) et normalise en %s', (name, type, expected) => {
    expect(resolveMediaType({ name, type })?.mimeType).toBe(expected);
  });

  it('se rabat sur l’extension quand le navigateur ne donne pas de type', () => {
    expect(resolveMediaType({ name: 'orage.M4A', type: '' })).toEqual({
      kind: 'sound',
      mimeType: 'audio/mp4',
    });
    expect(resolveMediaType({ name: 'carte.jpeg', type: 'application/octet-stream' })?.kind).toBe(
      'image',
    );
    expect(resolveMediaType({ name: 'intro.MP4', type: '' })).toEqual({
      kind: 'video',
      mimeType: 'video/mp4',
    });
  });

  it('accepte une extension de vidéo avec un type MIME vidéo non standard (VID-01)', () => {
    expect(resolveMediaType({ name: 'intro.webm', type: 'video/x-matroska' })?.mimeType).toBe(
      'video/webm',
    );
  });

  it.each([
    ['notes.txt', 'text/plain'],
    ['carte.gif', 'image/gif'],
    ['film.mov', 'video/quicktime'],
    ['voix.webm', 'audio/webm'],
    ['carte.png', 'audio/x-inconnu'],
    ['sans-extension', ''],
    ['faux.png', 'application/pdf'],
  ])('refuse %s (%s)', (name, type) => {
    expect(resolveMediaType({ name, type })).toBeNull();
  });
});

describe('acceptAttribute', () => {
  it('liste extensions et types MIME de la catégorie', () => {
    expect(acceptAttribute('image')).toBe('.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp');
    expect(acceptAttribute('sound')).toContain('.m4a');
    expect(acceptAttribute('sound')).not.toContain('image');
    expect(acceptAttribute('video')).toBe('.mp4,.webm,video/mp4,video/webm');
  });
});

describe('formatLabel', () => {
  it('donne le libellé court d’un type MIME enregistré', () => {
    expect(formatLabel('audio/mpeg')).toBe('MP3');
    expect(formatLabel('audio/mp4')).toBe('M4A');
    expect(formatLabel('image/webp')).toBe('WebP');
    expect(formatLabel('video/mp4')).toBe('MP4');
    expect(formatLabel('video/webm')).toBe('WebM');
    expect(formatLabel('audio/flac')).toBe('FLAC');
  });
});
