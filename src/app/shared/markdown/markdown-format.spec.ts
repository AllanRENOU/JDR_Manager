import { applyMarkdownFormat, renderMarkdown, TextEdit, TextSelection } from './markdown-format';

/** Applique l'édition et renvoie le texte final avec la sélection marquée par [ ]. */
function result(selection: TextSelection, edit: TextEdit): string {
  const value = selection.value.slice(0, edit.from) + edit.text + selection.value.slice(edit.to);
  return `${value.slice(0, edit.start)}[${value.slice(edit.start, edit.end)}]${value.slice(edit.end)}`;
}

function sel(marked: string): TextSelection {
  const start = marked.indexOf('[');
  const end = marked.indexOf(']') - 1;
  return { value: marked.replace('[', '').replace(']', ''), start, end };
}

function format(marked: string, f: Parameters<typeof applyMarkdownFormat>[1]): string {
  const s = sel(marked);
  return result(s, applyMarkdownFormat(s, f));
}

describe('applyMarkdownFormat', () => {
  it('met la sélection en gras, puis retire le gras', () => {
    expect(format('Un [mot] ici', 'bold')).toBe('Un **[mot]** ici');
    expect(format('Un **[mot]** ici', 'bold')).toBe('Un [mot] ici');
    expect(format('Un [**mot**] ici', 'bold')).toBe('Un [mot] ici');
  });

  it('insère des marqueurs vides au curseur, curseur au milieu', () => {
    expect(format('Un []', 'italic')).toBe('Un _[]_');
  });

  it('préfixe chaque ligne sélectionnée et numérote les listes', () => {
    expect(format('[a\nb]\nc', 'bullet-list')).toBe('[- a\n- b]\nc');
    expect(format('x\n[a\n\nb]', 'numbered-list')).toBe('x\n[1. a\n\n2. b]');
  });

  it('retire le préfixe quand toutes les lignes l’ont déjà', () => {
    expect(format('[> a\n> b]', 'quote')).toBe('[a\nb]');
    expect(format('## Ti[]tre', 'heading')).toBe('Titre[]');
  });

  it('remplace un autre préfixe de bloc', () => {
    expect(format('[- a\n- b]', 'numbered-list')).toBe('[1. a\n2. b]');
  });

  it('applique le titre à la ligne du curseur, curseur en fin de ligne', () => {
    expect(format('Intro\nLa cr[]ypte\nFin', 'heading')).toBe('Intro\n## La crypte[]\nFin');
  });
});

describe('renderMarkdown', () => {
  it('interprète la mise en page et garde les retours à la ligne simples', () => {
    const html = renderMarkdown('## Titre\n\n**Gras** et _italique_\nligne 2\n\n- un\n- deux');
    expect(html).toContain('<h2>Titre</h2>');
    expect(html).toContain('<strong>Gras</strong> et <em>italique</em><br>ligne 2');
    expect(html).toContain('<li>un</li>');
  });

  it('ouvre les liens dans un nouvel onglet', () => {
    expect(renderMarkdown('[carte](https://exemple.fr)')).toContain(
      '<a href="https://exemple.fr" target="_blank" rel="noopener noreferrer">carte</a>',
    );
  });

  it('renvoie une chaîne vide sans texte', () => {
    expect(renderMarkdown(null)).toBe('');
    expect(renderMarkdown('')).toBe('');
  });
});
