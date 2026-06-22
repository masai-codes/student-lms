import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveApiFetchUrl } from '../resolveApiFetchUrl'

describe('resolveApiFetchUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns absolute URLs unchanged', () => {
    expect(resolveApiFetchUrl('https://example.com/api/foo')).toBe(
      'https://example.com/api/foo',
    )
  })

  it('resolves relative paths against VITE_NEW_STUDENT_UI_URL on the server', () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'http://localhost:3002')
    const originalWindow = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window

    expect(resolveApiFetchUrl('/api/learn/page')).toBe(
      'http://localhost:3002/api/learn/page',
    )

    globalThis.window = originalWindow
  })
})
