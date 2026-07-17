import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
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

// 06:30 UTC = 12:00 IST on 2026-07-02
const NOW = new Date('2026-07-02T06:30:00Z')

// The `istDatetime` column type stamps rows with an explicit `+05:30` offset on
// read (see src/db/columnTypes.ts), so the service receives offset-bearing ISO
// strings — mirror that here rather than the naive DB wall-clock shape.
const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'LMS Support Session',
  schedule: '2026-07-02T11:00:00+05:30',
  concludes: '2026-07-02T13:00:00+05:30',
  zoomLink: 'https://zoom.us/j/1',
  ...over,
})

describe('getSupportSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('formats schedule/concludes as IST ISO and computes the live status', async () => {
    hoisted.rows = [row()]
    const { getSupportSessions } = await import('../getSupportSessions.service')

    const result = await getSupportSessions(NOW)
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
    hoisted.rows = [
      row({ schedule: '2026-07-06T10:00:00+05:30', concludes: null }),
    ]
    const { getSupportSessions } = await import('../getSupportSessions.service')

    const [session] = await getSupportSessions(NOW)
    expect(session.status).toBe('upcoming')
    expect(session.concludes).toBeNull()
  })
})
