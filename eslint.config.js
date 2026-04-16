import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/wasm/**']),
  // Architectural boundary rules for src/REFACTOR/ImpastoEngine/
  // Mirrors the dependency rules in src/REFACTOR/ImpastoEngine/ARCHITECTURE.md
  {
    files: ['src/REFACTOR/**/*.{ts,tsx}'],
    rules: {
      'import/no-restricted-paths': ['warn', {
        zones: [
          // Rule 2: pipeline must not depend on the composition root
          {
            target: './src/REFACTOR/ImpastoEngine/pipeline',
            from: './src/REFACTOR/ImpastoEngine/core',
            message: '[architecture] pipeline must not import from core/ (composition root)',
          },
          // Rule 3: viewport must not depend on pipeline (prevents cycles)
          {
            target: './src/REFACTOR/ImpastoEngine/viewport',
            from: './src/REFACTOR/ImpastoEngine/pipeline',
            message: '[architecture] viewport must not import from pipeline/ (cycle prevention)',
          },
          // Rule 4: colorPins must not import from selection (imageRect belongs in infra/)
          {
            target: './src/REFACTOR/ImpastoEngine/colorPins',
            from: './src/REFACTOR/ImpastoEngine/selection',
            message: '[architecture] colorPins must not import from selection/; move shared geometry to infra/',
          },
        ],
      }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // Root tsconfig.json uses `references` to cover app + node + scripts configs.
          project: ['./tsconfig.json'],
        },
        node: true,
      },
      // Vite virtual suffixes / assets — not visible to vanilla Node resolution
      'import/ignore': ['\\?worker$', '\\?url$'],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // TS already validates default exports; `?worker` is opaque to this rule.
      'import/default': 'off',
    },
  },
])
