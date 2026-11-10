/**
 * Coloration du texte Markdown **source**, affichée sous un `<textarea>` dont le texte est
 * transparent (champ `appMarkdownEditor` dans un `app-field`, quand il a le focus).
 *
 * Le HTML renvoyé contient **exactement** les caractères du texte, sans en ajouter ni en retirer :
 * les marqueurs (`**`, `_`, `## `, `- `…) restent visibles (classe `md-mark`) et le texte qu'ils
 * entourent est mis en forme (`md-strong`, `md-em`, `md-heading`, `md-quote`, `md-code`,
 * `md-link`). Les styles (`_markdown.scss`, `.app-markdown-source`) ne doivent jamais changer la
 * largeur des caractères, sinon le curseur du champ ne serait plus aligné.
 *
 * À lier à `[innerHTML]` (assaini par Angular).
 */
export function highlightMarkdown(text: string): string {
  // Le « \n » final donne sa hauteur à une dernière ligne vide, comme dans le champ.
  return `${text.split('\n').map(highlightLine).join('\n')}\n`;
}

const BLOCKS: readonly { pattern: RegExp; className?: string }[] = [
  { pattern: /^(#{1,6} )(.*)$/, className: 'md-heading' },
  { pattern: /^(> ?)(.*)$/, className: 'md-quote' },
  { pattern: /^(\s*(?:[-*+]|\d+[.)]) )(.*)$/ },
];

function highlightLine(line: string): string {
  for (const { pattern, className } of BLOCKS) {
    const match = pattern.exec(line);
    if (match) {
      const rest = inline(match[2]);
      return mark(match[1]) + (className ? span(className, rest) : rest);
    }
  }
  return inline(line);
}

/** Gras (`**` / `__`), italique (`*` / `_`), code (`` ` ``), lien (`[texte](adresse)`). */
const INLINE =
  /(\*\*|__)(?=\S)(.+?)(?<=\S)\1|(\*|_)(?=[^\s*_])(.+?)(?<=[^\s*_])\3|(`+)(.+?)\5|(\[)([^\]]*)(\]\([^)\s]*\))/g;

function inline(text: string): string {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    html += escapeHtml(text.slice(last, match.index)) + inlineToken(match);
    last = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

function inlineToken(m: RegExpMatchArray): string {
  if (m[1]) {
    return mark(m[1]) + span('md-strong', inline(m[2])) + mark(m[1]);
  }
  if (m[3]) {
    return mark(m[3]) + span('md-em', inline(m[4])) + mark(m[3]);
  }
  if (m[5]) {
    return mark(m[5]) + span('md-code', escapeHtml(m[6])) + mark(m[5]);
  }
  return mark(m[7]) + span('md-link', inline(m[8])) + mark(m[9]);
}

function mark(text: string): string {
  return span('md-mark', escapeHtml(text));
}

function span(className: string, html: string): string {
  return `<span class="${className}">${html}</span>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
