import { describe, expect, it } from 'vitest'
import {
  buildAppliedBookmarkChips,
  countActiveBookmarkFilters,
  filtersFromSearch,
  hasActiveBookmarkFilters,
  searchFromFilters,
} from './bookmarksFilterSearch'
import { createEmptyBookmarkFilters } from './bookmarksFilterConfig'

describe('filtersFromSearch / searchFromFilters', () => {
  it('round-trips filter state through the URL shape', () => {
    const search = {
      category: ['DSA'],
      status: ['open'],
      type: ['critical'],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    }
    const filters = filtersFromSearch(search)
    expect(filters.categories).toEqual(['DSA'])
    expect(filters.statuses).toEqual(['open'])
    expect(filters.types).toEqual(['critical'])
    expect(filters.startDate).toBe('2026-07-01')
    expect(searchFromFilters(filters)).toEqual({
      category: ['DSA'],
      module: undefined,
      type: ['critical'],
      status: ['open'],
      priority: undefined,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })
  })

  it('drops invalid dates when reading from search', () => {
    expect(filtersFromSearch({ startDate: 'nope' }).startDate).toBeUndefined()
  })
})

describe('countActiveBookmarkFilters / hasActiveBookmarkFilters', () => {
  it('counts each value plus the date range as one', () => {
    const filters = {
      ...createEmptyBookmarkFilters(),
      categories: ['a', 'b'],
      types: ['critical'],
      startDate: '2026-07-01',
    }
    expect(countActiveBookmarkFilters(filters)).toBe(4)
    expect(hasActiveBookmarkFilters(filters)).toBe(true)
    expect(hasActiveBookmarkFilters(createEmptyBookmarkFilters())).toBe(false)
  })
})

describe('buildAppliedBookmarkChips', () => {
  it('returns no chips when nothing is active', () => {
    expect(buildAppliedBookmarkChips(createEmptyBookmarkFilters())).toEqual([])
  })

  it('builds one removable chip per value with humanized type labels', () => {
    const filters = {
      ...createEmptyBookmarkFilters(),
      categories: ['DSA'],
      types: ['resource'],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    }
    const chips = buildAppliedBookmarkChips(filters)
    const byKey = Object.fromEntries(chips.map((c) => [c.key, c]))

    expect(byKey['categories:DSA'].label).toBe('DSA')
    expect(byKey['types:resource'].label).toBe('Resource')
    expect(byKey['date'].label).toBe('2026-07-01 → 2026-07-31')

    // Removing the category chip yields state without that value.
    expect(byKey['categories:DSA'].next.categories).toEqual([])
    // Removing the date chip clears both bounds.
    expect(byKey['date'].next.startDate).toBeUndefined()
    expect(byKey['date'].next.endDate).toBeUndefined()
  })

  it('labels a single-bound date range as on-or-after / on-or-before', () => {
    const startOnly = buildAppliedBookmarkChips({
      ...createEmptyBookmarkFilters(),
      startDate: '2026-07-01',
    })
    expect(startOnly[0].label).toBe('On or after 2026-07-01')
    const endOnly = buildAppliedBookmarkChips({
      ...createEmptyBookmarkFilters(),
      endDate: '2026-07-31',
    })
    expect(endOnly[0].label).toBe('On or before 2026-07-31')
  })
})
