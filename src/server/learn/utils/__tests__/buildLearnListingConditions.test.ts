import { describe, expect, it, vi } from 'vitest'

import type {
  BatchLearningFiltersInput,
  LearningType,
} from '@/server/learn/types'
import type { LearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'

// `@/db` is only touched by the attendance `exists()` subquery; stub the builder chain.
vi.mock('@/db', () => ({
  db: { select: () => ({ from: () => ({ where: () => ({}) }) }) },
}))

const OPEN_WINDOW: LearnScheduleWindow = {
  gte: null,
  lt: '2026-06-23 12:00:00',
}
const BOUNDED_WINDOW: LearnScheduleWindow = {
  gte: '2026-06-01 00:00:00',
  lt: '2026-06-11 00:00:00',
}

const ALL_FILTERS: BatchLearningFiltersInput = {
  categories: ['coding'],
  types: ['live'],
  instructors: ['Ananya Singh'],
  modules: ['Module 1'],
  priorities: ['recommended'],
}

const NOW_MS = Date.UTC(2026, 5, 22, 12, 0, 0)

function baseInput(learningType: LearningType, window: LearnScheduleWindow) {
  return {
    learningType,
    batchId: 10,
    sectionIds: [9],
    userId: 7,
    window,
    nowMs: NOW_MS,
  }
}

describe('buildLectureListingConditions', () => {
  it('builds the minimal scoped conditions with an open window', async () => {
    const { buildLectureListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    // batchId, sectionId, type, deletedAt, content-gate, lt(schedule)
    expect(
      buildLectureListingConditions(baseInput('lecture', OPEN_WINDOW)),
    ).toHaveLength(6)
  })

  it('matches resources via the reading type and skips the content gate', async () => {
    const { buildLectureListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    // batchId, sectionId, type=reading, deletedAt, lt(schedule) — no content gate
    expect(
      buildLectureListingConditions(baseInput('resource', OPEN_WINDOW)),
    ).toHaveLength(5)
  })

  it('adds every filter, the search term, both schedule bounds and attendance', async () => {
    const { buildLectureListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    const conditions = buildLectureListingConditions({
      ...baseInput('lecture', BOUNDED_WINDOW),
      search: 'react',
      filters: { ...ALL_FILTERS, attendanceStatus: 'present' },
    })
    // batchId, sectionId, type, deletedAt, content-gate, search, gte, lt,
    // categories, instructors, modules, priorities, (optional + exists) = 14
    expect(conditions).toHaveLength(14)
  })

  it('emits only the lower schedule bound when there is no upper bound', async () => {
    const { buildLectureListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    // batchId, sectionId, type, deletedAt, content-gate, gte (no lt) = 6
    expect(
      buildLectureListingConditions(
        baseInput('lecture', { gte: '2026-06-01 00:00:00', lt: null }),
      ),
    ).toHaveLength(6)
  })

  it('handles the absent attendance status branch', async () => {
    const { buildLectureListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    const conditions = buildLectureListingConditions({
      ...baseInput('lecture', OPEN_WINDOW),
      filters: { attendanceStatus: 'absent' },
    })
    // batchId, sectionId, type, deletedAt, content-gate, lt, (optional + exists) = 8
    expect(conditions).toHaveLength(8)
  })
})

describe('buildAssignmentListingConditions', () => {
  it('builds the minimal scoped conditions', async () => {
    const { buildAssignmentListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    // batchId, sectionId, deletedAt, lt(schedule)
    expect(
      buildAssignmentListingConditions(baseInput('assignment', OPEN_WINDOW)),
    ).toHaveLength(4)
  })

  it('adds search, both schedule bounds and every filter', async () => {
    const { buildAssignmentListingConditions } =
      await import('@/server/learn/utils/buildLearnListingConditions')
    const conditions = buildAssignmentListingConditions({
      ...baseInput('assignment', BOUNDED_WINDOW),
      search: 'arrays',
      filters: ALL_FILTERS,
    })
    // 3 scope + search + gte + lt + 5 filters = 11
    expect(conditions).toHaveLength(11)
  })
})
