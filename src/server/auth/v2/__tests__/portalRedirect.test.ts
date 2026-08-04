import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `ORIGIN_URLS` (read by portalRedirect) is evaluated once at import time from
 * the env, so the module is re-imported *after* stubbing — a static top-level
 * import would make the stubs a no-op and leave the test on the prod fallbacks.
 */
async function loadGetPortalRedirectUrl() {
  vi.resetModules()
  return (await import('../portalRedirect')).getPortalRedirectUrl
}

/** The `X-App-Origin` header is the first thing `getEmailPortal` checks. */
function requestFrom(url: string, portal: string): Request {
  return new Request(url, { headers: { 'X-App-Origin': portal } })
}

const student = { id: 1, role: 'student' as string | null, client: 'masai' }

describe('getPortalRedirectUrl', () => {
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

  it('sends a Masai student off the iHub domain to the Masai base URL', async () => {
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: student,
        request: requestFrom('https://learn.ihubiitrcourses.org/', 'ihub'),
      }),
    ).resolves.toBe('https://learn.masaischool.com')
  })

  it('sends an IITJ student off the Masai domain to the IITJ base URL', async () => {
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: { ...student, client: 'iitj' },
        request: requestFrom('https://learn.masaischool.com/', 'masai'),
      }),
    ).resolves.toBe('https://iitj-learn.masaischool.com')
  })

  it('stays put when the student is already on their own portal', async () => {
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: { ...student, client: 'iitj' },
        request: requestFrom('https://iitj-learn.masaischool.com/', 'iitj'),
      }),
    ).resolves.toBeNull()
  })

  it('treats a null/unknown client as Masai', async () => {
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: { ...student, client: null },
        request: requestFrom('https://learn.ihubiitrcourses.org/', 'ihub'),
      }),
    ).resolves.toBe('https://learn.masaischool.com')
  })

  it('lets admins through on any portal', async () => {
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: { ...student, role: 'admin' },
        request: requestFrom('https://learn.ihubiitrcourses.org/', 'ihub'),
      }),
    ).resolves.toBeNull()
  })

  it('stays put rather than looping when both portals share an origin (local dev)', async () => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'http://localhost:3002')
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL_IHUB', 'http://localhost:3002')
    const getPortalRedirectUrl = await loadGetPortalRedirectUrl()

    await expect(
      getPortalRedirectUrl({
        user: student,
        request: requestFrom('http://localhost:3002/', 'ihub'),
      }),
    ).resolves.toBeNull()
  })
})
