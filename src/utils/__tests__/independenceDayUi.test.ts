import { describe, expect, it } from 'vitest'

import { isIndependenceDayUiEnabled } from '../independenceDayUi'

describe('isIndependenceDayUiEnabled', () => {
  it('is off before the window opens (Aug 13, 2026 IST)', () => {
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-13T23:59:59+05:30')),
    ).toBe(false)
  })

  it('is on from the eve through Independence Day', () => {
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-14T00:00:00+05:30')),
    ).toBe(true)
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-15T12:00:00+05:30')),
    ).toBe(true)
  })

  it('is on right up to 11:00 AM IST on Aug 16, then off', () => {
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-16T10:59:59+05:30')),
    ).toBe(true)
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-16T11:00:00+05:30')),
    ).toBe(false)
  })

  it('window bounds are timezone-independent (same instant in UTC)', () => {
    expect(
      isIndependenceDayUiEnabled(Date.parse('2026-08-16T05:29:59Z')),
    ).toBe(true)
    expect(isIndependenceDayUiEnabled(Date.parse('2026-08-16T05:30:00Z'))).toBe(
      false,
    )
  })
})
