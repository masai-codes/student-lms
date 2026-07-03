import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMinutes,
  formatMysqlDate,
  formatMysqlDatetime,
  offsetFromNow,
  SEED_TIMEZONE,
} from './time'

describe('offsetFromNow', () => {
  it('subtracts days and minutes from now', () => {
    const before = Date.now()
    const result = offsetFromNow({ daysAgo: 1, minutesAgo: 30 })
    const expected = before - 24 * 60 * 60 * 1000 - 30 * 60 * 1000
    expect(Math.abs(result.getTime() - expected)).toBeLessThan(100)
  })

  it('adds minutes from now', () => {
    const before = Date.now()
    const result = offsetFromNow({ minutesFromNow: 10 })
    expect(result.getTime()).toBeGreaterThanOrEqual(before + 10 * 60 * 1000 - 100)
  })
})

describe('formatMysqlDate', () => {
  it('formats the IST calendar date', () => {
    expect(formatMysqlDate(new Date('2026-07-03T07:07:11.000Z'))).toBe('2026-07-03')
  })
})

describe('formatMysqlDatetime', () => {
  it('formats as naive IST wall time, not UTC', () => {
    // 07:07 UTC = 12:37 IST
    expect(formatMysqlDatetime(new Date('2026-07-03T07:07:11.000Z'))).toBe(
      '2026-07-03 12:37:11',
    )
  })

  it('uses Asia/Kolkata timezone', () => {
    expect(SEED_TIMEZONE).toBe('Asia/Kolkata')
  })
})

describe('addMinutes', () => {
  it('adds minutes to a date', () => {
    const start = new Date('2026-03-01T10:00:00.000Z')
    expect(addMinutes(start, 120).toISOString()).toBe('2026-03-01T12:00:00.000Z')
  })
})

describe('addDays', () => {
  it('adds days to a date', () => {
    const start = new Date('2026-03-01T10:00:00.000Z')
    expect(addDays(start, 7).toISOString()).toBe('2026-03-08T10:00:00.000Z')
  })
})
