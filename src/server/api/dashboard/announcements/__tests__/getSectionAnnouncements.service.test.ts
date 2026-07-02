import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    leftJoin: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Workshop announcement',
  body: 'Body',
  authorName: 'Prof. Anvesh',
  ctaName: null,
  ctaLink: null,
  schedule: '2026-07-02 10:00:00',
  createdAt: '2026-07-01 10:00:00',
  ...over,
})

describe('getSectionAnnouncements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [] without querying when the user has no sections', async () => {
    hoisted.rows = [row()]
    const { getSectionAnnouncements } = await import('../getSectionAnnouncements.service')

    expect(await getSectionAnnouncements([], 42, '2026-07-02 12:00:00', null)).toEqual([])
  })

  it('maps rows to ranked announcements (source a, not For You)', async () => {
    hoisted.rows = [row()]
    const { getSectionAnnouncements } = await import('../getSectionAnnouncements.service')

    const result = await getSectionAnnouncements([5], 42, '2026-07-02 12:00:00', null)
    expect(result).toEqual([
      {
        sortedAt: '2026-07-02 10:00:00',
        item: {
          id: 1,
          source: 'a',
          title: 'Workshop announcement',
          body: 'Body',
          authorName: 'Prof. Anvesh',
          isForYou: false,
          ctaName: null,
          ctaLink: null,
        },
      },
    ])
  })

  it('falls back to createdAt for sortedAt when schedule is null', async () => {
    hoisted.rows = [row({ schedule: null })]
    const { getSectionAnnouncements } = await import('../getSectionAnnouncements.service')

    const [ranked] = await getSectionAnnouncements([5], 42, '2026-07-02 12:00:00', null)
    expect(ranked.sortedAt).toBe('2026-07-01 10:00:00')
  })

  it('drops rows created/scheduled after a banned cutoff', async () => {
    hoisted.rows = [
      row({ id: 1, schedule: '2026-06-01 10:00:00', createdAt: '2026-06-01 10:00:00' }),
      row({ id: 2, schedule: '2026-07-01 10:00:00', createdAt: '2026-07-01 10:00:00' }),
    ]
    const { getSectionAnnouncements } = await import('../getSectionAnnouncements.service')

    const result = await getSectionAnnouncements(
      [5],
      42,
      '2026-07-02 12:00:00',
      new Date('2026-06-15T00:00:00Z'),
    )
    expect(result.map((r) => r.item.id)).toEqual([1])
  })
})
