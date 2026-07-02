import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  getCutoff: vi.fn(),
}))

vi.mock('@/db', () => {
  const chain: Record<string, unknown> = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

vi.mock('@/server/users/getBannedContentCutoffForUser', () => ({
  getBannedContentCutoffForUser: hoisted.getCutoff,
}))

// 06:30 UTC = 12:00 IST on 2026-07-02
const NOW = new Date('2026-07-02T06:30:00Z')

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'LMS Support Session',
  schedule: '2026-07-02 11:00:00',
  concludes: '2026-07-02 13:00:00',
  zoomLink: 'https://zoom.us/j/1',
  ...over,
})

describe('getSupportSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getCutoff.mockResolvedValue(null)
  })

  it('formats schedule/concludes as IST ISO and computes the live status', async () => {
    hoisted.rows = [row()]
    const { getSupportSessions } = await import('../getSupportSessions.service')

    const result = await getSupportSessions(42, NOW)
    expect(result).toEqual([
      {
        id: 1,
        title: 'LMS Support Session',
        schedule: '2026-07-02T11:00:00+05:30',
        concludes: '2026-07-02T13:00:00+05:30',
        zoomLink: 'https://zoom.us/j/1',
        status: 'live',
      },
    ])
  })

  it('marks a future-day session as upcoming and null concludes as null', async () => {
    hoisted.rows = [row({ schedule: '2026-07-06 10:00:00', concludes: null })]
    const { getSupportSessions } = await import('../getSupportSessions.service')

    const [session] = await getSupportSessions(42, NOW)
    expect(session.status).toBe('upcoming')
    expect(session.concludes).toBeNull()
  })

  it('hides sessions scheduled after a banned user cutoff', async () => {
    hoisted.getCutoff.mockResolvedValue(new Date('2026-07-02T12:00:00+05:30'))
    hoisted.rows = [
      row({ id: 1, schedule: '2026-07-02 11:00:00' }),
      row({ id: 2, schedule: '2026-07-05 11:00:00' }),
    ]
    const { getSupportSessions } = await import('../getSupportSessions.service')

    const result = await getSupportSessions(42, NOW)
    expect(result.map((s) => s.id)).toEqual([1])
  })
})
