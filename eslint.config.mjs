// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

/** Flakiness rules that apply anywhere Playwright is driven — specs and page objects alike. */
const noFlakyPatterns = {
  'playwright/no-wait-for-timeout': 'error',
  'playwright/no-wait-for-selector': 'error',
  'playwright/no-networkidle': 'error',
  'playwright/no-force-option': 'error',
  'playwright/no-element-handle': 'error',
  'playwright/no-eval': 'error',
  'playwright/no-page-pause': 'error',
};

export default defineConfig(
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'all-blob-reports/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { playwright },
    rules: noFlakyPatterns,
  },
  {
    files: ['tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      ...noFlakyPatterns,
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/require-top-level-describe': 'error',
      'playwright/valid-title': ['error', { mustMatch: { test: '^should ' } }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message:
                "Import `test` and `expect` from '@fixtures' so specs get the custom fixtures.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
