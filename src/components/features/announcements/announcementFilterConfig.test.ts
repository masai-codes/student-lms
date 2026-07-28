import { describe, expect, it } from 'vitest'
import {
  ANNOUNCEMENT_FILTER_SECTIONS,
  ANNOUNCEMENT_TYPE_OPTIONS,
  createEmptyAnnouncementFilters,
  isIsoDate,
  normalizeFilterValues,
} from './announcementFilterConfig'

describe('announcementFilterConfig', () => {
  it('exposes the four filter sections in order', () => {
    expect(ANNOUNCEMENT_FILTER_SECTIONS).toEqual([
      'type',
      'category',
      'announcedBy',
      'date',
    ])
  })

  it('exposes only the critical + info type options', () => {
    expect(ANNOUNCEMENT_TYPE_OPTIONS.map((o) => o.value)).toEqual([
      'critical',
      'info',
    ])
  })

  it('creates a fresh empty filter state', () => {
    const a = createEmptyAnnouncementFilters()
    a.types.push('x')
    expect(createEmptyAnnouncementFilters().types).toEqual([])
  })

  it('validates ISO dates', () => {
    expect(isIsoDate('2026-07-22')).toBe(true)
    expect(isIsoDate('2026-13-01')).toBe(false)
  })

  it('normalizes csv/array/junk filter values', () => {
    expect(normalizeFilterValues('a, b ,a')).toEqual(['a', 'b'])
    expect(normalizeFilterValues(['a', 'a', ''])).toEqual(['a'])
    expect(normalizeFilterValues(undefined)).toEqual([])
    expect(normalizeFilterValues(5)).toEqual([])
  })
})
