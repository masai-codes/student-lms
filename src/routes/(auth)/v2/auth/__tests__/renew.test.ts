import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getCurrentSessionPayload: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionPayload: hoisted.getCurrentSessionPayload,
}))

function request() {
  return new Request('http://test/local', { method: 'POST' })
}

describe('handleRenew', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET_KEY = 'test-secret'
    process.env.COOKIE_NAME = 'lms_session'
  })

  it('returns 401 when there is no current session', async () => {
    const { handleRenew } = await import('../renew')
    hoisted.getCurrentSessionPayload.mockReturnValue(null)

    const res = await handleRenew(request())
    expect(res.status).toBe(401)
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })

  it('reissues the cookie and reports renewed:true when there is room to extend', async () => {
    const { handleRenew } = await import('../renew')
    const now = Math.floor(Date.now() / 1000)
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 10, absExp: now + 999_999, stepHours: 72 },
      ],
    })

    const res = await handleRenew(request())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { renewed: boolean; exp: number }
    expect(body.renewed).toBe(true)
    expect(body.exp).toBeGreaterThan(now + 10)
    expect(res.headers.get('Set-Cookie')).toContain('lms_session=')
  })

  it('does not reissue a cookie once already at the absolute cap', async () => {
    const { handleRenew } = await import('../renew')
    const now = Math.floor(Date.now() / 1000)
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 100, absExp: now + 100, stepHours: 72 },
      ],
    })

    const res = await handleRenew(request())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { renewed: boolean; exp: number }
    expect(body.renewed).toBe(false)
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })
})
