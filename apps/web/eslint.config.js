import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output is generated code, so linting it would create noisy false
  // positives and slow local feedback.
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Compose standard JavaScript, TypeScript, React Hooks, and Vite React
      // Refresh rules. Flat config is ESLint's current config format.
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      // Browser globals such as window, document, and localStorage are valid in
      // the frontend package.
      globals: globals.browser,
    },
  },
])
