import { test } from 'node:test'
import { RuleTester } from 'eslint'
import noRawColor from './no-raw-color.js'
import noHardcodedApiPath from './no-hardcoded-api-path.js'
import noDirectFetch from './no-direct-fetch.js'
import noServerValueImportInClient from './no-server-value-import-in-client.js'
import noNewServerFn from './no-new-server-fn.js'
import noResponseOutsideHttpLayer from './no-response-outside-http-layer.js'
import requireDataTestid from './require-data-testid.js'

const jsxTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

test('no-raw-color', () => {
  jsxTester.run('no-raw-color', noRawColor, {
    valid: [
      'const el = <div className="bg-surface text-foreground-muted" />',
      "const el = <div className={cn('bg-surface', isActive && 'text-brand')} />",
      'const el = <div className="border-border rounded-lg p-4" />',
    ],
    invalid: [
      {
        code: 'const el = <div className="text-[#111827]" />',
        errors: [{ messageId: 'rawColor' }],
      },
      {
        code: 'const el = <div className="bg-gray-700" />',
        errors: [{ messageId: 'rawColor' }],
      },
      {
        code: "const el = <div className={cn('bg-white', 'p-4')} />",
        errors: [{ messageId: 'rawColor' }],
      },
    ],
  })
})

test('no-hardcoded-api-path', () => {
  tester.run('no-hardcoded-api-path', noHardcodedApiPath, {
    valid: ['const url = FOO_API.list', 'const url = `${BASE}/foo`'],
    invalid: [
      {
        code: "const url = '/api/foo'",
        errors: [{ messageId: 'hardcodedPath' }],
      },
      {
        code: 'const url = `/api/foo/${id}`',
        errors: [{ messageId: 'hardcodedPath' }],
      },
    ],
  })
})

test('no-direct-fetch', () => {
  tester.run('no-direct-fetch', noDirectFetch, {
    valid: ['fetchJson("/api/foo")', 'obj.fetch("/api/foo")'],
    invalid: [
      { code: 'fetch("/api/foo")', errors: [{ messageId: 'directFetch' }] },
    ],
  })
})

test('no-server-value-import-in-client', () => {
  // `import type { X }` / `import { type X }` (TS-only syntax) are exempted
  // by the rule's importKind checks but can't be exercised here without a
  // TS parser; verified against the real codebase instead (270 such imports
  // in src/components + src/lib/api produce zero violations).
  tester.run('no-server-value-import-in-client', noServerValueImportInClient, {
    valid: ["import { fetchFoo } from '@/lib/api/foo/fooApi'"],
    invalid: [
      {
        code: "import { getFoo } from '@/server/api/foo/services/getFoo.service'",
        errors: [{ messageId: 'serverImport' }],
      },
      {
        code: "import { db } from '@/db'",
        errors: [{ messageId: 'serverImport' }],
      },
    ],
  })
})

test('no-new-server-fn', () => {
  tester.run('no-new-server-fn', noNewServerFn, {
    valid: ['const x = createFileRoute("/api/foo")({})'],
    invalid: [
      {
        code: 'const fn = createServerFn().handler(() => {})',
        errors: [{ messageId: 'noNewServerFn' }],
      },
    ],
  })
})

test('no-response-outside-http-layer', () => {
  tester.run('no-response-outside-http-layer', noResponseOutsideHttpLayer, {
    valid: ['function handle() { return jsonOk(data) }'],
    invalid: [
      {
        code: "function handle() { return new Response('ok', { status: 200 }) }",
        errors: [{ messageId: 'rawResponse' }],
      },
    ],
  })
})

test('require-data-testid', () => {
  jsxTester.run('require-data-testid', requireDataTestid, {
    valid: [
      '<button data-testid="foo-submit">Go</button>',
      '<Button data-testid="foo-submit">Go</Button>',
      '<button {...rest}>Go</button>',
      '<div>static</div>',
    ],
    invalid: [
      { code: '<button>Go</button>', errors: [{ messageId: 'missingTestId' }] },
      { code: '<Button>Go</Button>', errors: [{ messageId: 'missingTestId' }] },
      {
        code: '<div onClick={handleClick}>Go</div>',
        errors: [{ messageId: 'missingTestId' }],
      },
    ],
  })
})
