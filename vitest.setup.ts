/**
 * Global test setup. Runs before each test file (see `test.setupFiles` in
 * vitest.config.ts). Guarded for the node environment, where `window` is
 * absent (server-side service tests).
 */

// Neutralize the DATABASE_URL for the whole test run. This runs before any test
// module (and its transitive `@/db` import / seed `dotenv` injection) loads, so
// it wins over a real/prod URL exported in the shell or baked into `.env`.
// Rule: if the URL is missing or points anywhere other than localhost, replace
// it with a throwaway placeholder so no test can ever touch a real DB (the
// mysql pool is lazy — an unused placeholder opens no connection, and it lets
// modules that import `@/db` load without throwing). An intentional localhost
// URL (e.g. `SEED_INTEGRATION=1` integration runs) is left untouched.
if (!process.env.DATABASE_URL?.toLowerCase().includes('localhost')) {
  process.env.DATABASE_URL =
    'mysql://placeholder@localhost:3306/test_placeholder'
}
if (typeof window !== 'undefined' && !window.matchMedia) {
  // jsdom does not implement matchMedia; polyfill it so components that read the
  // viewport breakpoint (e.g. InlineDrawer, card drawers) can mount. We evaluate
  // `min-width`/`max-width` against `window.innerWidth` (jsdom defaults to 1024)
  // so breakpoint checks resolve the same way a real browser would at that size.
  // `px` and `rem` are both accepted: Tailwind's breakpoints are `rem`
  // (`lg` = 64rem), and queries written in the same unit as the CSS can't drift
  // from it. Media-query `rem` resolves against the initial font size (16px),
  // never a page-level override — so a fixed factor is correct here.
  const REM_PX = 16
  const lengthPx = (query: string, feature: string): number | null => {
    const match = query.match(
      new RegExp(`${feature}:\\s*(\\d+(?:\\.\\d+)?)(px|rem)`),
    )
    if (!match) return null
    return Number(match[1]) * (match[2] === 'rem' ? REM_PX : 1)
  }
  const evaluate = (query: string): boolean => {
    const width = window.innerWidth
    const min = lengthPx(query, 'min-width')
    if (min !== null && width < min) return false
    const max = lengthPx(query, 'max-width')
    if (max !== null && width > max) return false
    return min !== null || max !== null
  }
  window.matchMedia = (query: string) => ({
    matches: evaluate(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
