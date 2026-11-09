import { Marked } from 'marked';

/** Mises en forme proposées par la barre d'outils Markdown. */
export type MarkdownFormat =
  'bold' | 'italic' | 'heading' | 'bullet-list' | 'numbered-list' | 'quote';

/** Texte d'un champ et sélection (indices de `selectionStart` / `selectionEnd`). */
export interface TextSelection {
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Remplacement à appliquer au champ : remplacer `value.slice(from, to)` par `text`,
 * puis sélectionner `[start, end]` (indices dans le texte final).
 */
export interface TextEdit {
  readonly from: number;
  readonly to: number;
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

const INLINE_MARKERS: Partial<Record<MarkdownFormat, string>> = { bold: '**', italic: '_' };

/** Préfixe de ligne de chaque format de bloc (`numbered-list` : numéro calculé). */
const LINE_PREFIXES: Partial<Record<MarkdownFormat, RegExp>> = {
  heading: /^#{1,6} /,
  'bullet-list': /^[-*+] /,
  'numbered-list': /^\d+[.)] /,
  quote: /^> ?/,
};

/**
 * Calcule l'édition qui applique (ou retire, si elle est déjà là) une mise en forme
 * à la sélection. Fonction pure, utilisée par `MarkdownEditor`.
 */
export function applyMarkdownFormat(selection: TextSelection, format: MarkdownFormat): TextEdit {
  const marker = INLINE_MARKERS[format];
  return marker ? toggleInline(selection, marker) : toggleLines(selection, format);
}

/** Gras / italique : entoure la sélection, ou retire les marqueurs qui l'entourent déjà. */
function toggleInline({ value, start, end }: TextSelection, marker: string): TextEdit {
  const size = marker.length;
  const selected = value.slice(start, end);
  // Marqueurs juste autour de la sélection : « **mot** » avec « mot » sélectionné.
  if (value.slice(start - size, start) === marker && value.slice(end, end + size) === marker) {
    return {
      from: start - size,
      to: end + size,
      text: selected,
      start: start - size,
      end: end - size,
    };
  }
  // Marqueurs inclus dans la sélection : « **mot** » entièrement sélectionné.
  if (selected.length >= size * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(size, -size);
    return { from: start, to: end, text: inner, start, end: start + inner.length };
  }
  return {
    from: start,
    to: end,
    text: `${marker}${selected}${marker}`,
    start: start + size,
    end: end + size,
  };
}

/** Titre, listes, citation : préfixe chaque ligne touchée par la sélection (ou le retire). */
function toggleLines({ value, start, end }: TextSelection, format: MarkdownFormat): TextEdit {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const to = lineEnd === -1 ? value.length : lineEnd;
  const lines = value.slice(from, to).split('\n');
  const pattern = LINE_PREFIXES[format] as RegExp;
  const filled = lines.filter((line) => line.trim() !== '');
  const remove = filled.length > 0 && filled.every((line) => pattern.test(line));

  let number = 0;
  const text = lines
    .map((line) => {
      if (remove) {
        return line.replace(pattern, '');
      }
      if (line.trim() === '' && lines.length > 1) {
        return line;
      }
      // On remplace un éventuel autre préfixe de bloc (ex. liste à puces → liste numérotée).
      const bare = Object.values(LINE_PREFIXES).reduce((l, p) => l.replace(p, ''), line);
      return `${prefixFor(format, ++number)}${bare}`;
    })
    .join('\n');

  // Sélection seule (curseur) sur une ligne vide : le curseur se place après le préfixe.
  const caret = start === end && lines.length === 1;
  return {
    from,
    to,
    text,
    start: caret ? from + text.length : from,
    end: from + text.length,
  };
}

function prefixFor(format: MarkdownFormat, n: number): string {
  switch (format) {
    case 'heading':
      return '## ';
    case 'bullet-list':
      return '- ';
    case 'numbered-list':
      return `${n}. `;
    default:
      return '> ';
  }
}

/**
 * Interpréteur Markdown (GFM) : un retour à la ligne simple reste un retour à la ligne,
 * comme dans le champ de saisie. Les liens s'ouvrent dans un nouvel onglet pour ne pas
 * quitter la Présentation.
 */
const markdown = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  renderer: {
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeAttribute(title)}"` : '';
      return `<a href="${escapeAttribute(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
  },
});

/**
 * Convertit un texte Markdown en HTML. Le résultat **doit** passer par `[innerHTML]`
 * (assaini par Angular : scripts et attributs dangereux retirés), jamais par `bypassSecurityTrust…`.
 */
export function renderMarkdown(text: string | null | undefined): string {
  return text ? (markdown.parse(text) as string) : '';
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
