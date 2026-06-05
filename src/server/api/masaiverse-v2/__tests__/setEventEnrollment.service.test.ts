import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbInsert: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, insert: hoisted.dbInsert },
}))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    mode: 'events.mode',
    eventLink: 'events.event_link',
    locationMapLink: 'events.location_map_link',
  },
  eventEnrollments: {
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
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
  vi.clearAllMocks()
})

describe('setEventEnrollment', () => {
  it('rejects a non-finite event id', async () => {
    const { setEventEnrollment } = await import(
      '../services/setEventEnrollment.service'
    )
    await expect(setEventEnrollment(1, Number.NaN)).rejects.toThrow(
      'INVALID_EVENT_ID',
    )
  })

  it('rejects when the event does not exist', async () => {
    const { setEventEnrollment } = await import(
      '../services/setEventEnrollment.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(setEventEnrollment(1, 5)).rejects.toThrow('EVENT_NOT_FOUND')
    expect(hoisted.dbInsert).not.toHaveBeenCalled()
  })

  it('registers idempotently and redirects offline events to the map link', async () => {
    const { setEventEnrollment } = await import(
      '../services/setEventEnrollment.service'
    )
    const { values } = mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'offline',
            eventLink: 'https://meet.example/x',
            locationMapLink: 'https://maps.example/hq',
          },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ enrolledCount: 9 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toEqual({
      isEnrolled: true,
      enrolledCount: 9,
      redirectUrl: 'https://maps.example/hq',
    })
    expect(values).toHaveBeenCalledWith({ userId: 1, eventId: 5 })
  })

  it('redirects online events to the event link', async () => {
    const { setEventEnrollment } = await import(
      '../services/setEventEnrollment.service'
    )
    mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          {
            id: 5,
            mode: 'online',
            eventLink: 'https://meet.example/x',
            locationMapLink: null,
          },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ enrolledCount: 1 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toMatchObject({
      redirectUrl: 'https://meet.example/x',
    })
  })

  it('returns a null redirect when the relevant link is blank', async () => {
    const { setEventEnrollment } = await import(
      '../services/setEventEnrollment.service'
    )
    mockInsert()
    hoisted.dbSelect
      .mockReturnValueOnce(
        limitChain([
          { id: 5, mode: 'online', eventLink: '   ', locationMapLink: null },
        ]),
      )
      .mockReturnValueOnce(whereChain([{ enrolledCount: 2 }]))

    await expect(setEventEnrollment(1, 5)).resolves.toMatchObject({
      redirectUrl: null,
    })
  })
})
