// Vérifie le moteur de thèmes (TEC-12, avancement 1.2.2) :
//  1. chaque thème déclaré compile ;
//  2. une map à laquelle il manque un jeton fait échouer la compilation ;
//  3. une map contenant un jeton inconnu fait échouer la compilation ;
//  4. chaque fichier de thème est branché partout où il doit l'être (NF-35, avancement 5.2.3) :
//     `styles.scss`, `THEMES` / `ThemeId` (core/theme/theme.ts) et nom traduit (fr.json).
//     Les écrans (Paramètres › Apparence, aperçus) parcourent `THEMES` : ils n'ont pas à changer.
// Usage : npm run check:themes
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const stylesDir = fileURLToPath(new URL('../src/styles', import.meta.url));
const read = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');
const themes = readdirSync(`${stylesDir}/themes`)
  .filter((f) => /^_.+\.scss$/.test(f))
  .map((f) => f.slice(1, -'.scss'.length));

const compile = (source) =>
  sass.compileString(source, { loadPaths: [stylesDir], logger: sass.Logger.silent });

let failures = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`✔ ${label}`);
  } catch (error) {
    failures++;
    console.error(`✘ ${label}\n  ${error.message.split('\n')[0]}`);
  }
};

const expectError = (source, expected) => {
  try {
    compile(source);
  } catch (error) {
    if (!error.message.includes(expected)) {
      throw new Error(`erreur inattendue : ${error.message.split('\n')[0]}`);
    }
    return;
  }
  throw new Error('la compilation aurait dû échouer');
};

for (const theme of themes) {
  check(`Le thème « ${theme} » compile`, () =>
    compile(`@use 'theme-engine' as engine; @use 'themes/${theme}' as t;
             @include engine.theme('${theme}', t.$theme);`),
  );
}

const reference = themes[0];

check('Un jeton manquant fait échouer la compilation', () =>
  expectError(
    `@use 'sass:map'; @use 'theme-engine' as engine; @use 'themes/${reference}' as t;
     @include engine.theme('incomplet', map.remove(t.$theme, accent));`,
    'jeton manquant « accent »',
  ),
);

check('Un jeton inconnu fait échouer la compilation', () =>
  expectError(
    `@use 'sass:map'; @use 'theme-engine' as engine; @use 'themes/${reference}' as t;
     @include engine.theme('inconnu', map.set(t.$theme, couleur-inventee, red));`,
    'jeton inconnu « couleur-inventee »',
  ),
);

const stylesEntry = read('src/styles.scss');
const themeTs = read('src/app/core/theme/theme.ts');
const translations = JSON.parse(read('public/i18n/fr.json'));
const declared = [...themeTs.matchAll(/\{\s*id:\s*'([^']+)',\s*labelKey:\s*'([^']+)'\s*\}/g)].map(
  ([, id, labelKey]) => ({ id, labelKey }),
);
const translate = (key) => key.split('.').reduce((node, part) => node?.[part], translations);

for (const theme of themes) {
  check(`Le thème « ${theme} » est branché (styles.scss, THEMES, traduction)`, () => {
    const missing = [];
    if (!stylesEntry.includes(`@use 'styles/themes/${theme}'`)) {
      missing.push(`@use 'styles/themes/${theme}' dans styles.scss`);
    }
    if (!stylesEntry.includes(`engine.theme('${theme}'`)) {
      missing.push(`@include engine.theme('${theme}', …) dans styles.scss`);
    }
    if (!new RegExp(`ThemeId[^;]*'${theme}'`).test(themeTs)) {
      missing.push(`'${theme}' dans le type ThemeId`);
    }
    const entry = declared.find((d) => d.id === theme);
    if (!entry) {
      missing.push(`{ id: '${theme}', labelKey } dans THEMES`);
    } else if (typeof translate(entry.labelKey) !== 'string') {
      missing.push(`traduction « ${entry.labelKey} » dans fr.json`);
    }
    if (missing.length > 0) {
      throw new Error(`manque : ${missing.join(' ; ')}`);
    }
  });
}

check('THEMES ne déclare aucun thème sans fichier', () => {
  const orphans = declared.map((d) => d.id).filter((id) => !themes.includes(id));
  if (orphans.length > 0) {
    throw new Error(`thème(s) sans fichier styles/themes/_<id>.scss : ${orphans.join(', ')}`);
  }
});

if (failures > 0) {
  console.error(`\n${failures} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\nMoteur de thèmes : toutes les vérifications passent.');
