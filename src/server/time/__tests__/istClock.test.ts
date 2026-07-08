import { describe, expect, it } from 'vitest'
import {
  formatIstWallClock,
  getIstDayWindow,
  getIstNowSqlDatetime,
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
