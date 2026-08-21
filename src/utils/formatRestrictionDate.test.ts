import { describe, expect, it } from 'vitest'
import { formatRestrictionDate } from './formatRestrictionDate'

describe('formatRestrictionDate', () => {
  it('formats a bare IST wall-clock date without timezone drift', () => {
    expect(formatRestrictionDate('2026-07-01')).toBe('1 Jul 2026')
  })

  it('formats a wall-clock date carrying a time component', () => {
    expect(formatRestrictionDate('2026-07-01 00:00:00')).toBe('1 Jul 2026')
  })

  it('renders a UTC instant on the IST calendar', () => {
    // 25 Jul 13:38 UTC is still 25 Jul in IST (+5:30).
    expect(formatRestrictionDate('2026-07-25T13:38:18.991Z')).toBe(
      '25 Jul 2026',
    )
    // 25 Jul 19:00 UTC is already 26 Jul in IST.
    expect(formatRestrictionDate('2026-07-25T19:00:00.000Z')).toBe(
      '26 Jul 2026',
    )
  })

  it('trims surrounding whitespace', () => {
    expect(formatRestrictionDate('  2026-07-01  ')).toBe('1 Jul 2026')
  })

  it('returns null for empty, blank, null and undefined input', () => {
    expect(formatRestrictionDate('')).toBeNull()
    expect(formatRestrictionDate('   ')).toBeNull()
    expect(formatRestrictionDate(null)).toBeNull()
    expect(formatRestrictionDate(undefined)).toBeNull()
  })

  it('returns null rather than "Invalid Date" for unparseable input', () => {
    expect(formatRestrictionDate('not a date')).toBeNull()
  })
})
