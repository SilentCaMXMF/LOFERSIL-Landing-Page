import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['.opencode/plugin/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js'],
  },
];
