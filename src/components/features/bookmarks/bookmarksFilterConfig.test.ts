import { describe, expect, it } from 'vitest'
import {
  ANNOUNCEMENT_TYPE_OPTIONS,
  LECTURE_TYPE_OPTIONS,
  createEmptyBookmarkFilters,
  getBookmarkFilterSections,
  getTypeOptions,
  isIsoDate,
  normalizeFilterValues,
} from './bookmarksFilterConfig'

describe('createEmptyBookmarkFilters', () => {
  it('returns a fresh empty state each call (no shared reference)', () => {
    const a = createEmptyBookmarkFilters()
    const b = createEmptyBookmarkFilters()
    a.categories.push('x')
    expect(b.categories).toEqual([])
    expect(a).not.toBe(b)
  })
})

describe('getBookmarkFilterSections', () => {
  it('exposes the right sections per tab', () => {
    expect(getBookmarkFilterSections('lectures')).toEqual([
      'category',
      'module',
      'type',
      'date',
    ])
    expect(getBookmarkFilterSections('tickets')).toEqual([
      'status',
      'priority',
      'category',
      'date',
    ])
    expect(getBookmarkFilterSections('masaiverse')).toEqual(['date'])
  })
})

describe('getTypeOptions', () => {
  it('returns fixed type options only for lectures and announcements', () => {
    expect(getTypeOptions('lectures')).toBe(LECTURE_TYPE_OPTIONS)
    expect(getTypeOptions('announcements')).toBe(ANNOUNCEMENT_TYPE_OPTIONS)
    expect(getTypeOptions('tickets')).toEqual([])
    expect(getTypeOptions('assignments')).toEqual([])
  })
})

describe('isIsoDate', () => {
  it('accepts valid ISO dates', () => {
    expect(isIsoDate('2026-07-22')).toBe(true)
  })

  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('2026-7-2')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('not-a-date')).toBe(false)
  })
})

describe('normalizeFilterValues', () => {
  it('handles arrays, csv strings, and junk', () => {
    expect(normalizeFilterValues(['a', 'a', ' b ', ''])).toEqual(['a', 'b'])
    expect(normalizeFilterValues('a, b ,a')).toEqual(['a', 'b'])
    expect(normalizeFilterValues(undefined)).toEqual([])
    expect(normalizeFilterValues(5)).toEqual([])
    expect(normalizeFilterValues([1, 'ok'])).toEqual(['ok'])
  })
})
