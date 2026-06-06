import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  masaiverseLeaderboard: { userId: 'ml.user_id', points: 'ml.points' },
  users: { id: 'users.id', name: 'users.name', profilePhotoPath: 'users.photo' },
}))

/** Resolves the `select().from().innerJoin().groupBy().orderBy().limit()` chain. */
function selectChain(rows: unknown) {
  return {
    from: () => ({
      innerJoin: () => ({
        groupBy: () => ({
          orderBy: () => ({ limit: () => Promise.resolve(rows) }),
        }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getGlobalLeaderboard', () => {
  it('ranks members by total points, coercing null/string sums', async () => {
    const { getGlobalLeaderboard } = await import(
      '../services/getGlobalLeaderboard.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { userId: 10, name: 'Priya', avatarUrl: 'p.jpg', points: '940' },
        { userId: 20, name: 'Arjun', avatarUrl: null, points: null },
      ]),
    )

    await expect(getGlobalLeaderboard()).resolves.toEqual([
      { rank: 1, userId: '10', name: 'Priya', avatarUrl: 'p.jpg', points: 940 },
      { rank: 2, userId: '20', name: 'Arjun', avatarUrl: null, points: 0 },
    ])
  })

  it('returns an empty list when nobody has points', async () => {
    const { getGlobalLeaderboard } = await import(
      '../services/getGlobalLeaderboard.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getGlobalLeaderboard()).resolves.toEqual([])
  })

  it('clamps a huge limit to the max', async () => {
    const { getGlobalLeaderboard } = await import(
      '../services/getGlobalLeaderboard.service'
    )
    let captured = 0
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: (value: number) => {
                captured = value
                return Promise.resolve([])
              },
            }),
          }),
        }),
      }),
    })
    await getGlobalLeaderboard(1000)
    expect(captured).toBe(50)
  })

  it('clamps a too-small limit up to 1', async () => {
    const { getGlobalLeaderboard } = await import(
      '../services/getGlobalLeaderboard.service'
    )
    let captured = 0
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: (value: number) => {
                captured = value
                return Promise.resolve([])
              },
            }),
          }),
        }),
      }),
    })
    await getGlobalLeaderboard(0)
    expect(captured).toBe(1)
  })

  it('falls back to the default limit when it is not a finite number', async () => {
    const { getGlobalLeaderboard } = await import(
      '../services/getGlobalLeaderboard.service'
    )
    let captured = 0
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: (value: number) => {
                captured = value
                return Promise.resolve([])
              },
            }),
          }),
        }),
      }),
    })
    await getGlobalLeaderboard(Number.NaN)
    expect(captured).toBe(10)
  })
})
