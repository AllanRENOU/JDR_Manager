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
    },
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
