import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as VerifyOtpModule from '@/server/auth/v2/verifyOtp'

const hoisted = vi.hoisted(() => ({
  getCurrentSessionPayload: vi.fn(),
  createSessions: vi.fn(),
  verifyOtp: vi.fn(),
  canAccessPortal: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionPayload: hoisted.getCurrentSessionPayload,
}))

vi.mock('@/server/auth/v2/createSession', () => ({
  createSessions: hoisted.createSessions,
}))

vi.mock('@/server/auth/v2/verifyOtp', async (importOriginal) => {
  const actual = await importOriginal<typeof VerifyOtpModule>()
  return { ...actual, verifyOtp: hoisted.verifyOtp }
})

vi.mock('@/server/auth/v2/portalGate', () => ({
  canAccessPortal: hoisted.canAccessPortal,
}))

function request(body: unknown) {
  return new Request('http://test/local', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const matchedUser = { id: 2, name: 'A', email: 'a@x.com', mobile: '900', role: 'student' }

describe('handleVerifyOtp — add account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.verifyOtp.mockResolvedValue([matchedUser])
    hoisted.canAccessPortal.mockResolvedValue(true)
    hoisted.createSessions.mockResolvedValue({
      sessions: [{ userId: 2, sessionId: 'new-session' }],
      activeUserId: 2,
      activeSessionId: 'new-session',
      activeToken: 'tok',
      setCookieHeader: 'lms_session=tok',
    })
  })

  it('rejects linkToCurrentSession when there is no current session', async () => {
    const { handleVerifyOtp } = await import('../verify-otp')
    hoisted.getCurrentSessionPayload.mockReturnValue(null)

    const res = await handleVerifyOtp(
      request({ otpSessionId: 's', otp: '123456', linkToCurrentSession: true }),
    )

    expect(res.status).toBe(401)
    expect(hoisted.createSessions).not.toHaveBeenCalled()
  })

  it('passes the current payload through to createSessions as linkTo', async () => {
    const { handleVerifyOtp } = await import('../verify-otp')
    const currentPayload = { sessionId: 'session-a', sessions: [] }
    hoisted.getCurrentSessionPayload.mockReturnValue(currentPayload)

    const res = await handleVerifyOtp(
      request({ otpSessionId: 's', otp: '123456', linkToCurrentSession: true }),
    )

    expect(res.status).toBe(200)
    expect(hoisted.createSessions).toHaveBeenCalledWith(
      expect.objectContaining({ linkTo: currentPayload }),
    )
  })
})
