import { describe, expect, it } from 'vitest'

import {
  RESTRICT_ALL_CUTOFF,
  isScheduledAfterCutoff,
  normalizeRestrictionCutoff,
} from '@/server/restrictions/restrictionDates'

describe('normalizeRestrictionCutoff', () => {
  it('pushes a date-only value to end of day', () => {
    expect(normalizeRestrictionCutoff('2026-07-02')).toBe('2026-07-02 23:59:59')
  })

  it('keeps a date-time value (adds seconds when missing)', () => {
    expect(normalizeRestrictionCutoff('2026-07-02 10:30')).toBe(
      '2026-07-02 10:30:00',
    )
    expect(normalizeRestrictionCutoff('2026-07-02T10:30:15')).toBe(
      '2026-07-02 10:30:15',
    )
  })

  it('falls back to RESTRICT_ALL for missing/invalid input', () => {
    expect(normalizeRestrictionCutoff(null)).toBe(RESTRICT_ALL_CUTOFF)
    expect(normalizeRestrictionCutoff('')).toBe(RESTRICT_ALL_CUTOFF)
    expect(normalizeRestrictionCutoff(undefined)).toBe(RESTRICT_ALL_CUTOFF)
  })
})

describe('isScheduledAfterCutoff', () => {
  const cutoff = normalizeRestrictionCutoff('2026-07-02') // 2026-07-02 23:59:59 IST

  it('is true when schedule is strictly after the cutoff', () => {
    expect(isScheduledAfterCutoff('2026-07-03 00:00:00', cutoff)).toBe(true)
  })

  it('is false when schedule is on the cutoff day (before end of day)', () => {
    expect(isScheduledAfterCutoff('2026-07-02 09:00:00', cutoff)).toBe(false)
  })

  it('is false when schedule is empty/null', () => {
    expect(isScheduledAfterCutoff(null, cutoff)).toBe(false)
    expect(isScheduledAfterCutoff('', cutoff)).toBe(false)
  })

  it('treats naive and offset-stamped IST schedules identically', () => {
    // "2026-07-03 00:00:00" (naive IST) and "…+05:30" resolve to the same instant.
    expect(isScheduledAfterCutoff('2026-07-03T00:00:00+05:30', cutoff)).toBe(
      true,
    )
    expect(isScheduledAfterCutoff('2026-07-02T09:00:00+05:30', cutoff)).toBe(
      false,
    )
  })

  it('restricts everything when the cutoff is the RESTRICT_ALL sentinel', () => {
    expect(
      isScheduledAfterCutoff('2000-01-01 00:00:00', RESTRICT_ALL_CUTOFF),
    ).toBe(true)
    expect(isScheduledAfterCutoff(null, RESTRICT_ALL_CUTOFF)).toBe(false)
  })
})
