import { describe, expect, it } from 'vitest'
import { formatScheduleRangeIST, formatScheduleRangeLocal } from './index'

describe('formatScheduleRangeIST', () => {
  it('shows a leading date with a same-day time range', () => {
    expect(formatScheduleRangeIST('2026-07-02 18:30:00', '2026-07-02 19:30:00')).toBe(
      '2 Jul, 6:30 PM - 7:30 PM (IST)',
    )
  })

  it('includes both dates for a cross-day range', () => {
    expect(formatScheduleRangeIST('2026-07-02 23:00:00', '2026-07-03 01:00:00')).toBe(
      '2 Jul, 11PM - 3 Jul, 1AM (IST)',
    )
  })

  it('shows just the start when there is no end', () => {
    expect(formatScheduleRangeIST('2026-07-02 18:30:00', null)).toBe('2 Jul, 6:30 PM (IST)')
  })

  it('returns empty string for a missing start', () => {
    expect(formatScheduleRangeIST(null, null)).toBe('')
  })
})

describe('formatScheduleRangeLocal', () => {
  it('renders a device-local range with a leading date and a tz suffix', () => {
    const result = formatScheduleRangeLocal('2026-07-02 18:30:00', '2026-07-02 19:30:00')
    expect(result).toMatch(/^2 Jul, .+ - .+ \(.+\)$/)
  })

  it('renders just the start when there is no end', () => {
    const result = formatScheduleRangeLocal('2026-07-02 18:30:00', null)
    expect(result).toMatch(/^2 Jul, .+ \(.+\)$/)
    expect(result).not.toContain(' - ')
  })

  it('returns empty string for a missing start', () => {
    expect(formatScheduleRangeLocal(null, null)).toBe('')
  })
})
