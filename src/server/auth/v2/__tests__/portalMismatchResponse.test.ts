import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

// See portalRedirect.test.ts: ORIGIN_URLS is read at import time, so the module
// must be loaded after the env stubs.
async function loadPortalMismatchResponse() {
  vi.resetModules()
  return (await import('../portalMismatchResponse')).portalMismatchResponse
}

async function readError(res: Response): Promise<Record<string, unknown>> {
  const body = (await res.json()) as { error: Record<string, unknown> }
  return body.error
}

/** iHub portal request (the `X-App-Origin` header is the first thing checked). */
function ihubRequest(): Request {
  return new Request('https://learn.ihubiitrcourses.org/v2/login/', {
    method: 'POST',
    headers: { 'X-App-Origin': 'ihub' },
  })
}

describe('portalMismatchResponse', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NEW_STUDENT_UI_URL', 'https://learn.masaischool.com')
    vi.stubEnv(
      'VITE_NEW_STUDENT_UI_URL_IHUB',
      'https://learn.ihubiitrcourses.org',
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('ships the redirect target for an account that belongs elsewhere', async () => {
    const portalMismatchResponse = await loadPortalMismatchResponse()

    const res = portalMismatchResponse({
      client: 'masai',
      request: ihubRequest(),
    })

    expect(resolveTrueStatus(res)).toBe(403)
    await expect(readError(res)).resolves.toEqual({
      code: 'PORTAL_MISMATCH',
      message:
        'This account belongs to Masai School. Taking you to the right place…',
      portal: 'masai',
      portalLabel: 'Masai School',
      redirectUrl: 'https://learn.masaischool.com/signin',
    })
  })

  it('falls back to the plain message when no single account portal is known', async () => {
    const portalMismatchResponse = await loadPortalMismatchResponse()

    // An empty client must NOT be defaulted to Masai and redirected there.
    const res = portalMismatchResponse({ client: null, request: ihubRequest() })

    await expect(readError(res)).resolves.toEqual({
      code: 'PORTAL_MISMATCH',
      message: 'This account cannot sign in from this portal.',
    })
  })
})
