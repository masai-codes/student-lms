import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    clubId: 'events.club_id',
    title: 'events.title',
    description: 'events.description',
    category: 'events.category',
    mode: 'events.mode',
    locationTitle: 'events.location_title',
    locationMapLink: 'events.location_map_link',
    eventLink: 'events.event_link',
    imageLink: 'events.image_link',
    platform: 'events.platform',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
    meta: 'events.meta',
  },
  clubs: { id: 'clubs.id', name: 'clubs.name' },
  eventEnrollments: {
    id: 'event_enrollments.id',
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
    meta: 'event_enrollments.meta',
  },
}))

/** `db.select().from().leftJoin().where().limit()` */
function rowChain(rows: unknown) {
  return {
    from: () => ({
      leftJoin: () => ({
        where: () => ({ limit: () => Promise.resolve(rows) }),
      }),
    }),
  }
}

/** `db.select().from().where()` (awaited directly — the count query). */
function countChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

/** `db.select().from().where().limit()` (the enrollment lookup). */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

const NOW = new Date('2026-06-03T12:00:00Z')

function eventRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    clubId: 3,
    title: 'Build Sprint',
    description: 'A weekend hackathon.',
    category: 'hackathon',
    mode: 'offline',
    locationTitle: 'Masai HQ',
    locationMapLink: 'https://maps.example/hq',
    eventLink: 'https://meet.example/sprint',
    imageLink: 'https://cdn/sprint.png',
    platform: 'Google Meet',
    startTime: '2026-06-10 09:00:00',
    endTime: '2026-06-10 17:00:00',
    meta: { aboveTitle: 'WEEKLY', belowTitle: '48 teams', isWeeklyConnect: true },
    clubName: 'Programming Club',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getEventDetail', () => {
  it('returns null for a non-finite event id without touching the db', async () => {
    const { getEventDetail } = await import('../services/getEventDetail.service')
    await expect(getEventDetail(Number.NaN, 1, NOW)).resolves.toBeNull()
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('returns null when no event matches the id', async () => {
    const { getEventDetail } = await import('../services/getEventDetail.service')
    hoisted.dbSelect.mockReturnValueOnce(rowChain([]))
    await expect(getEventDetail(99, 1, NOW)).resolves.toBeNull()
    // Only the row lookup runs; count/enrollment are skipped.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })

  it('maps a full event row, including meta, club name and enrollment', async () => {
    const { getEventDetail } = await import('../services/getEventDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(rowChain([eventRow()]))
      .mockReturnValueOnce(countChain([{ enrolledCount: 12 }]))
      .mockReturnValueOnce(limitChain([{ id: 1, meta: null }]))

    await expect(getEventDetail(7, 1, NOW)).resolves.toEqual({
      id: '7',
      title: 'Build Sprint',
      description: 'A weekend hackathon.',
      imageUrl: 'https://cdn/sprint.png',
      category: 'hackathon',
      mode: 'offline',
      eventLink: 'https://meet.example/sprint',
      locationTitle: 'Masai HQ',
      locationMapLink: 'https://maps.example/hq',
      platform: 'Google Meet',
      startTime: '2026-06-10T09:00:00.000Z',
      endTime: '2026-06-10T17:00:00.000Z',
      aboveTitle: 'WEEKLY',
      belowTitle: '48 teams',
      isWeeklyConnect: true,
      clubId: '3',
      clubName: 'Programming Club',
      status: 'upcoming',
      isEnrolled: true,
      enrolledCount: 12,
      userRating: null,
      userFeedback: null,
    })
  })

  it("surfaces the user's stored rating and feedback from the enrollment meta", async () => {
    const { getEventDetail } = await import('../services/getEventDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(rowChain([eventRow()]))
      .mockReturnValueOnce(countChain([{ enrolledCount: 12 }]))
      .mockReturnValueOnce(
        limitChain([
          { id: 1, meta: { rating: 4, feedback: 'Loved the energy!' } },
        ]),
      )

    await expect(getEventDetail(7, 1, NOW)).resolves.toMatchObject({
      isEnrolled: true,
      userRating: 4,
      userFeedback: 'Loved the energy!',
    })
  })

  it('falls back to nulls for blank/absent optional fields and an empty meta', async () => {
    const { getEventDetail } = await import('../services/getEventDetail.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        rowChain([
          eventRow({
            clubId: null,
            description: '   ',
            category: null,
            mode: null,
            locationTitle: null,
            locationMapLink: null,
            eventLink: null,
            imageLink: null,
            platform: null,
            startTime: null,
            endTime: null,
            meta: null,
            clubName: null,
          }),
        ]),
      )
      .mockReturnValueOnce(countChain([{ enrolledCount: 0 }]))
      .mockReturnValueOnce(limitChain([]))

    await expect(getEventDetail(7, 1, NOW)).resolves.toMatchObject({
      description: null,
      imageUrl: null,
      category: null,
      mode: null,
      eventLink: null,
      platform: null,
      startTime: null,
      endTime: null,
      aboveTitle: null,
      belowTitle: null,
      isWeeklyConnect: false,
      clubId: null,
      clubName: null,
      status: 'completed',
      isEnrolled: false,
      enrolledCount: 0,
    })
  })
})
