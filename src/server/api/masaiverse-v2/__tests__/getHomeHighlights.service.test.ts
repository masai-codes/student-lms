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

const NOW = new Date('2026-06-03T12:00:00Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getHomeHighlights', () => {
  it('maps rows into recap cards with meta + the past-event emoji', async () => {
    const { getHomeHighlights } = await import(
      '../services/getHomeHighlights.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        {
          id: 11,
          title: 'Build Sprint #11 — Winners',
          meta: {
            aboveTitle: 'WEEKLY HACKATHON · RESULTS',
            belowTitle: '43 submissions',
            pastEventEmojiValue: '⚡',
          },
          startTime: '2026-05-28 09:00:00',
        },
      ]),
    )

    await expect(getHomeHighlights(NOW)).resolves.toEqual([
      {
        id: '11',
        aboveTitle: 'WEEKLY HACKATHON · RESULTS',
        title: 'Build Sprint #11 — Winners',
        belowTitle: '43 submissions',
        pastEventEmojiValue: '⚡',
        startTime: '2026-05-28T09:00:00.000Z',
      },
    ])
  })

  it('normalizes missing meta values to null', async () => {
    const { getHomeHighlights } = await import(
      '../services/getHomeHighlights.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { id: 5, title: 'Mystery Recap', meta: null, startTime: null },
      ]),
    )

    await expect(getHomeHighlights(NOW)).resolves.toEqual([
      {
        id: '5',
        aboveTitle: null,
        title: 'Mystery Recap',
        belowTitle: null,
        pastEventEmojiValue: null,
        startTime: null,
      },
    ])
  })

  it('returns an empty list when nothing happened last week', async () => {
    const { getHomeHighlights } = await import(
      '../services/getHomeHighlights.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(selectChain([]))

    await expect(getHomeHighlights(NOW)).resolves.toEqual([])
  })

  it('accepts a club + weekly-connect scope and still maps rows', async () => {
    const { getHomeHighlights } = await import(
      '../services/getHomeHighlights.service'
    )
    hoisted.dbSelect.mockReturnValueOnce(
      selectChain([
        { id: 7, title: 'Club Recap', meta: null, startTime: null },
      ]),
    )

    await expect(
      getHomeHighlights(NOW, { clubId: 5, weeklyConnect: 'exclude' }),
    ).resolves.toEqual([
      {
        id: '7',
        aboveTitle: null,
        title: 'Club Recap',
        belowTitle: null,
        pastEventEmojiValue: null,
        startTime: null,
      },
    ])
  })
})
