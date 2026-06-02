import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  learners: vi.fn(),
  discussions: vi.fn(),
  events: vi.fn(),
  registrations: vi.fn(),
  homeEvents: vi.fn(),
}))

vi.mock('../services/getCommunityLearnerCount.service', () => ({
  getCommunityLearnerCount: hoisted.learners,
}))
vi.mock('../services/getDiscussionsThisWeekCount.service', () => ({
  getDiscussionsThisWeekCount: hoisted.discussions,
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

    await expect(getMasaiverseV2Home(7)).resolves.toEqual({
      stats: {
        learnersInCommunity: 2841,
        discussionsThisWeek: 38,
        eventsThisYear: 6,
        eventRegistrationsThisYear: 124,
      },
      events: [{ id: '12', title: 'Sprint' }],
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
    const now = new Date('2026-06-03T12:00:00Z')

    await getMasaiverseV2Home(7, now)

    expect(hoisted.discussions).toHaveBeenCalledWith(now)
    expect(hoisted.events).toHaveBeenCalledWith(now)
    expect(hoisted.registrations).toHaveBeenCalledWith(now)
    expect(hoisted.homeEvents).toHaveBeenCalledWith(now)
  })
})
