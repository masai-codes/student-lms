import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `ORIGIN_URLS` (read by portalRedirect) is evaluated once at import time from
 * the env, so the module is re-imported *after* stubbing — a static top-level
 * import would make the stubs a no-op and leave the test on the prod fallbacks.
 */
async function loadPortalRedirect() {
  vi.resetModules()
  return await import('../portalRedirect')
}

function requestFrom(url: string, portalHeader?: string): Request {
  return new Request(url, {
    headers: portalHeader ? { 'X-App-Origin': portalHeader } : {},
  })
}

describe('resolvePortalRedirect', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'https://learn.masaischool.com')
    vi.stubEnv(
      'VITE_NEW_STUDENT_UI_URL_IHUB',
      'https://learn.ihubiitrcourses.org',
    )
    vi.stubEnv(
      'VITE_NEW_STUDENT_UI_URL_IITJ',
      'https://iitj-learn.masaischool.com',
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('points a Masai account visiting the iHub domain back at Masai', async () => {
    const { resolvePortalRedirect } = await loadPortalRedirect()

    expect(
      resolvePortalRedirect({
        userPortal: 'masai',
        request: requestFrom(
          'https://learn.ihubiitrcourses.org/signin',
          'ihub',
        ),
        path: '/signin',
      }),
    ).toEqual({
      portal: 'masai',
      portalLabel: 'Masai School',
      redirectUrl: 'https://learn.masaischool.com/signin',
    })
  })

  it('points an IITJ account visiting the Masai domain at the IITJ portal', async () => {
    const { resolvePortalRedirect } = await loadPortalRedirect()

    expect(
      resolvePortalRedirect({
        userPortal: 'iitj',
        request: requestFrom('https://learn.masaischool.com/', 'masai'),
      })?.redirectUrl,
      // No `path` → portal root, not a trailing slash.
    ).toBe('https://iitj-learn.masaischool.com')
  })

  it('returns null when the user is already on their own portal', async () => {
    const { resolvePortalRedirect } = await loadPortalRedirect()

    expect(
      resolvePortalRedirect({
        userPortal: 'iitj',
        request: requestFrom('https://iitj-learn.masaischool.com/', 'iitj'),
      }),
    ).toBeNull()
  })

  it('returns null rather than looping when both portals share an origin (local dev)', async () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'http://localhost:3002')
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL_IHUB', 'http://localhost:3002')
    const { resolvePortalRedirect } = await loadPortalRedirect()

    // Request portal is ihub (header), user is masai — a mismatch, but both
    // resolve to the same localhost origin, so there is nowhere to send them.
    expect(
      resolvePortalRedirect({
        userPortal: 'masai',
        request: requestFrom('http://localhost:3002/signin', 'ihub'),
      }),
    ).toBeNull()
  })
})
