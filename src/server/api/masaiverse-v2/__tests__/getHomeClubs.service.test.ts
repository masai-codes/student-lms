import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  clubs: {
    id: 'clubs.id',
    name: 'clubs.name',
    image: 'clubs.image',
    meta: 'clubs.meta',
    createdAt: 'clubs.created_at',
  },
  clubMembers: {
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
    joinedAt: 'club_members.joined_at',
  },
  users: { id: 'users.id', name: 'users.name' },
}))

function clubsChain(rows: unknown) {
  return { from: () => ({ orderBy: () => Promise.resolve(rows) }) }
}
function countsChain(rows: unknown) {
  return { from: () => ({ groupBy: () => Promise.resolve(rows) }) }
}
function membersChain(rows: unknown) {
  return {
    from: () => ({ innerJoin: () => ({ orderBy: () => Promise.resolve(rows) }) }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getHomeClubs', () => {
  it('maps clubs with member counts and a capped name sample', async () => {
    const { getHomeClubs } = await import('../services/getHomeClubs.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        clubsChain([
          {
            id: 1,
            name: 'Programming Club',
            meta: {
              cardImageLink: 'https://cdn/club.png',
              belowTitleCardText: 'Code · DSA',
              cardDescription: 'Weekly stuff',
            },
          },
          { id: 2, name: 'Design Circle', meta: null },
        ]),
      )
      .mockReturnValueOnce(
        countsChain([
          { clubId: 1, memberCount: 428 },
          { clubId: 2, memberCount: 0 },
        ]),
      )
      .mockReturnValueOnce(
        membersChain([
          { clubId: 1, name: 'Aman Kumar' },
          { clubId: 1, name: 'Priya Rao' },
          { clubId: 1, name: 'Sam Niko' },
          { clubId: 1, name: 'Extra Person' },
        ]),
      )

    await expect(getHomeClubs()).resolves.toEqual([
      {
        id: '1',
        name: 'Programming Club',
        imageUrl: 'https://cdn/club.png',
        belowTitleCardText: 'Code · DSA',
        cardDescription: 'Weekly stuff',
        memberCount: 428,
        sampleMemberNames: ['Aman Kumar', 'Priya Rao', 'Sam Niko'],
      },
      {
        id: '2',
        name: 'Design Circle',
        imageUrl: null,
        belowTitleCardText: null,
        cardDescription: null,
        memberCount: 0,
        sampleMemberNames: [],
      },
    ])
  })

  it('returns an empty list (and skips member queries) when there are no clubs', async () => {
    const { getHomeClubs } = await import('../services/getHomeClubs.service')
    hoisted.dbSelect.mockReturnValueOnce(clubsChain([]))

    await expect(getHomeClubs()).resolves.toEqual([])
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })
})
