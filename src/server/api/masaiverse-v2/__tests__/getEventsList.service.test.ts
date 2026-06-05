import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    clubId: 'events.club_id',
    title: 'events.title',
    imageLink: 'events.image_link',
    category: 'events.category',
    mode: 'events.mode',
    locationTitle: 'events.location_title',
    meta: 'events.meta',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
  },
  clubs: { id: 'clubs.id', name: 'clubs.name' },
  clubMembers: {
    userId: 'club_members.user_id',
    clubId: 'club_members.club_id',
  },
  eventEnrollments: {
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
  },
}))

/** Resolves a `select(...).from(...).leftJoin(...).where(...).orderBy(...)` chain. */
function selectChain(rows: unknown) {
  return {
    from: () => ({
      leftJoin: () => ({
        where: () => ({ orderBy: () => Promise.resolve(rows) }),
      }),
    }),
  }
}

/** Resolves the `getMemberClubIds` `select(...).from(...).where(...)` chain. */
function memberClubsChain(clubIds: Array<number>) {
  return {
    from: () => ({
      where: () => Promise.resolve(clubIds.map((clubId) => ({ clubId }))),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getEventsList', () => {
  it('maps a club-hosted row into the listing shape with club name', async () => {
    const { getEventsList } = await import('../services/getEventsList.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 12,
          title: 'Build Sprint',
          imageLink: 'https://cdn/img.png',
          category: 'hackathon',
          mode: 'offline',
          locationTitle: 'Bangalore HQ',
          meta: { aboveTitle: 'FLAGSHIP', belowTitle: '48 teams' },
          clubId: 7,
          clubName: 'Code Club',
          startTime: '2026-06-05 08:30:00',
          endTime: '2026-06-05 10:30:00',
        },
      ]),
    )

    await expect(getEventsList()).resolves.toEqual([
      {
        id: '12',
        imageUrl: 'https://cdn/img.png',
        aboveTitle: 'FLAGSHIP',
        title: 'Build Sprint',
        belowTitle: '48 teams',
        category: 'hackathon',
        mode: 'offline',
        locationTitle: 'Bangalore HQ',
        clubId: '7',
        clubName: 'Code Club',
        startTime: '2026-06-05T08:30:00.000Z',
        endTime: '2026-06-05T10:30:00.000Z',
        isEnrolled: false,
      },
    ])
  })

  it('treats a row with no club as a public event (null club fields)', async () => {
    const { getEventsList } = await import('../services/getEventsList.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 9,
          title: 'Community Webinar',
          imageLink: null,
          category: 'webinar',
          mode: 'online',
          locationTitle: null,
          meta: null,
          clubId: null,
          clubName: null,
          startTime: '2026-07-01 12:00:00',
          endTime: null,
        },
      ]),
    )

    await expect(getEventsList()).resolves.toEqual([
      {
        id: '9',
        imageUrl: null,
        aboveTitle: null,
        title: 'Community Webinar',
        belowTitle: null,
        category: 'webinar',
        mode: 'online',
        locationTitle: null,
        clubId: null,
        clubName: null,
        startTime: '2026-07-01T12:00:00.000Z',
        endTime: null,
        isEnrolled: false,
      },
    ])
  })

  it('normalizes blank/missing fields and a club with no name to null', async () => {
    const { getEventsList } = await import('../services/getEventsList.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 3,
          title: 'Mystery Meetup',
          // Whitespace-only strings normalize to null, same as missing.
          imageLink: '   ',
          category: null,
          mode: null,
          locationTitle: '  ',
          meta: { aboveTitle: '   ', belowTitle: '' },
          clubId: 5,
          clubName: '  ',
          startTime: null,
          endTime: null,
        },
      ]),
    )

    await expect(getEventsList()).resolves.toEqual([
      {
        id: '3',
        imageUrl: null,
        aboveTitle: null,
        title: 'Mystery Meetup',
        belowTitle: null,
        category: null,
        mode: null,
        locationTitle: null,
        clubId: '5',
        clubName: null,
        startTime: null,
        endTime: null,
        isEnrolled: false,
      },
    ])
  })

  it('returns an empty list when there are no events', async () => {
    const { getEventsList } = await import('../services/getEventsList.service')
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))
    await expect(getEventsList()).resolves.toEqual([])
  })

  it('marks events the user is enrolled in when a userId is passed', async () => {
    const { getEventsList } = await import('../services/getEventsList.service')
    hoisted.dbSelect
      // 1) the member's joined club ids (scopes the listing)
      .mockReturnValueOnce(memberClubsChain([7]))
      // 2) the events query
      .mockReturnValueOnce(
        selectChain([
          {
            id: 12,
            title: 'Build Sprint',
            imageLink: null,
            category: null,
            mode: 'online',
            locationTitle: null,
            meta: null,
            clubId: null,
            clubName: null,
            startTime: null,
            endTime: null,
          },
          {
            id: 13,
            title: 'Design Jam',
            imageLink: null,
            category: null,
            mode: 'online',
            locationTitle: null,
            meta: null,
            clubId: null,
            clubName: null,
            startTime: null,
            endTime: null,
          },
        ]),
      )
      // The enrollment lookup: the user is registered for event 13 only.
      .mockReturnValueOnce({
        from: () => ({ where: () => Promise.resolve([{ eventId: 13 }]) }),
      })

    const result = await getEventsList(1)
    expect(result.map((e) => [e.id, e.isEnrolled])).toEqual([
      ['12', false],
      ['13', true],
    ])
  })
})
