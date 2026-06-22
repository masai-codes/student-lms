import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  compare: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('bcryptjs', () => ({
  compare: hoisted.compare,
}))

// Mirrors `db.select({...}).from(users).where(eq(...)).limit(1)`.
function mockUserLookup(rows: Array<Record<string, unknown>>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

const dbUser = {
  id: 7,
  name: 'Asha',
  email: 'asha@example.com',
  mobile: '9999999999',
  role: 'student',
  client: 'masai',
  password: '$2a$10$hashedpassword',
}

describe('loginWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws a meaningful USER_NOT_FOUND (not a raw/null error) when no account matches', async () => {
    const { loginWithPassword, LoginError } = await import('../loginWithPassword')
    mockUserLookup([])

    const err = await loginWithPassword({ email: 'ghost@example.com', password: 'x' }).catch(
      (e) => e,
    )

    expect(err).toBeInstanceOf(LoginError)
    expect(err.code).toBe('USER_NOT_FOUND')
    expect(err.message).toBe(
      "We couldn't find an account with that email address. Please check it and try again, or sign up.",
    )
    expect(hoisted.compare).not.toHaveBeenCalled()
  })

  it('asks the user to reset when the stored password is blank', async () => {
    const { loginWithPassword, LoginError } = await import('../loginWithPassword')
    mockUserLookup([{ ...dbUser, password: '   ' }])

    const err = await loginWithPassword({ email: dbUser.email, password: 'x' }).catch((e) => e)

    expect(err).toBeInstanceOf(LoginError)
    expect(err.code).toBe('PASSWORD_RESET_REQUIRED')
    expect(err.message).toMatch(/reset your password/i)
  })

  it('returns a friendly INCORRECT_CREDENTIALS message when the password does not match', async () => {
    const { loginWithPassword, LoginError } = await import('../loginWithPassword')
    mockUserLookup([dbUser])
    hoisted.compare.mockResolvedValueOnce(false)

    const err = await loginWithPassword({ email: dbUser.email, password: 'wrong' }).catch((e) => e)

    expect(err).toBeInstanceOf(LoginError)
    expect(err.code).toBe('INCORRECT_CREDENTIALS')
    expect(err.message).toBe('The password you entered is incorrect. Please try again.')
  })

  it('normalizes the email and returns the authenticated user on a correct password', async () => {
    const { loginWithPassword } = await import('../loginWithPassword')
    mockUserLookup([dbUser])
    hoisted.compare.mockResolvedValueOnce(true)

    const user = await loginWithPassword({ email: '  ASHA@Example.com ', password: 'right' })

    expect(user).toEqual({
      id: 7,
      name: 'Asha',
      email: 'asha@example.com',
      mobile: '9999999999',
      role: 'student',
      client: 'masai',
    })
    // password is never echoed back to callers
    expect(user).not.toHaveProperty('password')
  })
})
