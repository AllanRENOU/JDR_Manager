// Vérifie le moteur de thèmes (TEC-12, avancement 1.2.2) :
//  1. chaque thème déclaré compile ;
//  2. une map à laquelle il manque un jeton fait échouer la compilation ;
//  3. une map contenant un jeton inconnu fait échouer la compilation.
// Usage : npm run check:themes
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const stylesDir = fileURLToPath(new URL('../src/styles', import.meta.url));
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

if (failures > 0) {
  console.error(`\n${failures} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\nMoteur de thèmes : toutes les vérifications passent.');
