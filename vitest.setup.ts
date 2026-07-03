/**
 * Global test setup. Runs before each test file (see `test.setupFiles` in
 * vitest.config.ts). Guarded for the node environment, where `window` is
 * absent (server-side service tests).
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  // jsdom does not implement matchMedia; polyfill it so components that read the
  // viewport breakpoint (e.g. InlineDrawer, card drawers) can mount. We evaluate
  // `min-width`/`max-width` against `window.innerWidth` (jsdom defaults to 1024)
  // so breakpoint checks resolve the same way a real browser would at that size.
  const evaluate = (query: string): boolean => {
    const width = window.innerWidth
    const min = query.match(/min-width:\s*(\d+)px/)
    if (min && width < Number(min[1])) return false
    const max = query.match(/max-width:\s*(\d+)px/)
    if (max && width > Number(max[1])) return false
    return Boolean(min || max)
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
