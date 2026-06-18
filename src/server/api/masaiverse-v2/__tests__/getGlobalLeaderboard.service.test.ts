import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  masaiverseLeaderboard: {
    userId: 'ml.user_id',
    points: 'ml.points',
    createdAt: 'ml.created_at',
  },
  users: {
    id: 'users.id',
    name: 'users.name',
    profilePhotoPath: 'users.photo',
  },
}))

/** select().from().innerJoin().where().groupBy().orderBy().limit() — top board. */
function topChain(rows: unknown, onLimit?: (value: number) => void) {
  return {
    from: () => ({
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
  }
}

/** select().from().innerJoin().where().groupBy() — the signed-in member's row. */
const meChain = (rows: unknown) => ({
  from: () => ({
    innerJoin: () => ({
      where: () => ({ groupBy: () => Promise.resolve(rows) }),
    }),
  }),
})

/** select().from().where().groupBy().having() — members ranked above. */
const aboveChain = (rows: unknown) => ({
  from: () => ({
    where: () => ({ groupBy: () => ({ having: () => Promise.resolve(rows) }) }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

async function load() {
  return (await import('../services/getGlobalLeaderboard.service'))
    .getGlobalLeaderboard
}

describe('getGlobalLeaderboard', () => {
  it('ranks the top members and resolves the current user when off the top', async () => {
    const getGlobalLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(
        topChain([
          { userId: 10, name: 'Priya', avatarUrl: 'p.jpg', points: '940' },
          { userId: 20, name: 'Arjun', avatarUrl: null, points: null },
        ]),
      )
      .mockReturnValueOnce(
        meChain([{ name: 'Vidit', avatarUrl: 'v.jpg', points: '120' }]),
      )
      // Three members rank strictly above the current user → rank 4.
      .mockReturnValueOnce(
        aboveChain([{ userId: 10 }, { userId: 20 }, { userId: 30 }]),
      )

    await expect(getGlobalLeaderboard({ currentUserId: 99 })).resolves.toEqual({
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
        rank: 4,
        userId: '99',
        name: 'Vidit',
        avatarUrl: 'v.jpg',
        points: 120,
      },
    })
  })

  it('returns a null current user when they have earned no points', async () => {
    const getGlobalLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([]))
      .mockReturnValueOnce(meChain([]))

    await expect(getGlobalLeaderboard({ currentUserId: 99 })).resolves.toEqual({
      entries: [],
      currentUser: null,
    })
  })

  it('coerces a null current-user sum to 0 points', async () => {
    const getGlobalLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([]))
      .mockReturnValueOnce(
        meChain([{ name: 'Vidit', avatarUrl: null, points: null }]),
      )
      .mockReturnValueOnce(aboveChain([]))

    const result = await getGlobalLeaderboard({ currentUserId: 99 })
    expect(result.currentUser).toEqual({
      rank: 1,
      userId: '99',
      name: 'Vidit',
      avatarUrl: null,
      points: 0,
    })
  })

  it('clamps a huge limit to the max', async () => {
    const getGlobalLeaderboard = await load()
    let captured = 0
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([], (value) => (captured = value)))
      .mockReturnValueOnce(meChain([]))
    await getGlobalLeaderboard({ currentUserId: 1, limit: 1000 })
    expect(captured).toBe(50)
  })

  it('clamps a too-small limit up to 1', async () => {
    const getGlobalLeaderboard = await load()
    let captured = 0
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([], (value) => (captured = value)))
      .mockReturnValueOnce(meChain([]))
    await getGlobalLeaderboard({ currentUserId: 1, limit: 0 })
    expect(captured).toBe(1)
  })

  it('falls back to the default limit when it is not a finite number', async () => {
    const getGlobalLeaderboard = await load()
    let captured = 0
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([], (value) => (captured = value)))
      .mockReturnValueOnce(meChain([]))
    await getGlobalLeaderboard({ currentUserId: 1, limit: Number.NaN })
    expect(captured).toBe(10)
  })

  it('applies the month period filter without error', async () => {
    const getGlobalLeaderboard = await load()
    hoisted.dbSelect
      .mockReturnValueOnce(topChain([]))
      .mockReturnValueOnce(meChain([]))
    await expect(
      getGlobalLeaderboard({ currentUserId: 1, period: 'month' }),
    ).resolves.toEqual({ entries: [], currentUser: null })
  })
})
