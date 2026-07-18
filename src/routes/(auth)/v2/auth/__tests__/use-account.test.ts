import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getCurrentSessionPayload: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionPayload: hoisted.getCurrentSessionPayload,
}))

function mockDbLookups(targetSession: unknown, user: unknown) {
  hoisted.dbSelect
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(targetSession ? [targetSession] : []),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(user ? [user] : []) }),
      }),
    })
}

function request(body: unknown) {
  return new Request('http://test/local', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('handleUseAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET_KEY = 'test-secret'
    process.env.COOKIE_NAME = 'lms_session'
  })

  const dbUser = {
    id: 2,
    name: 'Secondary',
    email: 'secondary@example.com',
    mobile: '9000000000',
    role: 'student',
  }

  it('reuses the target account existing expiry rather than minting a fresh one', async () => {
    const { handleUseAccount } = await import('../use-account')

    const now = Math.floor(Date.now() / 1000)
    const existingExp = now + 1000 // deliberately not "a fresh full TTL away"
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 5000, absExp: now + 999_999, stepHours: 72 },
        { sessionId: 'session-b', exp: existingExp, absExp: now + 999_999, stepHours: 72 },
      ],
    })
    mockDbLookups({ id: 'session-b', userId: 2 }, dbUser)

    const res = await handleUseAccount(request({ sessionId: 'session-b' }))
    expect(res.status).toBe(200)

    const setCookie = res.headers.get('Set-Cookie')
    expect(setCookie).toContain(
      `Expires=${new Date(existingExp * 1000).toUTCString()}`,
    )
  })

  it('rejects switching to a linked account whose own session has already expired', async () => {
    const { handleUseAccount } = await import('../use-account')

    const now = Math.floor(Date.now() / 1000)
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 5000, absExp: now + 999_999, stepHours: 72 },
        { sessionId: 'session-b', exp: now - 10, absExp: now + 999_999, stepHours: 72 },
      ],
    })
    mockDbLookups({ id: 'session-b', userId: 2 }, dbUser)

    const res = await handleUseAccount(request({ sessionId: 'session-b' }))
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })

  it('returns 401 when there is no current session', async () => {
    const { handleUseAccount } = await import('../use-account')
    hoisted.getCurrentSessionPayload.mockReturnValue(null)

    const res = await handleUseAccount(request({ sessionId: 'session-b' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the target is not in the current token — no fallback minting', async () => {
    const { handleUseAccount } = await import('../use-account')
    const now = Math.floor(Date.now() / 1000)
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [{ sessionId: 'session-a', exp: now + 5000, absExp: now + 999_999, stepHours: 72 }],
    })

    const res = await handleUseAccount(request({ sessionId: 'session-c' }))
    expect(resolveTrueStatus(res)).toBe(403)
    // No DB lookup should even happen — rejected purely off the token.
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns 404 when the target session was revoked (its row deleted) elsewhere', async () => {
    const { handleUseAccount } = await import('../use-account')
    const now = Math.floor(Date.now() / 1000)
    hoisted.getCurrentSessionPayload.mockReturnValue({
      sessionId: 'session-a',
      sessions: [
        { sessionId: 'session-a', exp: now + 5000, absExp: now + 999_999, stepHours: 72 },
        { sessionId: 'session-b', exp: now + 5000, absExp: now + 999_999, stepHours: 72 },
      ],
    })
    mockDbLookups(undefined, undefined)

    const res = await handleUseAccount(request({ sessionId: 'session-b' }))
    expect(resolveTrueStatus(res)).toBe(404)
  })
})
