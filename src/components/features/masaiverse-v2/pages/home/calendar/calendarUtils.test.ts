import { describe, expect, it } from 'vitest'
import {
  buildEventsByDate,
  getMonthGrid,
  localDateKey,
  toDateKey,
} from './calendarUtils'

// Pin the timezone so the viewer-local day keys are deterministic regardless of
// the machine/CI timezone. Asia/Kolkata matches the values asserted below.
process.env.TZ = 'Asia/Kolkata'

describe('toDateKey', () => {
  it('formats a date as zero-padded YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('getMonthGrid', () => {
  it('always returns a 6-week (42-cell) grid', () => {
    expect(getMonthGrid(new Date(2026, 5, 1))).toHaveLength(42)
  })

  it('lays out exactly the month days, contiguously, with date keys', () => {
    const cells = getMonthGrid(new Date(2026, 5, 1)) // June 2026 — 30 days
    const dayCells = cells.filter((cell) => cell.day !== null)
    expect(dayCells).toHaveLength(30)
    expect(dayCells[0]).toMatchObject({ day: 1, dateKey: '2026-06-01' })
    expect(dayCells[29]).toMatchObject({ day: 30, dateKey: '2026-06-30' })

    // Leading cells (before day 1) are blank with no date key.
    const firstDayIndex = cells.findIndex((cell) => cell.day === 1)
    for (let i = 0; i < firstDayIndex; i++) {
      expect(cells[i]).toMatchObject({ day: null, dateKey: null })
    }
    // Trailing cells (after the last day) are blank too.
    expect(cells[41]).toMatchObject({ day: null, dateKey: null })
  })

  it('handles a short month (February, 28 days)', () => {
    const cells = getMonthGrid(new Date(2026, 1, 1))
    expect(cells.filter((cell) => cell.day !== null)).toHaveLength(28)
  })
})

describe('localDateKey', () => {
  it('returns null for a missing or unparseable timestamp', () => {
    expect(localDateKey(null)).toBeNull()
    expect(localDateKey('not-a-date')).toBeNull()
  })

  it('uses the viewer-local calendar day of the instant', () => {
    // 10:00 UTC → 15:30 IST, same day.
    expect(localDateKey('2026-06-05T10:00:00Z')).toBe('2026-06-05')
    // 20:00 UTC → 01:30 IST the next day.
    expect(localDateKey('2026-06-05T20:00:00Z')).toBe('2026-06-06')
  })
})

describe('buildEventsByDate', () => {
  it('buckets events by local day and skips undatable ones', () => {
    const map = buildEventsByDate([
      { id: 'a', title: 'A', startTime: '2026-06-05T10:00:00Z', clubName: null },
      {
        id: 'b',
        title: 'B',
        startTime: '2026-06-05T11:00:00Z',
        clubName: 'Code Club',
      },
      { id: 'c', title: 'C', startTime: null, clubName: null },
    ])

    expect([...map.keys()]).toEqual(['2026-06-05'])
    expect(map.get('2026-06-05')?.map((event) => event.id)).toEqual(['a', 'b'])
  })

  it('returns an empty map for no events', () => {
    expect(buildEventsByDate([]).size).toBe(0)
  })
})
