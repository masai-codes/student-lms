import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('./publishVisibility', () => ({
  publishedClubCondition: () => 'published-condition',
}))
vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id' },
  clubMembers: {
    userId: 'club_members.user_id',
    clubId: 'club_members.club_id',
  },
  masaiverseLeaderboard: {
    userId: 'ml.user_id',
    points: 'ml.points',
    clubId: 'ml.club_id',
    createdAt: 'ml.created_at',
  },
  users: {
    id: 'users.id',
    name: 'users.name',
    profilePhotoPath: 'users.photo',
    role: 'users.role',
  },
}))

/** select().from().where().limit() — club lookup. */
const clubChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})

/** from().innerJoin().innerJoin().where().groupBy().orderBy().limit() — top board. */
function topChain(rows: unknown, onLimit?: (value: number) => void) {
  return {
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          where: () => ({
            groupBy: () => ({
              orderBy: () => ({
                limit: (value: number) => {
                  onLimit?.(value)
                  return Promise.resolve(rows)
                },
              }),
            }),
          }),
        }),
      }),
    }),
  }
}

/** from().innerJoin().innerJoin().where().groupBy() — the signed-in member's row. */
const meChain = (rows: unknown) => ({
  from: () => ({
    innerJoin: () => ({
      innerJoin: () => ({
        where: () => ({ groupBy: () => Promise.resolve(rows) }),
      }),
    }),
  }),
})

/**
 * from().innerJoin().innerJoin().where().groupBy().having() — members ranked
 * above. Joins `clubMembers` and `users` so admins are excluded from the count.
 */
const aboveChain = (rows: unknown) => ({
  from: () => ({
    innerJoin: () => ({
      innerJoin: () => ({
        where: () => ({
          groupBy: () => ({ having: () => Promise.resolve(rows) }),
        }),
      }),
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

async function load() {
  return (await import('../services/getClubLeaderboard.service'))
    .getClubLeaderboard
}

describe('getClubLeaderboard', () => {
  it('returns null for a non-finite club id without touching the db', async () => {
    const getClubLeaderboard = await load()
    await expect(
      getClubLeaderboard({ clubId: Number.NaN, currentUserId: 1 }),
    ).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no club matches the id', async () => {
    const getClubLeaderboard = await load()
    hoisted.dbSelect.mockReturnValueOnce(clubChain([]))
    await expect(
      getClubLeaderboard({ clubId: 99, currentUserId: 1 }),
    ).resolves.toBeNull()
  })

  it('ranks members and pins the current user when off the top', async () => {
    const getClubLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(clubChain([{ id: 5 }]))
      .mockReturnValueOnce(
        topChain([
          { userId: 10, name: 'Priya', avatarUrl: 'p.jpg', points: '940' },
          { userId: 20, name: 'Arjun', avatarUrl: null, points: null },
        ]),
      )
      .mockReturnValueOnce(
        meChain([{ name: 'Vidit', avatarUrl: null, points: '300' }]),
      )
      .mockReturnValueOnce(aboveChain([{ userId: 10 }, { userId: 20 }]))

    await expect(
      getClubLeaderboard({ clubId: 5, currentUserId: 99 }),
    ).resolves.toEqual({
      entries: [
        {
          rank: 1,
          userId: '10',
          name: 'Priya',
          avatarUrl: 'p.jpg',
          points: 940,
        },
        { rank: 2, userId: '20', name: 'Arjun', avatarUrl: null, points: 0 },
      ],
      currentUser: {
        rank: 3,
        userId: '99',
        name: 'Vidit',
        avatarUrl: null,
        points: 300,
      },
    })
  })

  it('returns a null current user when they have no club points', async () => {
    const getClubLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(clubChain([{ id: 5 }]))
      .mockReturnValueOnce(topChain([]))
      .mockReturnValueOnce(meChain([]))

    await expect(
      getClubLeaderboard({ clubId: 5, currentUserId: 99 }),
    ).resolves.toEqual({ entries: [], currentUser: null })
  })

  it('clamps a huge limit to the max', async () => {
    const getClubLeaderboard = await load()
    let captured = 0
    hoisted.dbSelect
      .mockReturnValueOnce(clubChain([{ id: 5 }]))
      .mockReturnValueOnce(topChain([], (value) => (captured = value)))
      .mockReturnValueOnce(meChain([]))
    await getClubLeaderboard({ clubId: 5, currentUserId: 1, limit: 1000 })
    expect(captured).toBe(50)
  })

  it('falls back to the default limit when it is not finite', async () => {
    const getClubLeaderboard = await load()
    let captured = 0
    hoisted.dbSelect
      .mockReturnValueOnce(clubChain([{ id: 5 }]))
      .mockReturnValueOnce(topChain([], (value) => (captured = value)))
      .mockReturnValueOnce(meChain([]))
    await getClubLeaderboard({ clubId: 5, currentUserId: 1, limit: Number.NaN })
    expect(captured).toBe(10)
  })

  it('applies the month period filter without error', async () => {
    const getClubLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(clubChain([{ id: 5 }]))
      .mockReturnValueOnce(topChain([]))
      .mockReturnValueOnce(meChain([]))
    await expect(
      getClubLeaderboard({ clubId: 5, currentUserId: 1, period: 'month' }),
    ).resolves.toEqual({ entries: [], currentUser: null })
  })
})
