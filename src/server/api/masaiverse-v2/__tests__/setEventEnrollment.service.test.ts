import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
  awardEventRegistrationPoints: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))

vi.mock('../services/awardLeaderboardPoints.service', () => ({
  awardEventRegistrationPoints: hoisted.awardEventRegistrationPoints,
}))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    mode: 'events.mode',
    eventLink: 'events.event_link',
    locationMapLink: 'events.location_map_link',
    clubId: 'events.club_id',
  },
  eventEnrollments: {
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
  },
  clubMembers: {
    id: 'club_members.id',
    clubId: 'club_members.club_id',
    userId: 'club_members.user_id',
  },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}
/** `db.select().from().where()` */
function whereChain(rows: unknown) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}

function mockInsert() {
  const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined)
  const values = vi.fn().mockReturnValue({ onDuplicateKeyUpdate })
  hoisted.dbInsert.mockReturnValue({ values })
  return { values, onDuplicateKeyUpdate }
}

beforeEach(() => {
  // resetAllMocks (not clearAllMocks) so the `mockReturnValueOnce` queue is
  // drained between tests — otherwise an early-throwing test leaks leftover
  // mock values into the next one.
  vi.resetAllMocks()
})

describe('setEventEnrollment', () => {
  it('rejects a non-finite event id', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    await expect(setEventEnrollment(1, Number.NaN)).rejects.toThrow(
      'INVALID_EVENT_ID',
    )
  })

  it('rejects when the event does not exist', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(setEventEnrollment(1, 5)).rejects.toThrow('EVENT_NOT_FOUND')
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('registers idempotently and redirects offline events to the map link', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    const { values } = mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'offline',
            eventLink: 'https://meet.example/x',
            locationMapLink: 'https://maps.example/hq',
            clubId: 8,
          },
        ]),
      )
      .mockReturnValueOnce(limitChain([{ id: 1 }])) // is a club member
      .mockReturnValueOnce(limitChain([])) // not yet enrolled
      .mockReturnValueOnce(whereChain([{ enrolledCount: 9 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toEqual({
      isEnrolled: true,
      enrolledCount: 9,
      redirectUrl: 'https://maps.example/hq',
    })
    expect(values).toHaveBeenCalledWith({ userId: 1, eventId: 5 })
    // A first-time registration earns event-registration points with the club id.
    expect(hoisted.awardEventRegistrationPoints).toHaveBeenCalledWith({
      userId: 1,
      eventId: 5,
      clubId: 8,
    })
  })

  it('does not award points again when the user is already enrolled', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'online',
            eventLink: 'https://meet.example/x',
            locationMapLink: null,
            clubId: null,
          },
        ]),
      )
      .mockReturnValueOnce(limitChain([{ userId: 1 }])) // already enrolled
      .mockReturnValueOnce(whereChain([{ enrolledCount: 9 }]))

    await setEventEnrollment(1, 5)
    expect(hoisted.awardEventRegistrationPoints).not.toHaveBeenCalled()
  })

  it('redirects online events to the event link', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'online',
            eventLink: 'https://meet.example/x',
            locationMapLink: null,
            clubId: null,
          },
        ]),
      )
      .mockReturnValueOnce(limitChain([])) // not yet enrolled
      .mockReturnValueOnce(whereChain([{ enrolledCount: 1 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toMatchObject({
      redirectUrl: 'https://meet.example/x',
    })
  })

  it('returns a null redirect when the relevant link is blank', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'online',
            eventLink: '   ',
            locationMapLink: null,
            clubId: null,
          },
        ]),
      )
      .mockReturnValueOnce(limitChain([])) // not yet enrolled
      .mockReturnValueOnce(whereChain([{ enrolledCount: 2 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toMatchObject({
      redirectUrl: null,
    })
  })

  it('rejects registration for a club event when the user is not a member', async () => {
    const { setEventEnrollment } =
      await import('../services/setEventEnrollment.service')
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'online',
            eventLink: 'https://meet.example/x',
            locationMapLink: null,
            clubId: 8,
          },
        ]),
      )
      .mockReturnValueOnce(limitChain([])) // not a club member
    await expect(setEventEnrollment(1, 5)).rejects.toThrow(
      'CLUB_MEMBERSHIP_REQUIRED',
    )
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
    expect(hoisted.awardEventRegistrationPoints).not.toHaveBeenCalled()
  })
})
