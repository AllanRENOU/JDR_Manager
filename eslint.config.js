// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  {
    ignores: ['dist/**', '.angular/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // TEC-04 : OnPush est la détection par défaut depuis Angular 22 ; on interdit d'en sortir
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='ChangeDetectionStrategy'][property.name=/^(Eager|Default)$/]",
          message: 'TEC-04 : les composants restent en OnPush (détection par défaut).',
        },
      ],
      // TEC-03 : signals plutôt que décorateurs @Input / @Output
      '@angular-eslint/prefer-signals': 'error',
      // TEC-07 : inject() plutôt que l'injection par constructeur
      '@angular-eslint/prefer-inject': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // TEC-23 : seule la couche de données (core/data) accède à IndexedDB via idb
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'idb',
              message:
                'TEC-23 : passer par DATA_REPOSITORY ; seuls les fichiers de core/data importent idb.',
            },
          ],
          patterns: [{ group: ['idb/*'], message: 'TEC-23 : idb est réservé à core/data.' }],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'indexedDB', message: 'TEC-23 : passer par DATA_REPOSITORY.' },
      ],
    },
  },
  {
    // Couche de données (et outillage de test) : seuls endroits autorisés à accéder à IndexedDB (TEC-23)
    files: ['src/app/core/data/**/*.ts', 'src/testing/**/*.ts'],
    rules: { 'no-restricted-imports': 'off', 'no-restricted-globals': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility, prettier],
    rules: {
      // TEC-05 : control flow natif (@if, @for…)
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
]);
