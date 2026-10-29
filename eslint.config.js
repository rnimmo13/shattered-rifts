import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/** Golden rule 1: the engine (and other pure packages) must stay deterministic and I/O-free. */
const purityRules = {
  'no-restricted-properties': [
    'error',
    { object: 'Math', property: 'random', message: 'Use the seeded PRNG in game state.' },
    { object: 'Date', property: 'now', message: 'The engine has no clock.' },
    { object: 'performance', property: 'now', message: 'The engine has no clock.' },
  ],
  'no-restricted-globals': [
    'error',
    { name: 'Date', message: 'The engine has no clock.' },
    { name: 'setTimeout', message: 'The engine is synchronous.' },
    { name: 'setInterval', message: 'The engine is synchronous.' },
    { name: 'fetch', message: 'The engine does no I/O.' },
    { name: 'window', message: 'The engine has no DOM.' },
    { name: 'document', message: 'The engine has no DOM.' },
    { name: 'crypto', message: 'Use the seeded PRNG in game state.' },
  ],
  'no-restricted-imports': [
    'error',
    {
      paths: ['fs', 'path', 'os', 'child_process', 'http', 'https', 'net'].map((name) => ({
        name,
        message: 'The engine does no I/O.',
      })),
      patterns: [{ group: ['node:*'], message: 'The engine does no I/O.' }],
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.wrangler/**',
      '.claude/**',
      // (frozen balance archives are never linted or reformatted: their hashes are recorded)
      'reviews/balance-baselines/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      // `InstanceId | 'face'` documents intent even though InstanceId is a string.
      '@typescript-eslint/no-redundant-type-constituents': 'off',
    },
  },
  {
    files: [
      'packages/content/src/**/*.ts',
      'packages/campaign/src/**/*.ts',
      'packages/combat/src/**/*.ts',
      'packages/pvp/src/**/*.ts',
    ],
    ignores: ['**/*.test.ts'],
    rules: purityRules,
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['tools/**/*.ts', '*.js', '*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // plain JS entry files aren't part of any TS project
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
