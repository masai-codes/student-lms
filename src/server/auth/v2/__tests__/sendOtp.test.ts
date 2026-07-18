import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  hash: vi.fn(),
  sendOtpEmail: vi.fn(),
  sendOtpSms: vi.fn(),
  sendOtpWhatsapp: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('../loginRateLimit', () => ({ recordFailedLogin: vi.fn() }))
vi.mock('bcryptjs', () => ({ hash: hoisted.hash }))
vi.mock('../otpEmail', () => ({ sendOtpEmail: hoisted.sendOtpEmail }))
vi.mock('../otpSms', () => ({ sendOtpSms: hoisted.sendOtpSms }))
vi.mock('../otpWhatsapp', () => ({ sendOtpWhatsapp: hoisted.sendOtpWhatsapp }))

// assertSendAllowed → `db.select({...}).from(otpCodes).where(and(...))` (awaited, no .limit)
function mockRateLimitWindow(recent: Array<{ expiresAt: string }>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(recent) }),
  })
}

// user lookup → `db.select({...}).from(users).where(eq(...)).limit(1)`
function mockUserLookup(rows: Array<Record<string, unknown>>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

describe('sendOtp — user does not exist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a phone-specific USER_NOT_FOUND message for an unknown mobile number', async () => {
    const { sendOtp, SendOtpError } = await import('../sendOtp')
    mockRateLimitWindow([])
    mockUserLookup([])

    const err = await sendOtp({
      identifier: '9999999999',
      isResend: false,
    }).catch((e) => e)

    expect(err).toBeInstanceOf(SendOtpError)
    expect(err.code).toBe('USER_NOT_FOUND')
    expect(err.message).toBe(
      "We couldn't find an account with that mobile number. Please check it and try again, or sign up.",
    )
    // No OTP is ever sent for a non-existent account.
    expect(hoisted.sendOtpSms).not.toHaveBeenCalled()
    expect(hoisted.sendOtpWhatsapp).not.toHaveBeenCalled()
    expect(hoisted.sendOtpEmail).not.toHaveBeenCalled()
  })

  it('returns an email-specific USER_NOT_FOUND message for an unknown email', async () => {
    const { sendOtp, SendOtpError } = await import('../sendOtp')
    mockRateLimitWindow([])
    mockUserLookup([])

    const err = await sendOtp({
      identifier: 'ghost@example.com',
      isResend: false,
    }).catch((e) => e)

    expect(err).toBeInstanceOf(SendOtpError)
    expect(err.code).toBe('USER_NOT_FOUND')
    expect(err.message).toBe(
      "We couldn't find an account with that email address. Please check it and try again, or sign up.",
    )
  })

  it('rate-limits before any lookup once the hourly cap is reached', async () => {
    const { sendOtp, SendOtpError } = await import('../sendOtp')
    mockRateLimitWindow(
      Array.from({ length: 10 }, () => ({ expiresAt: '2999-01-01 00:00:00' })),
    )

    const err = await sendOtp({
      identifier: '9999999999',
      isResend: false,
    }).catch((e) => e)

    expect(err).toBeInstanceOf(SendOtpError)
    expect(err.code).toBe('RATE_LIMITED')
    expect(err.message).toBe(
      'Too many OTP requests. Please try again in an hour.',
    )
    // Only the rate-limit window was queried; the user lookup never ran.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })
})
