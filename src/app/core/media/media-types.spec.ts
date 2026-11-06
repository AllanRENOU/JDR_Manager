import { acceptAttribute, resolveMediaType } from './media-types';

describe('resolveMediaType', () => {
  it.each([
    ['carte.png', 'image/png', 'image/png'],
    ['carte.JPG', 'image/jpeg', 'image/jpeg'],
    ['carte.webp', 'image/webp', 'image/webp'],
    ['pluie.mp3', 'audio/mpeg', 'audio/mpeg'],
    ['pluie.ogg', 'audio/ogg', 'audio/ogg'],
    ['pluie.wav', 'audio/x-wav', 'audio/wav'],
    ['pluie.m4a', 'audio/x-m4a', 'audio/mp4'],
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
  });

  it.each([
    ['notes.txt', 'text/plain'],
    ['carte.gif', 'image/gif'],
    ['film.mp4', 'video/mp4'],
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
  });
});
