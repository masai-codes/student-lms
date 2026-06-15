import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  learners: vi.fn(),
  discussions: vi.fn(),
  events: vi.fn(),
  registrations: vi.fn(),
  homeEvents: vi.fn(),
  highlights: vi.fn(),
  homeClubs: vi.fn(),
  memberClubIds: vi.fn(),
  communityDiscussions: vi.fn(),
}))

vi.mock('../services/getCommunityLearnerCount.service', () => ({
  getCommunityLearnerCount: hoisted.learners,
}))
vi.mock('../services/getDiscussionsThisMonthCount.service', () => ({
  getDiscussionsThisMonthCount: hoisted.discussions,
}))
vi.mock('../services/getEventsThisYearCount.service', () => ({
  getEventsThisYearCount: hoisted.events,
}))
vi.mock('../services/getEventRegistrationsThisYearCount.service', () => ({
  getEventRegistrationsThisYearCount: hoisted.registrations,
}))
vi.mock('../services/getHomeEvents.service', () => ({
  getHomeEvents: hoisted.homeEvents,
}))
vi.mock('../services/getHomeHighlights.service', () => ({
  getHomeHighlights: hoisted.highlights,
}))
vi.mock('../services/getHomeClubs.service', () => ({
  getHomeClubs: hoisted.homeClubs,
}))
vi.mock('../services/getMemberClubIds.service', () => ({
  getMemberClubIds: hoisted.memberClubIds,
}))
vi.mock('../services/getCommunityDiscussions.service', () => ({
  getCommunityDiscussions: hoisted.communityDiscussions,
}))

describe('getMasaiverseV2Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('composes section-one stats and section-two events', async () => {
    const { getMasaiverseV2Home } = await import(
      '../getMasaiverseV2Home.service'
    )
    hoisted.learners.mockResolvedValueOnce(2841)
    hoisted.discussions.mockResolvedValueOnce(38)
    hoisted.events.mockResolvedValueOnce(6)
    hoisted.registrations.mockResolvedValueOnce(124)
    hoisted.homeEvents.mockResolvedValueOnce([{ id: '12', title: 'Sprint' }])
    hoisted.highlights.mockResolvedValueOnce([{ id: '11', title: 'Recap' }])
    hoisted.homeClubs.mockResolvedValueOnce([{ id: '1', name: 'Programming' }])
    hoisted.memberClubIds.mockResolvedValueOnce([3, 9])
    hoisted.communityDiscussions.mockResolvedValueOnce({
      discussions: [{ id: 'd1', title: 'Latest' }],
      hasMore: true,
    })

    await expect(getMasaiverseV2Home(7)).resolves.toEqual({
      stats: {
        learnersInCommunity: 2841,
        discussionsThisMonth: 38,
        eventsThisYear: 6,
        eventRegistrationsThisYear: 124,
      },
      events: [{ id: '12', title: 'Sprint' }],
      highlights: [{ id: '11', title: 'Recap' }],
      clubs: [{ id: '1', name: 'Programming' }],
      discussions: [{ id: 'd1', title: 'Latest' }],
    })
  })

  it('passes the same `now` to every time-bounded service', async () => {
    const { getMasaiverseV2Home } = await import(
      '../getMasaiverseV2Home.service'
    )
    hoisted.learners.mockResolvedValueOnce(0)
    hoisted.discussions.mockResolvedValueOnce(0)
    hoisted.events.mockResolvedValueOnce(0)
    hoisted.registrations.mockResolvedValueOnce(0)
    hoisted.homeEvents.mockResolvedValueOnce([])
    hoisted.highlights.mockResolvedValueOnce([])
    hoisted.homeClubs.mockResolvedValueOnce([])
    hoisted.memberClubIds.mockResolvedValueOnce([3, 9])
    hoisted.communityDiscussions.mockResolvedValueOnce({
      discussions: [],
      hasMore: false,
    })
    const now = new Date('2026-06-03T12:00:00Z')

    await getMasaiverseV2Home(7, now)

    expect(hoisted.memberClubIds).toHaveBeenCalledWith(7)
    expect(hoisted.discussions).toHaveBeenCalledWith(now)
    expect(hoisted.events).toHaveBeenCalledWith(now, false)
    expect(hoisted.registrations).toHaveBeenCalledWith(now)
    // Home now scopes events to public + the member's joined clubs, and passes
    // the publish-visibility flag (false for a non-admin) to every event read.
    expect(hoisted.homeEvents).toHaveBeenCalledWith(
      now,
      { visibleClubIds: [3, 9] },
      7,
      false,
    )
    expect(hoisted.highlights).toHaveBeenCalledWith(
      now,
      { visibleClubIds: [3, 9] },
      false,
    )
  })
})
