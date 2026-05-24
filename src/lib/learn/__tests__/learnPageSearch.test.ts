import { describe, expect, it } from 'vitest'

import { createEmptyLearnModalFilters } from '@/components/features/learn/shared/types'
import {
  countActiveLearnFilters,
  learnModalFiltersFromSearch,
  modalFiltersToApiFilters,
  pickLearnTabSnapshotFilters,
} from '@/lib/learn/learnPageSearch'

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
    expect(countActiveLearnFilters('resources', { ...filters, types: [] })).toBe(3)
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
