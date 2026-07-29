import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  userRows: new Array<Record<string, unknown>>(),
  membershipRows: new Array<Record<string, unknown>>(),
  lastSql: '',
}))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(hoisted.membershipRows),
    execute: (query: { queryChunks?: Array<unknown> }) => {
      // drizzle's `sql` template keeps its literal chunks; good enough to assert
      // the shape of the profiles join.
      hoisted.lastSql = JSON.stringify(query)
      return Promise.resolve(hoisted.userRows)
    },
  }
  return { db: chain }
})

const BASE_ROW = {
  id: 42,
  name: 'Suryakumar',
  email: 'sky@example.com',
  mobile: '9000000000',
  role: 'student',
  status: 'active',
  profileImage: null,
  newLmsPagesEnabled: null,
  tryNewTourSeen: null,
}

describe('loadUserWithStatusById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.userRows = [{ ...BASE_ROW }]
    hoisted.membershipRows = []
    hoisted.lastSql = ''
  })

  it('maps the user row and keeps status for the deactivation gate', async () => {
    hoisted.userRows = [{ ...BASE_ROW, status: 'disabled' }]
    const { loadUserWithStatusById } = await import('../loadUserById')

    expect(await loadUserWithStatusById(42)).toEqual({
      id: 42,
      name: 'Suryakumar',
      email: 'sky@example.com',
      mobile: '9000000000',
      role: 'student',
      status: 'disabled',
      profileImageUrl: null,
      newLmsPagesEnabled: false,
      hasSeenTryNewTour: false,
    })
  })

  it('returns null when the user row is missing', async () => {
    hoisted.userRows = []
    const { loadUserWithStatusById } = await import('../loadUserById')

    expect(await loadUserWithStatusById(42)).toBeNull()
  })

  it('resolves the latest profile with a correlated subquery, not a full-table GROUP BY', async () => {
    const { loadUserWithStatusById } = await import('../loadUserById')
    await loadUserWithStatusById(42)

    expect(hoisted.lastSql).toContain('p.user_id = u.id')
    expect(hoisted.lastSql).not.toContain('GROUP BY user_id')
  })

  it.each([
    [true, true],
    [1, true],
    ['true', true],
    [0, false],
    [null, false],
  ])('coerces the JSON meta flag %s to %s', async (raw, expected) => {
    hoisted.userRows = [
      { ...BASE_ROW, newLmsPagesEnabled: raw, tryNewTourSeen: raw },
    ]
    const { loadUserWithStatusById } = await import('../loadUserById')
    const user = await loadUserWithStatusById(42)

    expect(user?.newLmsPagesEnabled).toBe(expected)
    expect(user?.hasSeenTryNewTour).toBe(expected)
  })

  it('trims a blank profile image down to null and stringifies the joined club id', async () => {
    hoisted.userRows = [{ ...BASE_ROW, profileImage: '   ' }]
    hoisted.membershipRows = [{ clubId: 7 }]
    const { loadUserWithStatusById } = await import('../loadUserById')
    const user = await loadUserWithStatusById(42)

    expect(user?.profileImageUrl).toBeNull()
  })

  it('keeps a real profile image url', async () => {
    hoisted.userRows = [
      { ...BASE_ROW, profileImage: ' https://cdn.example.com/a.png ' },
    ]
    const { loadUserWithStatusById } = await import('../loadUserById')

    expect((await loadUserWithStatusById(42))?.profileImageUrl).toBe(
      'https://cdn.example.com/a.png',
    )
  })

  it.each([
    ['a nested driver tuple', [[{ ...BASE_ROW }], []]],
    ['a { rows } result', { rows: [{ ...BASE_ROW }] }],
    ['an unrecognised shape', undefined],
  ])('normalises %s', async (_label, result) => {
    hoisted.userRows = result as unknown as Array<Record<string, unknown>>
    const { loadUserWithStatusById } = await import('../loadUserById')
    const user = await loadUserWithStatusById(42)

    if (result === undefined) expect(user).toBeNull()
    else expect(user?.id).toBe(42)
  })
})

describe('loadUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.userRows = [{ ...BASE_ROW }]
    hoisted.membershipRows = []
  })

  it('never exposes users.status to callers that ship the payload to the client', async () => {
    const { loadUserById } = await import('../loadUserById')
    const user = await loadUserById(42)

    expect(user).not.toBeNull()
    expect(user).not.toHaveProperty('status')
    expect(user?.id).toBe(42)
  })

  it('returns null when the user row is missing', async () => {
    hoisted.userRows = []
    const { loadUserById } = await import('../loadUserById')

    expect(await loadUserById(42)).toBeNull()
  })
})
