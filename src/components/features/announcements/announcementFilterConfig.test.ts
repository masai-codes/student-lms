import { describe, expect, it } from 'vitest'
import {
  ANNOUNCEMENT_TYPE_OPTIONS,
  normalizeFilterValues,
} from './announcementFilterConfig'

describe('ANNOUNCEMENT_TYPE_OPTIONS', () => {
  it('exposes only the critical and info student-facing types', () => {
    expect(ANNOUNCEMENT_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      'critical',
      'info',
    ])
  })
})

describe('normalizeFilterValues', () => {
  it('returns undefined for absent, empty, or non-string input', () => {
    expect(normalizeFilterValues(undefined)).toBeUndefined()
    expect(normalizeFilterValues('')).toBeUndefined()
    expect(normalizeFilterValues([])).toBeUndefined()
    expect(normalizeFilterValues(42)).toBeUndefined()
    expect(normalizeFilterValues([''])).toBeUndefined()
  })

  it('wraps a single string into a one-element list', () => {
    expect(normalizeFilterValues('critical')).toEqual(['critical'])
  })

  it('dedupes an array and drops non-string / empty entries', () => {
    expect(
      normalizeFilterValues(['critical', 'critical', 'info', '', 5]),
    ).toEqual(['critical', 'info'])
  })
})
