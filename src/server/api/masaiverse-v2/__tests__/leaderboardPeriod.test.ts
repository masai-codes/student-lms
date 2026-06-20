import { describe, expect, it } from 'vitest'
import {
  leaderboardPeriodCondition,
  monthStart,
  parseLeaderboardPeriod,
} from '../services/leaderboardPeriod'

describe('parseLeaderboardPeriod', () => {
  it('keeps "month"', () => {
    expect(parseLeaderboardPeriod('month')).toBe('month')
  })

  it('defaults anything else to "overall"', () => {
    expect(parseLeaderboardPeriod('overall')).toBe('overall')
    expect(parseLeaderboardPeriod('weird')).toBe('overall')
    expect(parseLeaderboardPeriod(null)).toBe('overall')
  })
})

describe('monthStart', () => {
  it("returns the 1st of the given date's month at midnight, zero-padded", () => {
    expect(monthStart(new Date(2026, 0, 17, 9, 30))).toBe('2026-01-01 00:00:00')
    expect(monthStart(new Date(2026, 10, 5))).toBe('2026-11-01 00:00:00')
  })
})

describe('leaderboardPeriodCondition', () => {
  it('returns undefined for the overall period', () => {
    expect(leaderboardPeriodCondition('overall')).toBeUndefined()
  })

  it('returns a condition for the month period', () => {
    expect(
      leaderboardPeriodCondition('month', new Date(2026, 5, 9)),
    ).toBeDefined()
  })
})
