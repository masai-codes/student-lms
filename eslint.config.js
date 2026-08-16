//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import localRules from './eslint-rules/index.js'

export default [
  ...tanstackConfig,
  {
    rules: {
      'sort-imports': 'off',
      'import-x/consistent-type-specifier-style': 'off',
      'import/consistent-type-specifier-style': 'off',
      'import/order': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  // Project-specific rules — encode the conventions documented in
  // AGENTS.md / .cursor/rules/project-coding-guidelines.mdc so they're
  // enforced deterministically instead of relying on AI/human review to
  // catch them every time. All start at "warn" (existing debt exists for
  // several of these); ratchet individual rules up to "error" once their
  // backlog is cleared.
  {
    files: ['src/components/**/*.tsx'],
    ignores: ['src/components/ui/**'],
    plugins: { local: localRules },
    rules: {
      'local/no-raw-color': 'warn',
      'local/require-data-testid': 'warn',
    },
  },
  {
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/query/**/*.ts',
      'src/lib/api/**/*.ts',
    ],
    ignores: [
      'src/lib/api/fetchJson.ts',
      '**/*.test.{ts,tsx}',
      '**/__tests__/**',
    ],
    plugins: { local: localRules },
    rules: {
      'local/no-direct-fetch': 'warn',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/lib/api/**/*.ts'],
    ignores: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    plugins: { local: localRules },
    rules: {
      'local/no-server-value-import-in-client': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    // src/routes/api/** legitimately declares its own path via
    // createFileRoute('/api/...') — that's the route definition, not a
    // caller hardcoding a path that belongs in a *Paths.ts constant.
    ignores: [
      '**/*Paths.ts',
      '**/*.test.{ts,tsx}',
      '**/__tests__/**',
      'src/routes/api/**',
      // Documents/scans API routes for the OpenAPI/docs UI — the literal
      // paths here are the subject being documented, not a caller.
      'src/server/api/docs/**',
    ],
    plugins: { local: localRules },
    rules: {
      'local/no-hardcoded-api-path': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/**'],
    plugins: { local: localRules },
    rules: {
      'local/no-new-server-fn': 'warn',
    },
  },
  {
    files: ['src/server/api/**/*.ts'],
    ignores: ['src/server/api/http/**'],
    plugins: { local: localRules },
    rules: {
      'local/no-response-outside-http-layer': 'warn',
    },
  },
]
