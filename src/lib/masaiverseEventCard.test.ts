import { describe, expect, it } from 'vitest'
import {
  formatIstDateTime,
  formatIstDayBadge,
  getEventCardDisplay,
  getEventStatus,
} from './masaiverseEventCard'

// 2026-06-03 17:30 IST (Wed).
const NOW = new Date('2026-06-03T12:00:00Z')

describe('getEventCardDisplay', () => {
  it('flags a currently-running event as LIVE', () => {
    const result = getEventCardDisplay(
      { startTime: '2026-06-03T11:00:00Z', endTime: '2026-06-03T13:00:00Z' },
      NOW,
    )
    expect(result.isLive).toBe(true)
    expect(result.badgeLabel).toBe('LIVE')
  })

  it('labels an event later today as TODAY', () => {
    // 2026-06-03 23:30 IST — same IST day, not yet started.
    const result = getEventCardDisplay(
      { startTime: '2026-06-03T18:00:00Z', endTime: '2026-06-03T19:00:00Z' },
      NOW,
    )
    expect(result.isLive).toBe(false)
    expect(result.badgeLabel).toBe('TODAY')
  })

  it('labels the next IST day as TOMORROW', () => {
    const result = getEventCardDisplay(
      { startTime: '2026-06-04T06:00:00Z', endTime: '2026-06-04T07:00:00Z' },
      NOW,
    )
    expect(result.badgeLabel).toBe('TOMORROW')
  })

  it('shows the IST start time for further-out events, plus the date box', () => {
    // 2026-06-10 08:30 IST.
    const result = getEventCardDisplay(
      { startTime: '2026-06-10T03:00:00Z', endTime: '2026-06-10T05:00:00Z' },
      NOW,
    )
    expect(result.badgeLabel).toBe('8:30 AM')
    expect(result.dateDay).toBe('10')
    expect(result.dateMonth).toBe('JUN')
  })

  it('handles a missing start time without a badge', () => {
    const result = getEventCardDisplay(
      { startTime: null, endTime: null },
      NOW,
    )
    expect(result.isLive).toBe(false)
    expect(result.badgeLabel).toBe('')
    expect(result.dateDay).toBe('')
  })
})

describe('formatIstDateTime', () => {
  it('formats a UTC instant as an IST date + time', () => {
    // 2026-05-28 09:00 UTC == 14:30 IST.
    expect(formatIstDateTime('2026-05-28T09:00:00Z')).toBe('May 28 · 2:30 PM')
  })

  it('returns null for a missing or unparseable timestamp', () => {
    expect(formatIstDateTime(null)).toBeNull()
    expect(formatIstDateTime('not-a-date')).toBeNull()
  })
})

describe('getEventStatus', () => {
  it('returns live for a currently-running event', () => {
    expect(
      getEventStatus(
        { startTime: '2026-06-03T11:00:00Z', endTime: '2026-06-03T13:00:00Z' },
        NOW,
      ),
    ).toBe('live')
  })

  it('returns upcoming for a future start, or only a future end', () => {
    expect(
      getEventStatus(
        { startTime: '2026-06-10T11:00:00Z', endTime: '2026-06-10T13:00:00Z' },
        NOW,
      ),
    ).toBe('upcoming')
    expect(
      getEventStatus({ startTime: null, endTime: '2026-06-10T13:00:00Z' }, NOW),
    ).toBe('upcoming')
  })

  it('returns completed for ended events or unplaceable timestamps', () => {
    expect(
      getEventStatus(
        { startTime: '2026-05-01T11:00:00Z', endTime: '2026-05-01T13:00:00Z' },
        NOW,
      ),
    ).toBe('completed')
    expect(getEventStatus({ startTime: null, endTime: null }, NOW)).toBe(
      'completed',
    )
  })
})

describe('formatIstDayBadge', () => {
  it('formats a UTC instant as an IST weekday + day', () => {
    // 2026-06-03 12:00 UTC == Wed 3 Jun, 17:30 IST.
    expect(formatIstDayBadge('2026-06-03T12:00:00Z')).toEqual({
      weekday: 'WED',
      day: '3',
    })
  })

  it('returns null for a missing or unparseable timestamp', () => {
    expect(formatIstDayBadge(null)).toBeNull()
    expect(formatIstDayBadge('nope')).toBeNull()
  })
})
