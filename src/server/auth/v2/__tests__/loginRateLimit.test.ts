import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  dbDelete: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert, delete: hoisted.dbDelete },
}))

vi.mock('@/db/schema', () => ({
  loginAttempts: {
    identifier: 'login_attempts.identifier',
    ipAddress: 'login_attempts.ip_address',
    attemptedAt: 'login_attempts.attempted_at',
  },
}))

/** `db.select().from().where()` resolving to the windowed rows. */
function selectRows(rows: Array<{ identifier: string; ipAddress: string | null }>) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

function row(identifier: string, ipAddress: string | null) {
  return { identifier, ipAddress }
}

describe('loginRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assertLoginAllowed', () => {
    it('allows when under the per-account cap', async () => {
      const { assertLoginAllowed } = await import('../loginRateLimit')
      hoisted.dbSelect.mockReturnValueOnce(
        selectRows(Array.from({ length: 4 }, () => row('a@x.com', '1.1.1.1'))),
      )

      await expect(assertLoginAllowed({ identifier: 'a@x.com' })).resolves.toBeUndefined()
    })

    it('blocks once an account hits the per-identifier cap (5)', async () => {
      const { assertLoginAllowed, LoginRateLimitError } = await import('../loginRateLimit')
      // 5 failures for this identifier in the window.
      hoisted.dbSelect.mockReturnValueOnce(
        selectRows(Array.from({ length: 5 }, () => row('a@x.com', '1.1.1.1'))),
      )

      await expect(assertLoginAllowed({ identifier: 'a@x.com' })).rejects.toBeInstanceOf(
        LoginRateLimitError,
      )
    })
  })

  it('recordFailedLogin inserts the identifier + ip', async () => {
    const { recordFailedLogin } = await import('../loginRateLimit')
    const values = vi.fn().mockResolvedValue(undefined)
    hoisted.dbInsert.mockReturnValueOnce({ values })

    await recordFailedLogin({ identifier: 'a@x.com', ip: '1.1.1.1' })

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'a@x.com', ipAddress: '1.1.1.1' }),
    )
  })

  it('recordFailedLogin stores null ip when none is available', async () => {
    const { recordFailedLogin } = await import('../loginRateLimit')
    const values = vi.fn().mockResolvedValue(undefined)
    hoisted.dbInsert.mockReturnValueOnce({ values })

    await recordFailedLogin({ identifier: 'a@x.com', ip: '' })

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: null }))
  })

  it('clearLoginAttempts deletes for the identifier', async () => {
    const { clearLoginAttempts } = await import('../loginRateLimit')
    const where = vi.fn().mockResolvedValue(undefined)
    hoisted.dbDelete.mockReturnValueOnce({ where })

    await clearLoginAttempts('a@x.com')

    expect(hoisted.dbDelete).toHaveBeenCalledTimes(1)
    expect(where).toHaveBeenCalledTimes(1)
  })
})
