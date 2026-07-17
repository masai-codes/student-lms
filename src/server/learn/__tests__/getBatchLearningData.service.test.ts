import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  GetBatchLearningDataInput,
  LearningPagination,
} from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'

const hoisted = vi.hoisted(() => ({
  getSectionIds: vi.fn(),
  fetchFacets: vi.fn(),
  fetchLecturePage: vi.fn(),
  fetchAssignmentPage: vi.fn(),
  fetchAttendance: vi.fn(),
}))

vi.mock('@/server/batches/getSectionIdsForUserInBatch', () => ({
  getSectionIdsForUserInBatch: hoisted.getSectionIds,
}))
vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: vi.fn(async () => new Map()),
}))
vi.mock('@/server/learn/queries/fetchLearnListingFacets', () => ({
  fetchLearnListingFacets: hoisted.fetchFacets,
}))
vi.mock('@/server/learn/queries/fetchLectureListingPage', () => ({
  fetchLectureListingPage: hoisted.fetchLecturePage,
}))
vi.mock('@/server/learn/queries/fetchAssignmentListingPage', () => ({
  fetchAssignmentListingPage: hoisted.fetchAssignmentPage,
}))
vi.mock('@/server/attendance/services/fetchLectureAttendanceSummaries', () => ({
  fetchLectureAttendanceSummaries: hoisted.fetchAttendance,
}))

const PAGINATION: LearningPagination = {
  page: 1,
  pageSize: 25,
  totalItems: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

const FACETS = {
  moduleFilterValues: ['Module 1'],
  categoryFilterValues: ['coding'],
  typeFilterValues: ['live'],
  priorityFilterValues: ['mandatory' as const],
  instructorFilterValues: ['Ananya Singh'],
}

function lectureRow(
  overrides: Partial<LearningEntityRow> = {},
): LearningEntityRow {
  return {
    id: 101,
    title: 'React Intro',
    category: 'coding',
    type: 'live',
    optional: 0,
    schedule: '2026-05-10 10:00:00',
    concludes: '2026-05-10 11:00:00',
    sectionId: 9,
    week: 1,
    module: null,
    hostName: 'Ananya Singh',
    zoomLink: null,
    ...overrides,
  }
}

describe('getBatchLearningData service (orchestration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getSectionIds.mockResolvedValue([9])
    hoisted.fetchFacets.mockResolvedValue(FACETS)
    hoisted.fetchAttendance.mockResolvedValue(new Map())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T00:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('maps lecture rows and attaches attendance for mandatory lectures', async () => {
    const { getBatchLearningData } =
      await import('../services/getBatchLearningData.service')
    hoisted.fetchLecturePage.mockResolvedValueOnce({
      rows: [lectureRow()],
      pagination: PAGINATION,
    })
    hoisted.fetchAttendance.mockResolvedValueOnce(
      new Map([
        [
          101,
          {
            overallStatus: 1,
            notApplicable: false,
            hasStudentAttendanceEntry: true,
            isCatchupWindowOver: null,
            videoPercentage: 0,
            watchPercentage: 0,
            daysRemaining: null,
            lateByMinutes: null,
          },
        ],
      ]),
    )

    const input: GetBatchLearningDataInput = {
      batchId: 10,
      learningType: 'lecture',
      page: 1,
    }
    const result = await getBatchLearningData(input, 7)

    expect(hoisted.fetchAttendance).toHaveBeenCalledTimes(1)
    expect(result.filterValues).toEqual(FACETS)
    expect(result.pagination).toEqual(PAGINATION)
    expect(result.learningItems).toHaveLength(1)
    expect(result.learningItems[0]).toMatchObject({
      id: 101,
      learningType: 'lecture',
      moduleName: 'Module 1',
      isOptional: 'mandatory',
    })
    expect(result.learningItems[0].attendance?.overallStatus).toBe(1)
  })

  it('maps assignment rows with computed progress and skips attendance', async () => {
    const { getBatchLearningData } =
      await import('../services/getBatchLearningData.service')
    const row = lectureRow({
      id: 55,
      type: 'evaluation',
      concludes: '2026-05-10 11:00:00',
    })
    hoisted.fetchAssignmentPage.mockResolvedValueOnce({
      rows: [row],
      pagination: PAGINATION,
      progressById: new Map([[55, 'completed' as const]]),
      scoreById: new Map<number, number>(),
    })

    const input: GetBatchLearningDataInput = {
      batchId: 10,
      learningType: 'assignment',
    }
    const result = await getBatchLearningData(input, 7)

    expect(hoisted.fetchAttendance).not.toHaveBeenCalled()
    expect(hoisted.fetchAssignmentPage).toHaveBeenCalledTimes(1)
    expect(result.learningItems[0]).toMatchObject({
      id: 55,
      learningType: 'assignment',
      assignmentProgressStatus: 'completed',
    })
  })

  it('maps resource rows with a resolved phase and no attendance', async () => {
    const { getBatchLearningData } =
      await import('../services/getBatchLearningData.service')
    hoisted.fetchLecturePage.mockResolvedValueOnce({
      rows: [
        lectureRow({
          id: 70,
          type: 'reading',
          schedule: '2026-05-01 10:00:00',
        }),
      ],
      pagination: PAGINATION,
    })

    const input: GetBatchLearningDataInput = {
      batchId: 10,
      learningType: 'resource',
    }
    const result = await getBatchLearningData(input, 7)

    expect(hoisted.fetchAttendance).not.toHaveBeenCalled()
    expect(result.learningItems[0]).toMatchObject({
      id: 70,
      learningType: 'resource',
    })
    expect(result.learningItems[0].resourcePhase).not.toBeNull()
  })

  it('falls back to the default page size when none is provided', async () => {
    const { getBatchLearningData } =
      await import('../services/getBatchLearningData.service')
    hoisted.fetchLecturePage.mockResolvedValueOnce({
      rows: [],
      pagination: PAGINATION,
    })

    await getBatchLearningData({ batchId: 10, learningType: 'lecture' }, 7)

    expect(hoisted.fetchLecturePage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 15 }),
    )
  })

  it('honours an explicit page and page size', async () => {
    const { getBatchLearningData } =
      await import('../services/getBatchLearningData.service')
    hoisted.fetchLecturePage.mockResolvedValueOnce({
      rows: [],
      pagination: PAGINATION,
    })

    await getBatchLearningData(
      { batchId: 10, learningType: 'lecture', page: 3, pageSize: 10 },
      7,
    )

    expect(hoisted.fetchLecturePage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, pageSize: 10 }),
    )
  })
})
