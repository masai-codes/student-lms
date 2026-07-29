import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  compare: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('../loginRateLimit', () => ({ recordFailedLogin: vi.fn() }))

vi.mock('bcryptjs', () => ({ compare: hoisted.compare }))

// otp lookup → `db.select({...}).from(otpCodes).where(eq(...)).limit(1)`
function mockOtpLookup(rows: Array<Record<string, unknown>>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

// user lookup → `db.select({...}).from(users).where(eq(...))` (no .limit)
function mockUserLookup(rows: Array<Record<string, unknown>>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  })
}

const FUTURE = '2999-01-01 00:00:00'
const PAST = '2000-01-01 00:00:00'

const validRecord = {
  id: 1,
  identifier: 'asha@example.com',
  channel: 'email',
  otpHash: '$2a$10$hash',
  expiresAt: FUTURE,
  attempts: 0,
  usedAt: null,
}

const dbUser = {
  id: 7,
  name: 'Asha',
  email: 'asha@example.com',
  mobile: null,
  role: 'student',
  client: 'masai',
}

describe('verifyOtp — meaningful error messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // `db.update(...).set(...).where(...)` resolves by default (attempt bump / mark-used)
    hoisted.dbUpdate.mockReturnValue({
      set: () => ({ where: () => Promise.resolve() }),
    })
  })

  const cases: Array<{
    name: string
    record: Record<string, unknown> | null
    expectedCode: string
    expectedMessage: RegExp
  }> = [
    {
      name: 'unknown session',
      record: null,
      expectedCode: 'OTP_NOT_FOUND',
      expectedMessage: /no longer valid.*request a new one/i,
    },
    {
      name: 'already-used code',
      record: { ...validRecord, usedAt: PAST },
      expectedCode: 'OTP_ALREADY_USED',
      expectedMessage: /already been used/i,
    },
    {
      name: 'expired code',
      record: { ...validRecord, expiresAt: PAST },
      expectedCode: 'OTP_EXPIRED',
      expectedMessage: /expired/i,
    },
    {
      name: 'too many attempts',
      record: { ...validRecord, attempts: 5 },
      expectedCode: 'TOO_MANY_ATTEMPTS',
      expectedMessage: /too many incorrect attempts/i,
    },
  ]

  it.each(cases)(
    'returns $expectedCode for $name',
    async ({ record, expectedCode, expectedMessage }) => {
      const { verifyOtp, VerifyOtpError } = await import('../verifyOtp')
      mockOtpLookup(record ? [record] : [])

      const err = await verifyOtp({ otpSessionId: 's', otp: '123456' }).catch(
        (e) => e,
      )

      expect(err).toBeInstanceOf(VerifyOtpError)
      expect(err.code).toBe(expectedCode)
      expect(err.message).toMatch(expectedMessage)
    },
  )

  it('returns a friendly INVALID_OTP message and increments attempts on a wrong code', async () => {
    const { verifyOtp } = await import('../verifyOtp')
    mockOtpLookup([validRecord])
    hoisted.compare.mockResolvedValueOnce(false)

    const err = await verifyOtp({ otpSessionId: 's', otp: '000000' }).catch(
      (e) => e,
    )

    expect(err.code).toBe('INVALID_OTP')
    expect(err.message).toBe(
      'The code you entered is incorrect. Please check it and try again.',
    )
    expect(hoisted.dbUpdate).toHaveBeenCalledTimes(1) // attempts bumped
  })

  it('returns USER_NOT_FOUND when the code is valid but no account matches the identifier', async () => {
    const { verifyOtp } = await import('../verifyOtp')
    mockOtpLookup([validRecord])
    hoisted.compare.mockResolvedValueOnce(true)
    mockUserLookup([])

    const err = await verifyOtp({ otpSessionId: 's', otp: '123456' }).catch(
      (e) => e,
    )

    expect(err.code).toBe('USER_NOT_FOUND')
    expect(err.message).toMatch(/couldn't find an account/i)
  })

  it('returns the matched users on a correct code', async () => {
    const { verifyOtp } = await import('../verifyOtp')
    mockOtpLookup([validRecord])
    hoisted.compare.mockResolvedValueOnce(true)
    mockUserLookup([dbUser])

    await expect(
      verifyOtp({ otpSessionId: 's', otp: '123456' }),
    ).resolves.toEqual([dbUser])
  })
})
