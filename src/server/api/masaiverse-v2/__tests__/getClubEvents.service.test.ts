import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getClubWeeklyConnects: vi.fn(),
  getHomeEvents: vi.fn(),
  getHomeHighlights: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({ clubs: { id: 'clubs.id' } }))
vi.mock('../services/getClubWeeklyConnects.service', () => ({
  getClubWeeklyConnects: hoisted.getClubWeeklyConnects,
}))
vi.mock('../services/getHomeEvents.service', () => ({
  getHomeEvents: hoisted.getHomeEvents,
}))
vi.mock('../services/getHomeHighlights.service', () => ({
  getHomeHighlights: hoisted.getHomeHighlights,
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

const NOW = new Date('2026-06-03T12:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClubEvents', () => {
  it('returns null for a non-finite club id without touching the db', async () => {
    const { getClubEvents } = await import('../services/getClubEvents.service')
    await expect(getClubEvents(Number.NaN, NOW)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no club matches the id', async () => {
    const { getClubEvents } = await import('../services/getClubEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(getClubEvents(99, NOW)).resolves.toBeNull()
    expect(hoisted.getClubWeeklyConnects).not.toHaveBeenCalled()
  })

  it('aggregates weekly connects, upcoming, and past sections', async () => {
    const { getClubEvents } = await import('../services/getClubEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([{ id: 5 }]))
    hoisted.getClubWeeklyConnects.mockResolvedValueOnce([{ id: 'w1' }])
    hoisted.getHomeEvents.mockResolvedValueOnce([{ id: 'e1' }])
    hoisted.getHomeHighlights.mockResolvedValueOnce([{ id: 'h1' }])

    await expect(getClubEvents(5, NOW)).resolves.toEqual({
      weeklyConnects: [{ id: 'w1' }],
      upcoming: [{ id: 'e1' }],
      past: [{ id: 'h1' }],
    })

    expect(hoisted.getClubWeeklyConnects).toHaveBeenCalledWith(5, false)
    expect(hoisted.getHomeEvents).toHaveBeenCalledWith(
      NOW,
      { clubId: 5, weeklyConnect: 'exclude' },
      undefined,
      false,
    )
    expect(hoisted.getHomeHighlights).toHaveBeenCalledWith(
      NOW,
      { clubId: 5, weeklyConnect: 'exclude' },
      false,
    )
  })
})
