import { describe, expect, it } from 'vitest'
import {
  buildAppliedAnnouncementChips,
  countActiveAnnouncementFilters,
  filtersFromSearch,
  hasActiveAnnouncementFilters,
  searchFromFilters,
} from './announcementFilterSearch'
import { createEmptyAnnouncementFilters } from './announcementFilterConfig'

describe('filtersFromSearch / searchFromFilters', () => {
  it('round-trips through the URL shape and drops invalid dates', () => {
    const filters = filtersFromSearch({
      type: ['critical'],
      category: ['DSA'],
      announcedBy: ['42'],
      startDate: '2026-07-01',
      endDate: 'nope',
    })
    expect(filters).toEqual({
      types: ['critical'],
      categories: ['DSA'],
      announcedBy: ['42'],
      startDate: '2026-07-01',
      endDate: undefined,
    })
    expect(searchFromFilters(filters)).toEqual({
      type: ['critical'],
      category: ['DSA'],
      announcedBy: ['42'],
      startDate: '2026-07-01',
      endDate: undefined,
    })
  })
})

describe('countActiveAnnouncementFilters', () => {
  it('counts each value plus a date range as one', () => {
    const filters = {
      ...createEmptyAnnouncementFilters(),
      types: ['critical'],
      categories: ['DSA', 'General'],
      startDate: '2026-07-01',
    }
    expect(countActiveAnnouncementFilters(filters)).toBe(4)
    expect(hasActiveAnnouncementFilters(filters)).toBe(true)
    expect(hasActiveAnnouncementFilters(createEmptyAnnouncementFilters())).toBe(
      false,
    )
  })
})

describe('buildAppliedAnnouncementChips', () => {
  it('returns no chips when empty', () => {
    expect(
      buildAppliedAnnouncementChips(createEmptyAnnouncementFilters()),
    ).toEqual([])
  })

  it('humanizes type + resolves announcer names, and removes on next', () => {
    const filters = {
      ...createEmptyAnnouncementFilters(),
      types: ['critical'],
      announcedBy: ['42'],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    }
    const chips = buildAppliedAnnouncementChips(filters, { '42': 'Ada' })
    const byKey = Object.fromEntries(chips.map((c) => [c.key, c]))

    expect(byKey['types:critical'].label).toBe('Critical')
    expect(byKey['announcedBy:42'].label).toBe('Ada')
    expect(byKey['date'].label).toBe('2026-07-01 → 2026-07-31')

    expect(byKey['announcedBy:42'].next.announcedBy).toEqual([])
    expect(byKey['date'].next.startDate).toBeUndefined()
  })

  it('falls back to the id when the announcer name is unknown', () => {
    const chips = buildAppliedAnnouncementChips({
      ...createEmptyAnnouncementFilters(),
      announcedBy: ['99'],
    })
    expect(chips[0].label).toBe('99')
  })
})
