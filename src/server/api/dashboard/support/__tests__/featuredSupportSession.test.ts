import { describe, expect, it } from 'vitest'
import { selectFeaturedSupportSession } from '../featuredSupportSession'
import type { DashboardSupportSession } from '../getSupportSessions.service'

// 12:00 IST on 2026-07-02
const NOW = new Date('2026-07-02T06:30:00Z')

const s = (over: Partial<DashboardSupportSession>): DashboardSupportSession => ({
  id: 1,
  title: 'Session',
  schedule: '2026-07-02T15:00:00+05:30',
  concludes: '2026-07-02T16:00:00+05:30',
  zoomLink: null,
  status: 'today',
  ...over,
})

describe('selectFeaturedSupportSession', () => {
  it('returns null for an empty list', () => {
    expect(selectFeaturedSupportSession([], NOW)).toBeNull()
  })

  it('prefers a live session over any upcoming ones', () => {
    const live = s({ id: 2, status: 'live', schedule: '2026-07-02T11:00:00+05:30' })
    const later = s({ id: 3, status: 'today' })
    expect(selectFeaturedSupportSession([live, later], NOW)?.id).toBe(2)
  })

  it('falls back to the soonest not-yet-started session', () => {
    const past = s({ id: 4, status: 'today', schedule: '2026-07-02T09:00:00+05:30' })
    const future = s({ id: 5, status: 'today', schedule: '2026-07-02T15:00:00+05:30' })
    expect(selectFeaturedSupportSession([past, future], NOW)?.id).toBe(5)
  })

  it('returns null when every session is already in the past', () => {
    const past = s({ id: 6, status: 'today', schedule: '2026-07-02T09:00:00+05:30' })
    expect(selectFeaturedSupportSession([past], NOW)).toBeNull()
  })
})
