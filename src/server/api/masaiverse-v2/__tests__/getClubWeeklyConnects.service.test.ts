import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

vi.mock('@/db/schema', () => ({
  events: {
    id: 'events.id',
    clubId: 'events.club_id',
    title: 'events.title',
    meta: 'events.meta',
    startTime: 'events.start_time',
    endTime: 'events.end_time',
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getClubWeeklyConnects', () => {
  it('returns an empty list for a non-finite club id without touching the db', async () => {
    const { getClubWeeklyConnects } =
      await import('../services/getClubWeeklyConnects.service')
    await expect(getClubWeeklyConnects(Number.NaN)).resolves.toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('maps rows into weekly-connect items with subtitle + UTC ISO times', async () => {
    const { getClubWeeklyConnects } =
      await import('../services/getClubWeeklyConnects.service')
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 21,
          title: 'Algo Study Circle — Graphs & Trees',
          meta: { belowTitle: 'Google Meet · 7:00 PM IST · Hosted by Arjun' },
          startTime: '2026-06-03 13:30:00',
          endTime: '2026-06-03 14:30:00',
        },
        {
          id: 19,
          title: 'Peer Code Review',
          meta: null,
          startTime: null,
          endTime: null,
        },
      ]),
    )

    await expect(getClubWeeklyConnects(5)).resolves.toEqual([
      {
        id: '21',
        title: 'Algo Study Circle — Graphs & Trees',
        subtitle: 'Google Meet · 7:00 PM IST · Hosted by Arjun',
        startTime: '2026-06-03T13:30:00.000Z',
        endTime: '2026-06-03T14:30:00.000Z',
      },
      {
        id: '19',
        title: 'Peer Code Review',
        subtitle: null,
        startTime: null,
        endTime: null,
      },
    ])
  })
})
