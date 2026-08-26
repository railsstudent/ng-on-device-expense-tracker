import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default defineConfig([
  {
    files: ['**/*.ts'],
    plugins: {
      unicorn,
    },
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      'max-lines-per-function': [
        'error',
        {
          max: 40,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'prefer-const': [
        'error',
        {
          destructuring: 'any',
          ignoreReadBeforeAssign: false,
        },
      ],
      curly: ['error', 'all'],
      'no-plusplus': ['error'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../*', '**/./../*'],
              message: 'Relative imports are forbidden. Please use absolute path aliases starting with @/.',
            },
          ],
        },
      ],
      complexity: ['error', { max: 10 }],
      'unicorn/prefer-switch': ['error', { minimumCases: 4 }],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public', // Default accessibility for class members is 'public'
          overrides: {
            properties: 'off', // Keep 'off' so native '#' private fields do not throw errors
            parameterProperties: 'off',
          },
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
