import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id' },
  clubMembers: {
    userId: 'club_members.user_id',
    clubId: 'club_members.club_id',
  },
  eventEnrollments: {
    userId: 'event_enrollments.user_id',
    eventId: 'event_enrollments.event_id',
  },
  events: { id: 'events.id', clubId: 'events.club_id' },
  masaiverseLeaderboard: {
    userId: 'ml.user_id',
    points: 'ml.points',
    clubId: 'ml.club_id',
  },
  posts: { userId: 'posts.user_id', clubId: 'posts.club_id' },
  users: {
    id: 'users.id',
    name: 'users.name',
    profilePhotoPath: 'users.photo',
  },
}))

const limitChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
})
const joinWhereChain = (rows: unknown) => ({
  from: () => ({ innerJoin: () => ({ where: () => Promise.resolve(rows) }) }),
})
const rankedChain = (rows: unknown) => ({
  from: () => ({
    innerJoin: () => ({
      innerJoin: () => ({
        where: () => ({
          groupBy: () => ({
            orderBy: () => ({
              limit: () => ({ offset: () => Promise.resolve(rows) }),
            }),
          }),
        }),
      }),
    }),
  }),
})
const groupByChain = (rows: unknown) => ({
  from: () => ({ where: () => ({ groupBy: () => Promise.resolve(rows) }) }),
})
const joinGroupByChain = (rows: unknown) => ({
  from: () => ({
    innerJoin: () => ({
      where: () => ({ groupBy: () => Promise.resolve(rows) }),
    }),
  }),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClubLeaderboard', () => {
  it('returns null for a non-finite club id without touching the db', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    await expect(getClubLeaderboard(Number.NaN)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no club matches the id', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(getClubLeaderboard(99)).resolves.toBeNull()
  })

  it('ranks members with club-scoped points, paginated with hasMore', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(joinWhereChain([{ total: 7 }]))
      .mockReturnValueOnce(
        rankedChain([
          { userId: 10, name: 'Priya', avatarUrl: 'p.jpg', points: '940' },
          { userId: 20, name: 'Arjun', avatarUrl: null, points: '820' },
          { userId: 30, name: 'Nisha', avatarUrl: null, points: '710' },
        ]),
      )
      .mockReturnValueOnce(groupByChain([{ userId: 10, total: 4 }]))
      .mockReturnValueOnce(
        joinGroupByChain([
          { userId: 10, total: 8 },
          { userId: 20, total: 2 },
        ]),
      )

    await expect(getClubLeaderboard(5, 0, 2)).resolves.toEqual({
      page: 0,
      perPage: 2,
      total: 7,
      hasMore: true,
      entries: [
        {
          rank: 1,
          userId: '10',
          name: 'Priya',
          avatarUrl: 'p.jpg',
          points: 940,
          postsCount: 4,
          eventsCount: 8,
        },
        {
          rank: 2,
          userId: '20',
          name: 'Arjun',
          avatarUrl: null,
          points: 820,
          postsCount: 0,
          eventsCount: 2,
        },
      ],
    })
  })

  it('returns an empty page when the club has no ranked members', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(joinWhereChain([]))
      .mockReturnValueOnce(rankedChain([]))

    await expect(getClubLeaderboard(5, 0, 2)).resolves.toEqual({
      page: 0,
      perPage: 2,
      total: 0,
      hasMore: false,
      entries: [],
    })
  })

  it('clamps a later page with a too-large/too-small per_page and defaults missing counts', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(joinWhereChain([{ total: 3 }]))
      .mockReturnValueOnce(
        rankedChain([
          { userId: 30, name: 'Nisha', avatarUrl: null, points: null },
        ]),
      )
      .mockReturnValueOnce(groupByChain([]))
      .mockReturnValueOnce(joinGroupByChain([]))

    // page 2, per_page 0 → clamped to 1; rank carries the page offset (2*1+1).
    await expect(getClubLeaderboard(5, 2, 0)).resolves.toEqual({
      page: 2,
      perPage: 1,
      total: 3,
      hasMore: false,
      entries: [
        {
          rank: 3,
          userId: '30',
          name: 'Nisha',
          avatarUrl: null,
          points: 0,
          postsCount: 0,
          eventsCount: 0,
        },
      ],
    })
  })

  it('clamps a huge per_page to the max', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(joinWhereChain([{ total: 0 }]))
      .mockReturnValueOnce(rankedChain([]))

    const result = await getClubLeaderboard(5, 0, 1000)
    expect(result?.perPage).toBe(50)
  })

  it('falls back to the default per_page when it is not a finite number', async () => {
    const { getClubLeaderboard } =
      await import('../services/getClubLeaderboard.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ id: 5 }]))
      .mockReturnValueOnce(joinWhereChain([]))
      .mockReturnValueOnce(rankedChain([]))

    const result = await getClubLeaderboard(5, 0, Number.NaN)
    expect(result?.perPage).toBe(5)
  })
})
