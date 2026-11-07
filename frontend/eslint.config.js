import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import prettierConfig from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      noUnsanitized.configs.recommended,
      prettierConfig,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Dilarang: risiko XSS. Gunakan JSX/teks biasa.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Gunakan modul shared/lib/storage.' },
        { name: 'sessionStorage', message: 'Gunakan modul shared/lib/storage.' },
      ],
    },
  },
  // Penyimpanan terpusat boleh memakai storage langsung
  { files: ['src/shared/lib/storage.ts'], rules: { 'no-restricted-globals': 'off' } },
  // Batas arsitektur: shared tidak boleh impor features/app
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/features/*', '@/app/*'] }],
    },
  },
  // Feature tidak boleh impor app
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/app/*'] }],
    },
  },
  // File konfigurasi tidak ikut type-aware linting
  {
    files: ['**/*.config.{js,ts,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
])
