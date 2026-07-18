import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as LoginWithPasswordModule from '@/server/auth/v2/loginWithPassword'
import type * as LoginRateLimitModule from '@/server/auth/v2/loginRateLimit'

const hoisted = vi.hoisted(() => ({
  getCurrentSessionPayload: vi.fn(),
  createSessions: vi.fn(),
  loginWithPassword: vi.fn(),
  canAccessPortal: vi.fn(),
  assertLoginAllowed: vi.fn(),
  clearLoginAttempts: vi.fn(),
  recordFailedLogin: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionPayload: hoisted.getCurrentSessionPayload,
}))

vi.mock('@/server/auth/v2/createSession', () => ({
  createSessions: hoisted.createSessions,
  extractClientIp: () => '127.0.0.1',
}))

vi.mock('@/server/auth/v2/loginWithPassword', async (importOriginal) => {
  const actual = await importOriginal<typeof LoginWithPasswordModule>()
  return { ...actual, loginWithPassword: hoisted.loginWithPassword }
})

vi.mock('@/server/auth/v2/portalGate', () => ({
  canAccessPortal: hoisted.canAccessPortal,
}))

vi.mock('@/server/auth/v2/loginRateLimit', async (importOriginal) => {
  const actual = await importOriginal<typeof LoginRateLimitModule>()
  return {
    ...actual,
    assertLoginAllowed: hoisted.assertLoginAllowed,
    clearLoginAttempts: hoisted.clearLoginAttempts,
    recordFailedLogin: hoisted.recordFailedLogin,
  }
})

function request(body: unknown) {
  return new Request('http://test/local', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const dbUser = { id: 2, name: 'A', email: 'a@x.com', mobile: null, role: 'student' }

describe('handlePasswordLogin — add account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.assertLoginAllowed.mockResolvedValue(undefined)
    hoisted.loginWithPassword.mockResolvedValue(dbUser)
    hoisted.canAccessPortal.mockResolvedValue(true)
    hoisted.createSessions.mockResolvedValue({
      activeToken: 'tok',
      setCookieHeader: 'lms_session=tok',
    })
  })

  it('rejects linkToCurrentSession when there is no current session', async () => {
    const { handlePasswordLogin } = await import('../index')
    hoisted.getCurrentSessionPayload.mockReturnValue(null)

    const res = await handlePasswordLogin(
      request({ email: 'a@x.com', password: 'x', linkToCurrentSession: true }),
    )

    expect(res.status).toBe(401)
    expect(hoisted.createSessions).not.toHaveBeenCalled()
  })

  it('passes the current payload through to createSessions as linkTo', async () => {
    const { handlePasswordLogin } = await import('../index')
    const currentPayload = { sessionId: 'session-a', sessions: [] }
    hoisted.getCurrentSessionPayload.mockReturnValue(currentPayload)

    const res = await handlePasswordLogin(
      request({ email: 'a@x.com', password: 'x', linkToCurrentSession: true }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.createSessions).toHaveBeenCalledWith(
      expect.objectContaining({ linkTo: currentPayload }),
    )
  })

  it('does not require a current session for a normal (non-linking) login', async () => {
    const { handlePasswordLogin } = await import('../index')
    hoisted.getCurrentSessionPayload.mockReturnValue(null)

    const res = await handlePasswordLogin(
      request({ email: 'a@x.com', password: 'x' }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.createSessions).toHaveBeenCalledWith(
      expect.objectContaining({ linkTo: undefined }),
    )
  })
})
