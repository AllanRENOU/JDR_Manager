import { highlightMarkdown } from './markdown-highlight';

/** Texte affiché par le HTML (sans les balises ni les entités). */
function plain(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

describe('highlightMarkdown', () => {
  it('garde exactement les caractères du texte, retour final en plus', () => {
    const text = '## Titre\n\n**Gras** et _ital_ <b>&\n- un\n> cité\n`code` [lien](https://x.fr)\n';
    expect(plain(highlightMarkdown(text))).toBe(`${text}\n`);
  });

  it('montre les marqueurs et met en forme le texte qu’ils entourent', () => {
    expect(highlightMarkdown('Un **mot** _ici_')).toBe(
      'Un <span class="md-mark">**</span><span class="md-strong">mot</span><span class="md-mark">**</span> ' +
        '<span class="md-mark">_</span><span class="md-em">ici</span><span class="md-mark">_</span>\n',
    );
  });

  it('colore les préfixes de bloc : titre, citation, liste', () => {
    expect(highlightMarkdown('## La crypte')).toBe(
      '<span class="md-mark">## </span><span class="md-heading">La crypte</span>\n',
    );
    expect(highlightMarkdown('> Chut')).toContain('<span class="md-quote">Chut</span>');
    expect(highlightMarkdown('1. un')).toBe('<span class="md-mark">1. </span>un\n');
  });

  it('échappe le HTML saisi', () => {
    expect(highlightMarkdown('<script>')).toBe('&lt;script&gt;\n');
  });

  it('laisse tel quel un marqueur seul', () => {
    expect(highlightMarkdown('2 * 3 et **')).toBe('2 * 3 et **\n');
  });
});
