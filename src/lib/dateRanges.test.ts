import { describe, expect, it } from 'vitest'
import {
  getCurrentWeekRangeIst,
  getCurrentYearRangeIst,
  getLastWeekRangeIst,
  toMysqlUtc,
} from './dateRanges'

describe('toMysqlUtc', () => {
  it('formats a UTC instant as a SQL datetime string', () => {
    expect(toMysqlUtc(new Date('2026-05-31T18:30:00.000Z'))).toBe(
      '2026-05-31 18:30:00',
    )
  })
})

describe('getCurrentWeekRangeIst', () => {
  it('spans Monday→Monday in IST for a midweek instant', () => {
    // Wed 2026-06-03 17:30 IST.
    const range = getCurrentWeekRangeIst(new Date('2026-06-03T12:00:00Z'))
    // Mon 2026-06-01 00:00 IST == Sun 2026-05-31 18:30 UTC.
    expect(range.start.toISOString()).toBe('2026-05-31T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-06-07T18:30:00.000Z')
  })

  it('uses the IST day, not the UTC day, at the week boundary', () => {
    // Sun 2026-06-07 19:00 UTC is already Mon 2026-06-08 00:30 IST.
    const range = getCurrentWeekRangeIst(new Date('2026-06-07T19:00:00Z'))
    expect(range.start.toISOString()).toBe('2026-06-07T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-06-14T18:30:00.000Z')
  })
})

describe('getLastWeekRangeIst', () => {
  it('is the seven days immediately before the current week', () => {
    const range = getLastWeekRangeIst(new Date('2026-06-03T12:00:00Z'))
    // This week starts Mon 2026-06-01 IST (2026-05-31 18:30 UTC); last week is
    // the prior Monday→Monday.
    expect(range.start.toISOString()).toBe('2026-05-24T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-05-31T18:30:00.000Z')
  })
})

describe('getCurrentYearRangeIst', () => {
  it('spans Jan 1→Jan 1 in IST', () => {
    const range = getCurrentYearRangeIst(new Date('2026-06-03T12:00:00Z'))
    expect(range.start.toISOString()).toBe('2025-12-31T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-12-31T18:30:00.000Z')
  })

  it('uses the IST year at the year boundary', () => {
    // 2025-12-31 19:00 UTC is already 2026-01-01 00:30 IST.
    const range = getCurrentYearRangeIst(new Date('2025-12-31T19:00:00Z'))
    expect(range.start.toISOString()).toBe('2025-12-31T18:30:00.000Z')
    expect(range.end.toISOString()).toBe('2026-12-31T18:30:00.000Z')
  })
})
