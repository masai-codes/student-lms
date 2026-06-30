import { describe, expect, it } from 'vitest'

import { createEmptyLearnModalFilters } from '@/components/features/learn/shared/types'
import {
  countActiveLearnFilters,
  learnModalFiltersFromSearch,
  mergeLearnSearch,
  modalFiltersToApiFilters,
  pickLearnTabSnapshotFilters,
} from '@/lib/learn/learnPageSearch'

describe('mergeLearnSearch', () => {
  it('removes the search param when the cleared box omits it', () => {
    const merged = mergeLearnSearch(
      { batchId: 9, tab: 'lectures', page: 2, search: 'react' },
      // buildLearnNavigateSearch omits empty search, so nextSearch has no `search`.
      { tab: 'lectures', page: 1 },
    )
    expect(merged.search).toBeUndefined()
    expect(merged).toMatchObject({ batchId: 9, tab: 'lectures', page: 1 })
  })

  it('sets the search param when supplied', () => {
    const merged = mergeLearnSearch(
      { batchId: 9, tab: 'lectures' },
      { tab: 'lectures', page: 1, search: 'node' },
    )
    expect(merged.search).toBe('node')
  })

  it('drops a filter that is no longer supplied and preserves batchId', () => {
    const merged = mergeLearnSearch(
      { batchId: 9, tab: 'lectures', category: 'coding' },
      { tab: 'lectures', page: 1 },
    )
    expect(merged.category).toBeUndefined()
    expect(merged.batchId).toBe(9)
  })

  it('clears the legacy title alias as well', () => {
    const merged = mergeLearnSearch(
      { batchId: 9, tab: 'lectures', title: 'old' },
      { tab: 'lectures', page: 1 },
    )
    expect(merged.title).toBeUndefined()
  })
})

describe('learnPageSearch', () => {
  it('parses lecture filters from URL search', () => {
    const filters = learnModalFiltersFromSearch(
      {
        module: 'Module 1,Module 2',
        category: 'coding',
        type: 'live',
        instructor: 'Ananya Singh',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        lectureTab: 'upcoming',
        attendanceStatus: 'present',
        optional: 'yes',
      },
      'lectures',
    )

    expect(filters.modules).toEqual(['Module 1', 'Module 2'])
    expect(filters.categories).toEqual(['coding'])
    expect(filters.types).toEqual(['live'])
    expect(filters.instructors).toEqual(['Ananya Singh'])
    expect(filters.schedulePhase).toBe('upcoming')
    expect(filters.attendanceStatus).toBe('present')
    expect(filters.priorities).toEqual(['recommended'])
  })

  it('parses assignment progress from assignmentTab', () => {
    const filters = learnModalFiltersFromSearch(
      { assignmentTab: 'overdue', type: 'assignment' },
      'assignments',
    )

    expect(filters.assignmentProgress).toBe('overdue')
    expect(filters.schedulePhase).toBe('all')
  })

  it('counts active filters per tab like legacy learn', () => {
    const filters = {
      ...createEmptyLearnModalFilters(),
      modules: ['Module 1'],
      categories: ['coding'],
      types: ['live'],
      schedulePhase: 'upcoming' as const,
      attendanceStatus: 'present' as const,
    }

    expect(countActiveLearnFilters('lectures', filters)).toBe(5)
    expect(
      countActiveLearnFilters('resources', { ...filters, types: [] }),
    ).toBe(3)
  })

  it('picks only filter fields for tab snapshots (never batchId)', () => {
    const snapshot = pickLearnTabSnapshotFilters({
      batchId: 185,
      tab: 'assignments',
      module: 'Module 1',
      page: 2,
      search: 'hw',
      assignmentTab: 'overdue',
    })

    expect(snapshot).toEqual({ module: 'Module 1', assignmentTab: 'overdue' })
    expect(snapshot).not.toHaveProperty('batchId')
    expect(snapshot).not.toHaveProperty('page')
  })

  it('maps modal filters to API filters', () => {
    const api = modalFiltersToApiFilters('assignments', {
      ...createEmptyLearnModalFilters(),
      assignmentProgress: 'completed',
    })

    expect(api.assignmentProgressStatuses).toEqual(['completed'])
  })
})
