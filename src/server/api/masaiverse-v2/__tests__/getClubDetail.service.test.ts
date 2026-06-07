import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getClubStats: vi.fn(),
  getClubEvents: vi.fn(),
  getClubLeaderboard: vi.fn(),
  getCommunityDiscussions: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  clubs: { id: 'clubs.id', name: 'clubs.name', image: 'clubs.image', meta: 'clubs.meta' },
  clubMembers: {
    id: 'club_members.id',
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
  },
}))

// The detail service embeds these sections; stub the sub-services so this unit
// test stays focused on the club mapping (and so their module-level `sql`
// templates don't need the full schema mock).
const MOCK_STATS = {
  activeMembers: 3,
  avgEventRating: 4.5,
  projectsBuilt: 2,
  communityPosts: 10,
}
const MOCK_EVENTS = { weeklyConnects: [], upcoming: [], past: [] }
const MOCK_LEADERBOARD = {
  entries: [],
  page: 0,
  perPage: 5,
  total: 0,
  hasMore: false,
}
vi.mock('../services/getClubStats.service', () => ({
  getClubStats: hoisted.getClubStats,
}))
vi.mock('../services/getClubEvents.service', () => ({
  getClubEvents: hoisted.getClubEvents,
}))
vi.mock('../services/getClubLeaderboard.service', () => ({
  getClubLeaderboard: hoisted.getClubLeaderboard,
}))
vi.mock('../services/getCommunityDiscussions.service', () => ({
  getCommunityDiscussions: hoisted.getCommunityDiscussions,
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return { from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }) }
}
/** `db.select().from().where()` */
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

const EMPTY_LEADERBOARD = {
  entries: [],
  page: 0,
  perPage: 5,
  total: 0,
  hasMore: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getClubStats.mockResolvedValue(MOCK_STATS)
  hoisted.getClubEvents.mockResolvedValue(MOCK_EVENTS)
  hoisted.getClubLeaderboard.mockResolvedValue(MOCK_LEADERBOARD)
  hoisted.getCommunityDiscussions.mockResolvedValue({
    discussions: [],
    hasMore: false,
  })
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
              description: 'The technical heartbeat of MasaiVerse.',
              aboutCardDetails: [
                { heading: 'Founded', value: 'September 2023' },
                { heading: 'Meeting Cadence', value: '3× per week' },
                { heading: '', value: 'dropped: no heading' },
                { heading: 'Open To', value: '' },
                'not-an-object',
                null,
              ],
              learningTenureDateText: '20-26 June',
              learningTenureData: [
                {
                  emoji: '⚡',
                  heading: 'Heading 1',
                  text: 'Text 1',
                  tags: ['12 sessions', ''],
                },
                { heading: 'Heading 2', tags: 'not-a-list' },
                { emoji: '🌐', text: 'no heading dropped' },
                'not-an-object',
              ],
              galleryImages: ['https://cdn/p1.jpg', '', 'https://cdn/p2.jpg', 7],
              confirmationModalText: '  By joining you agree to the **code of conduct**.  ',
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
      aboutDescription: 'The technical heartbeat of MasaiVerse.',
      aboutDetails: [
        { heading: 'Founded', value: 'September 2023' },
        { heading: 'Meeting Cadence', value: '3× per week' },
      ],
      learningTenureDateText: '20-26 June',
      learningTenure: [
        {
          emoji: '⚡',
          heading: 'Heading 1',
          text: 'Text 1',
          tags: ['12 sessions'],
        },
        { emoji: null, heading: 'Heading 2', text: null, tags: [] },
      ],
      galleryImages: ['https://cdn/p1.jpg', 'https://cdn/p2.jpg'],
      memberCount: 234,
      isJoined: true,
      confirmationModalText: 'By joining you agree to the **code of conduct**.',
      stats: MOCK_STATS,
      events: MOCK_EVENTS,
      leaderboard: MOCK_LEADERBOARD,
      discussions: [],
    })
    // Members get the gated sections fetched and embedded.
    expect(hoisted.getClubEvents).toHaveBeenCalledTimes(1)
    expect(hoisted.getClubLeaderboard).toHaveBeenCalledWith(5, 0, 5)
    expect(hoisted.getCommunityDiscussions).toHaveBeenCalledWith(1, 0, 5, '', '5')
  })

  it('withholds member-only sections for a non-member (blur teaser)', async () => {
    const { getClubDetail } = await import('../services/getClubDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([{ id: 7, name: 'Robotics', image: null, meta: {} }]),
      )
      .mockReturnValueOnce(whereChain([{ memberCount: 12 }]))
      .mockReturnValueOnce(limitChain([])) // no membership row

    const detail = await getClubDetail(7, 1)

    expect(detail).toMatchObject({
      isJoined: false,
      // Stats stay visible to everyone…
      stats: MOCK_STATS,
      // …but the gated sections come back empty.
      events: { weeklyConnects: [], upcoming: [], past: [] },
      leaderboard: EMPTY_LEADERBOARD,
      discussions: [],
    })
    // Their services are never even invoked for a non-member.
    expect(hoisted.getClubEvents).not.toHaveBeenCalled()
    expect(hoisted.getClubLeaderboard).not.toHaveBeenCalled()
    expect(hoisted.getCommunityDiscussions).not.toHaveBeenCalled()
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
      aboutDescription: null,
      aboutDetails: [],
      learningTenureDateText: null,
      learningTenure: [],
      galleryImages: [],
      memberCount: 0,
      isJoined: false,
      confirmationModalText: null,
      stats: MOCK_STATS,
      // Non-member: gated sections withheld (see the dedicated test above).
      events: { weeklyConnects: [], upcoming: [], past: [] },
      leaderboard: EMPTY_LEADERBOARD,
      discussions: [],
    })
  })
})
