import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
  },
  eventEnrollments: {
    id: 'event_enrollments.id',
    eventId: 'event_enrollments.event_id',
    userId: 'event_enrollments.user_id',
    meta: 'event_enrollments.meta',
  },
}))

/** `db.select().from().where().limit()` */
function limitChain(rows: unknown) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  }
}

function mockUpdate() {
  const where = vi.fn().mockResolvedValue(undefined)
  const set = vi.fn().mockReturnValue({ where })
  hoisted.dbUpdate.mockReturnValue({ set })
  return { set, where }
}

// `now` is well after the event below ends, so it reads as "completed".
const NOW = new Date('2026-06-10T12:00:00Z')
const ENDED_EVENT = {
  id: 5,
  startTime: '2026-06-01 09:00:00',
  endTime: '2026-06-01 11:00:00',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('rateEvent', () => {
  it('rejects a non-finite event id', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    await expect(rateEvent(1, Number.NaN, 4, null, NOW)).rejects.toThrow(
      'INVALID_EVENT_ID',
    )
  })

  it('rejects an out-of-range or non-integer rating', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    await expect(rateEvent(1, 5, 0, null, NOW)).rejects.toThrow(
      'INVALID_RATING',
    )
    await expect(rateEvent(1, 5, 6, null, NOW)).rejects.toThrow(
      'INVALID_RATING',
    )
    await expect(rateEvent(1, 5, 3.5, null, NOW)).rejects.toThrow(
      'INVALID_RATING',
    )
  })

  it('rejects when the event does not exist', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    hoisted.dbSelect.mockReturnValueOnce(limitChain([]))
    await expect(rateEvent(1, 5, 4, null, NOW)).rejects.toThrow(
      'EVENT_NOT_FOUND',
    )
  })

  it('rejects when the event has not ended yet', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    hoisted.dbSelect.mockReturnValueOnce(
      limitChain([
        {
          id: 5,
          startTime: '2026-07-01 09:00:00',
          endTime: '2026-07-01 11:00:00',
        },
      ]),
    )
    await expect(rateEvent(1, 5, 4, null, NOW)).rejects.toThrow(
      'EVENT_NOT_ENDED',
    )
  })

  it('rejects when the user was not enrolled', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([ENDED_EVENT]))
      .mockReturnValueOnce(limitChain([]))
    await expect(rateEvent(1, 5, 4, null, NOW)).rejects.toThrow('NOT_ENROLLED')
  })

  it('rejects a second rating for the same enrollment', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([ENDED_EVENT]))
      .mockReturnValueOnce(limitChain([{ id: 9, meta: { rating: 3 } }]))
    await expect(rateEvent(1, 5, 4, null, NOW)).rejects.toThrow('ALREADY_RATED')
  })

  it('stores the rating and trimmed feedback, preserving existing meta', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    const { set } = mockUpdate()
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([ENDED_EVENT]))
      .mockReturnValueOnce(limitChain([{ id: 9, meta: { source: 'qr' } }]))

    await expect(rateEvent(1, 5, 4, '  Great talks!  ', NOW)).resolves.toEqual({
      rating: 4,
      feedback: 'Great talks!',
    })

    expect(set).toHaveBeenCalledWith({
      meta: {
        source: 'qr',
        rating: 4,
        feedback: 'Great talks!',
        ratedAt: NOW.toISOString(),
      },
    })
  })

  it('normalizes blank feedback to null', async () => {
    const { rateEvent } = await import('../services/rateEvent.service')
    mockUpdate()
    hoisted.dbSelect
      .mockReturnValueOnce(limitChain([ENDED_EVENT]))
      .mockReturnValueOnce(limitChain([{ id: 9, meta: null }]))

    await expect(rateEvent(1, 5, 5, '   ', NOW)).resolves.toEqual({
      rating: 5,
      feedback: null,
    })
  })
})
