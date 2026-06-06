import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id', meta: 'clubs.meta' },
  clubMembers: { clubId: 'club_members.club_id', meta: 'club_members.meta' },
  eventEnrollments: {
    eventId: 'event_enrollments.event_id',
    meta: 'event_enrollments.meta',
  },
  events: { id: 'events.id', clubId: 'events.club_id' },
  posts: { id: 'posts.id', clubId: 'posts.club_id' },
  replies: { postId: 'replies.post_id' },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}
/** `db.select().from().where()` */
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}
/** `db.select().from().innerJoin().where()` */
function joinWhereChain(rows: unknown) {
  return {
    from: () => ({ innerJoin: () => ({ where: () => Promise.resolve(rows) }) }),
  }
}

const NOW = new Date('2026-06-04T10:00:00.000Z')

describe('getClubStats service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for a non-finite club id without touching the db', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    await expect(getClubStats(Number.NaN)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no club matches the id', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(getClubStats(99)).resolves.toBeNull()
  })

  it('aggregates the four stats, rounding the rating to one decimal', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: { projectsBuild: 91 } }]))
      .mockReturnValueOnce(whereChain([{ count: 234 }]))
      .mockReturnValueOnce(joinWhereChain([{ avgRating: '4.75' }]))
      .mockReturnValueOnce(whereChain([{ count: 30 }]))
      .mockReturnValueOnce(joinWhereChain([{ count: 61 }]))

    await expect(getClubStats(5, NOW)).resolves.toEqual({
      activeMembers: 234,
      avgEventRating: 4.8,
      projectsBuilt: 91,
      communityPosts: 91,
    })
  })

  it('coerces a string projectsBuild and reports null rating when unrated', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: { projectsBuild: '12' } }]))
      .mockReturnValueOnce(whereChain([{ count: 0 }]))
      .mockReturnValueOnce(joinWhereChain([{ avgRating: null }]))
      .mockReturnValueOnce(whereChain([{ count: 0 }]))
      .mockReturnValueOnce(joinWhereChain([{ count: 0 }]))

    await expect(getClubStats(6, NOW)).resolves.toEqual({
      activeMembers: 0,
      avgEventRating: null,
      projectsBuilt: 12,
      communityPosts: 0,
    })
  })

  it('reports a null rating when the average is non-numeric', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: {} }]))
      .mockReturnValueOnce(whereChain([{ count: 1 }]))
      .mockReturnValueOnce(joinWhereChain([{ avgRating: 'not-a-number' }]))
      .mockReturnValueOnce(whereChain([{ count: 2 }]))
      .mockReturnValueOnce(joinWhereChain([{ count: 3 }]))

    await expect(getClubStats(8, NOW)).resolves.toEqual({
      activeMembers: 1,
      avgEventRating: null,
      projectsBuilt: 0,
      communityPosts: 5,
    })
  })

  it('defaults projectsBuilt to 0 when meta is missing or invalid', async () => {
    const { getClubStats } = await import('../services/getClubStats.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([{ meta: { projectsBuild: 'abc' } }]))
      .mockReturnValueOnce(whereChain([]))
      .mockReturnValueOnce(joinWhereChain([]))
      .mockReturnValueOnce(whereChain([]))
      .mockReturnValueOnce(joinWhereChain([]))

    await expect(getClubStats(7, NOW)).resolves.toEqual({
      activeMembers: 0,
      avgEventRating: null,
      projectsBuilt: 0,
      communityPosts: 0,
    })
  })
})
