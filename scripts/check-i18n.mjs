// Vérifie l'absence de texte d'interface en dur (TEC-71, avancement 13.4.2) :
//  1. modèles HTML : aucun texte visible ni attribut textuel (aria-label, title, placeholder, alt)
//     écrit en dur ; tout passe par le pipe `transloco` ;
//  2. code TypeScript : chaînes en français (accents ou plusieurs mots) hors commentaires, tests et
//     clés de traduction, listées pour relecture (les messages de journalisation sont admis).
//  3. chaque clé `'domaine.cle'` citée dans le code existe dans fr.json.
// Les pages de démonstration (features/dev) sont ignorées. Usage : npm run check:i18n
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const appDir = join(root, 'src/app');
const fr = JSON.parse(readFileSync(join(root, 'public/i18n/fr.json'), 'utf8'));

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
const sources = files(appDir).filter((f) => !f.includes('/features/dev/') && !f.endsWith('.spec.ts'));
const problems = [];
/** Textes admis : nom du produit. */
const ALLOWED = new Set(['JDR Manager']);

/** Efface `@if (…) {`, `@for (…) {`, `@else`, `@let x = … ;`… en tenant compte des parenthèses. */
function blankControlFlow(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const match = /^@(if|else if|else|for|switch|case|default|empty|defer|let)\b/.exec(text.slice(i));
    if (!match) {
      out += text[i++];
      continue;
    }
    let j = i + match[0].length;
    if (match[1] === 'let') {
      j = text.indexOf(';', j) + 1 || text.length;
    } else {
      while (/\s/.test(text[j] ?? '')) j++;
      if (text[j] === '(') {
        let depth = 0;
        do {
          if (text[j] === '(') depth++;
          if (text[j] === ')') depth--;
          j++;
        } while (depth > 0 && j < text.length);
      }
    }
    out += text.slice(i, j).replace(/[^\n]/g, ' ');
    i = j;
  }
  return out;
}
const report = (file, line, message) => problems.push(`${relative(root, file)}:${line} ${message}`);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// 1. Modèles
for (const file of sources.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  // Retire commentaires, interpolations, blocs de contrôle (et leurs paramètres) et balises :
  // il reste le texte visible.
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let blanked = html
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\{\{[\s\S]*?\}\}/g, blank)
    .replace(/<[^>]*>/g, blank);
  blanked = blankControlFlow(blanked);
  for (const match of blanked.matchAll(/[A-Za-zÀ-ÿ]{2,}[^<\n{}]*/g)) {
    const text = match[0].trim();
    if (text && !/^[}{\s]*$/.test(text) && !ALLOWED.has(text)) {
      report(file, lineOf(blanked, match.index), `texte en dur : « ${text.slice(0, 60)} »`);
    }
  }
  for (const match of html.matchAll(/\s(aria-label|title|placeholder|alt)="([^"]*[A-Za-zÀ-ÿ][^"]*)"/g)) {
    report(file, lineOf(html, match.index), `attribut ${match[1]} en dur : « ${match[2]} »`);
  }
}

// 2 et 3. Code
const keyExists = (key) => key.split('.').reduce((node, part) => node?.[part], fr) !== undefined;
for (const file of sources.filter((f) => f.endsWith('.ts'))) {
  const code = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, (m, p) => p + m.slice(p.length).replace(/./g, ' '));
  for (const match of code.matchAll(/(['`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
    const text = match[2];
    const line = lineOf(code, match.index);
    const before = code.slice(Math.max(0, match.index - 40), match.index);
    if (/^[a-z][\w-]*(\.[\w-]+)+$/.test(text) && /translate|labelKey|Key|key|label|message|: $/.test(before)) {
      // Clé de traduction : doit exister (les clés plurielles se terminent par .one / .other).
      if (!keyExists(text) && !keyExists(`${text}.one`)) {
        report(file, line, `clé de traduction absente de fr.json : ${text}`);
      }
      continue;
    }
    const french = /[À-ÿ]/.test(text) || /^[A-Z][a-zà-ÿ]+(\s[a-zà-ÿ'’]+){2,}/.test(text);
    if (french && !/console\.|new Error\(|new DataError\(|throw /.test(before)) {
      report(file, line, `texte en français dans le code : « ${text.slice(0, 60)} »`);
    }
  }
}

if (problems.length) {
  console.error(`✘ ${problems.length} texte(s) à traduire :\n  ${problems.join('\n  ')}`);
  process.exitCode = 1;
} else {
  console.log('✔ Aucun texte d’interface en dur ; toutes les clés citées existent dans fr.json.');
}
