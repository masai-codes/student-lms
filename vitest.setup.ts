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
  // Height and `pointer` are supported alongside width because the phone
  // breakpoint (`useIsMobileViewport`) is a query list that needs all three:
  // a landscape phone is recognized by its short height plus a coarse pointer.
  // `pointer` resolves off `navigator.maxTouchPoints`, which tests can redefine
  // to simulate a touch device; jsdom leaves it 0, i.e. a fine pointer.
  const evaluateClause = (clause: string): boolean => {
    const axes = [
      { feature: 'width', value: window.innerWidth },
      { feature: 'height', value: window.innerHeight },
    ]
    let recognized = false
    for (const { feature, value } of axes) {
      const min = lengthPx(clause, `min-${feature}`)
      if (min !== null) {
        if (value < min) return false
        recognized = true
      }
      const max = lengthPx(clause, `max-${feature}`)
      if (max !== null) {
        if (value > max) return false
        recognized = true
      }
    }
    const pointer = clause.match(/pointer:\s*(coarse|fine)/)?.[1]
    if (pointer) {
      const isCoarse = (navigator.maxTouchPoints ?? 0) > 0
      if ((pointer === 'coarse') !== isCoarse) return false
      recognized = true
    }
    return recognized
  }
  // A comma-separated query list matches when any one of its clauses does.
  const evaluate = (query: string): boolean =>
    query.split(',').some((clause) => evaluateClause(clause.trim()))
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
