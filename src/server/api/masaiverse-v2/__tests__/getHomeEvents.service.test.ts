import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    clubId: 'events.club_id',
    title: 'events.title',
    imageLink: 'events.image_link',
    meta: 'events.meta',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
  },
  eventEnrollments: {
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
  },
}))

/** Resolves a `select(...).from(...).where(...).orderBy(...).limit(...)` chain. */
function selectChain(rows: unknown) {
  return {
    from: () => ({
      where: () => ({
        orderBy: () => ({ limit: () => Promise.resolve(rows) }),
      }),
    }),
  }
}

const NOW = new Date('2026-06-03T12:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getHomeEvents', () => {
  it('maps DB rows into the card shape, pulling meta + UTC ISO times', async () => {
    const { getHomeEvents } = await import('../services/getHomeEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 12,
          title: 'Build Sprint #12',
          imageLink: 'https://cdn/img.png',
          meta: { aboveTitle: 'WEEKLY HACKATHON', belowTitle: '48 teams' },
          startTime: '2026-06-05 08:30:00',
          endTime: '2026-06-05 10:30:00',
        },
      ]),
    )

    await expect(getHomeEvents(NOW)).resolves.toEqual([
      {
        id: '12',
        imageUrl: 'https://cdn/img.png',
        aboveTitle: 'WEEKLY HACKATHON',
        title: 'Build Sprint #12',
        belowTitle: '48 teams',
        startTime: '2026-06-05T08:30:00.000Z',
        endTime: '2026-06-05T10:30:00.000Z',
        isEnrolled: false,
      },
    ])
  })

  it('normalizes missing image / meta / timestamps to null', async () => {
    const { getHomeEvents } = await import('../services/getHomeEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 9,
          title: 'Mystery Meetup',
          imageLink: null,
          meta: null,
          startTime: null,
          endTime: null,
        },
      ]),
    )

    await expect(getHomeEvents(NOW)).resolves.toEqual([
      {
        id: '9',
        imageUrl: null,
        aboveTitle: null,
        title: 'Mystery Meetup',
        belowTitle: null,
        startTime: null,
        endTime: null,
        isEnrolled: false,
      },
    ])
  })

  it('returns an empty list when there are no live or upcoming events', async () => {
    const { getHomeEvents } = await import('../services/getHomeEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(getHomeEvents(NOW)).resolves.toEqual([])
  })

  it('accepts a club + weekly-connect scope and still maps rows', async () => {
    const { getHomeEvents } = await import('../services/getHomeEvents.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 3,
          title: 'Club Meetup',
          imageLink: null,
          meta: null,
          startTime: null,
          endTime: null,
        },
      ]),
    )

    await expect(
      getHomeEvents(NOW, { clubId: 5, weeklyConnect: 'exclude' }),
    ).resolves.toEqual([
      {
        id: '3',
        imageUrl: null,
        aboveTitle: null,
        title: 'Club Meetup',
        belowTitle: null,
        startTime: null,
        endTime: null,
        isEnrolled: false,
      },
    ])
  })

  it('marks events the user is enrolled in when a userId is passed', async () => {
    const { getHomeEvents } = await import('../services/getHomeEvents.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        selectChain([
          {
            id: 12,
            title: 'Build Sprint #12',
            imageLink: null,
            meta: null,
            startTime: null,
            endTime: null,
          },
          {
            id: 13,
            title: 'Design Jam',
            imageLink: null,
            meta: null,
            startTime: null,
            endTime: null,
          },
        ]),
      )
      // The enrollment lookup: the user is registered for event 12 only.
      .mockReturnValueOnce({
        from: () => ({ where: () => Promise.resolve([{ eventId: 12 }]) }),
      })

    const result = await getHomeEvents(NOW, {}, 1)
    expect(result.map((e) => [e.id, e.isEnrolled])).toEqual([
      ['12', true],
      ['13', false],
    ])
  })
})
