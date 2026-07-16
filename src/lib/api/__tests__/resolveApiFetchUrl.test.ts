import { afterEach, describe, expect, it, vi } from 'vitest'

// `ORIGIN_URLS` (read transitively by resolveApiFetchUrl) is evaluated once at
// import time from the env, so we re-import the module *after* stubbing the env
// rather than importing it statically at the top of the file. Otherwise the
// stub is a no-op and the test silently depends on the ambient shell env (which
// is why it passed locally but fell back to the prod URL in CI).
async function loadResolveApiFetchUrl() {
  vi.resetModules()
  return (await import('../resolveApiFetchUrl')).resolveApiFetchUrl
}

describe('resolveApiFetchUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns absolute URLs unchanged', async () => {
    const resolveApiFetchUrl = await loadResolveApiFetchUrl()
    expect(resolveApiFetchUrl('https://example.com/api/foo')).toBe(
      'https://example.com/api/foo',
    )
  })

  it('resolves relative paths against VITE_NEW_STUDENT_UI_URL on the server', async () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'http://localhost:3002')
    const resolveApiFetchUrl = await loadResolveApiFetchUrl()
    const originalWindow = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window

    expect(resolveApiFetchUrl('/api/learn/page')).toBe(
      'http://localhost:3002/api/learn/page',
    )

    globalThis.window = originalWindow
  })
})
