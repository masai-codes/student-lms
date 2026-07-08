import { describe, expect, it } from 'vitest'
import {
  formatIstWallClock,
  getIstDayWindow,
  getIstNowSqlDatetime,
  parseIstToMs,
} from '../istClock'

describe('getIstNowSqlDatetime', () => {
  it('shifts UTC by +5:30 and formats as a MySQL datetime string', () => {
    expect(getIstNowSqlDatetime(new Date('2026-07-02T06:30:00Z'))).toBe('2026-07-02 12:00:00')
  })

  it('rolls the date forward across midnight IST', () => {
    expect(getIstNowSqlDatetime(new Date('2026-07-02T20:00:00Z'))).toBe('2026-07-03 01:30:00')
  })
})

describe('getIstDayWindow', () => {
  it('spans start of today to end of the day N days out (IST)', () => {
    // 06:30 UTC = 12:00 IST on 2026-07-02
    expect(getIstDayWindow(new Date('2026-07-02T06:30:00Z'), 8)).toEqual({
      start: '2026-07-02 00:00:00',
      end: '2026-07-10 23:59:59',
    })
  })

  it('uses the IST date at the day boundary and rolls months over', () => {
    // 20:00 UTC on Jul 2 = 01:30 IST on Jul 3
    expect(getIstDayWindow(new Date('2026-07-02T20:00:00Z'), 30)).toEqual({
      start: '2026-07-03 00:00:00',
      end: '2026-08-02 23:59:59',
    })
  })
})

describe('formatIstWallClock', () => {
  it('appends the +05:30 offset as an ISO string', () => {
    expect(formatIstWallClock('2026-07-02 15:00:00')).toBe('2026-07-02T15:00:00+05:30')
  })

  it('returns null for null/empty input', () => {
    expect(formatIstWallClock(null)).toBeNull()
    expect(formatIstWallClock('')).toBeNull()
  })
})

describe('parseIstToMs', () => {
  // 2026-07-08 17:15:00 IST == 2026-07-08 11:45:00 UTC. Expected value is
  // computed from an absolute UTC instant, so this assertion is independent of
  // the machine/CI timezone — which is exactly the property being guarded.
  const istWallClockMs = Date.UTC(2026, 6, 8, 11, 45, 0)

  it('treats a timezone-less MySQL datetime as IST wall-clock', () => {
    expect(parseIstToMs('2026-07-08 17:15:00')).toBe(istWallClockMs)
  })

  it('treats the ISO "T" form the same as the space form', () => {
    expect(parseIstToMs('2026-07-08T17:15:00')).toBe(istWallClockMs)
  })

  it('treats a date-only value as IST midnight', () => {
    expect(parseIstToMs('2026-07-08')).toBe(Date.UTC(2026, 6, 7, 18, 30, 0))
  })

  it('trusts an explicit UTC (Z) instant as-is', () => {
    expect(parseIstToMs('2026-07-08T11:45:00.000Z')).toBe(istWallClockMs)
  })

  it('trusts an explicit +05:30 offset as-is', () => {
    expect(parseIstToMs('2026-07-08T17:15:00+05:30')).toBe(istWallClockMs)
  })

  it('returns null for null/empty/unparseable input', () => {
    expect(parseIstToMs(null)).toBeNull()
    expect(parseIstToMs(undefined)).toBeNull()
    expect(parseIstToMs('')).toBeNull()
    expect(parseIstToMs('   ')).toBeNull()
    expect(parseIstToMs('not-a-date')).toBeNull()
  })
})
