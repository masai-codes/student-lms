import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  clubs: {
    id: 'clubs.id',
    name: 'clubs.name',
    image: 'clubs.image',
    meta: 'clubs.meta',
  },
  clubMembers: {
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
    joinedAt: 'club_members.joined_at',
  },
}))

function myClubsChain(rows: unknown) {
  return {
    from: () => ({
      innerJoin: () => ({
        where: () => ({ orderBy: () => Promise.resolve(rows) }),
      }),
    }),
  }
}

/** Admin-mode "all clubs" chain: `select().from(clubs).orderBy(...)`. */
function allClubsChain(rows: unknown) {
  return { from: () => ({ orderBy: () => Promise.resolve(rows) }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getMyClubs', () => {
  it('maps joined clubs, preferring meta.cardImageLink then clubs.image', async () => {
    const { getMyClubs } = await import('../services/getMyClubs.service')
    hoisted.dbSelect.mockReturnValueOnce(
      myClubsChain([
        {
          id: 1,
          name: 'Programming Club',
          image: 'img',
          meta: { cardImageLink: 'https://cdn/c.png' },
        },
        {
          id: 2,
          name: 'Design Circle',
          image: 'https://cdn/fallback.png',
          meta: null,
        },
        {
          id: 3,
          name: 'Robotics Lab',
          image: null,
          meta: { cardImageLink: '   ' },
        },
      ]),
    )

    await expect(getMyClubs(42)).resolves.toEqual([
      { id: '1', name: 'Programming Club', imageUrl: 'https://cdn/c.png' },
      { id: '2', name: 'Design Circle', imageUrl: 'https://cdn/fallback.png' },
      { id: '3', name: 'Robotics Lab', imageUrl: null },
    ])
  })

  it('returns an empty list when the user has no clubs', async () => {
    const { getMyClubs } = await import('../services/getMyClubs.service')
    hoisted.dbSelect.mockReturnValueOnce(myClubsChain([]))

    await expect(getMyClubs(7)).resolves.toEqual([])
  })

  it('returns every club (not just joined) in admin mode', async () => {
    const { getMyClubs } = await import('../services/getMyClubs.service')
    hoisted.dbSelect.mockReturnValueOnce(
      allClubsChain([
        {
          id: 5,
          name: 'Unjoined Club',
          image: null,
          meta: { cardImageLink: 'https://cdn/a.png' },
        },
        { id: 6, name: 'Draft Club', image: null, meta: null },
      ]),
    )

    await expect(getMyClubs(1, true)).resolves.toEqual([
      { id: '5', name: 'Unjoined Club', imageUrl: 'https://cdn/a.png' },
      { id: '6', name: 'Draft Club', imageUrl: null },
    ])
  })
})
