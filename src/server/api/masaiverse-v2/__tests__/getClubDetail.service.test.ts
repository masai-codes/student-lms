import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id', name: 'clubs.name', image: 'clubs.image', meta: 'clubs.meta' },
  clubMembers: {
    id: 'club_members.id',
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
  },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return { from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }) }
}
/** `db.select().from().where()` */
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClubDetail', () => {
  it('returns null for a non-finite club id without touching the db', async () => {
    const { getClubDetail } = await import('../services/getClubDetail.service')
    await expect(getClubDetail(Number.NaN, 1)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no club matches the id', async () => {
    const { getClubDetail } = await import('../services/getClubDetail.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(getClubDetail(99, 1)).resolves.toBeNull()
  })

  it('maps a club with banner tags, live count and joined state', async () => {
    const { getClubDetail } = await import('../services/getClubDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            name: 'Programming Club',
            image: null,
            meta: {
              cardImageLink: 'https://cdn/c.png',
              clubDetailBannerSubtitle: 'Code. Build. Ship.',
              clubDetailBannerTags: ['Code · DSA · Projects', '', 'Tenure 4 · Active', 7],
            },
          },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ memberCount: 234 }]))
      .mockReturnValueOnce(limitChain([{ id: 11 }]))

    await expect(getClubDetail(5, 1)).resolves.toEqual({
      id: '5',
      name: 'Programming Club',
      imageUrl: 'https://cdn/c.png',
      bannerSubtitle: 'Code. Build. Ship.',
      bannerTags: ['Code · DSA · Projects', 'Tenure 4 · Active'],
      memberCount: 234,
      isJoined: true,
    })
  })

  it('falls back to belowTitleCardText and reports not-joined / no tags', async () => {
    const { getClubDetail } = await import('../services/getClubDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 6,
            name: 'Design Circle',
            image: 'https://cdn/fallback.png',
            meta: { belowTitleCardText: 'Make things' },
          },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ memberCount: 0 }]))
      .mockReturnValueOnce(limitChain([]))

    await expect(getClubDetail(6, 1)).resolves.toEqual({
      id: '6',
      name: 'Design Circle',
      imageUrl: 'https://cdn/fallback.png',
      bannerSubtitle: 'Make things',
      bannerTags: [],
      memberCount: 0,
      isJoined: false,
    })
  })
})
