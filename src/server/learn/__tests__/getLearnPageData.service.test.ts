import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GetBatchLearningDataResponse } from '@/server/learn/types'

const hoisted = vi.hoisted(() => ({
  getEnrolledBatches: vi.fn(),
  getBatchLearningData: vi.fn(),
}))

vi.mock('@/server/learn/services/getEnrolledBatches.service', () => ({
  getEnrolledBatchesForUser: hoisted.getEnrolledBatches,
}))
vi.mock('@/server/learn/services/getBatchLearningData.service', () => ({
  getBatchLearningData: hoisted.getBatchLearningData,
}))

const LISTING: GetBatchLearningDataResponse = {
  filterValues: {
    moduleFilterValues: [],
    categoryFilterValues: [],
    typeFilterValues: [],
    priorityFilterValues: [],
    instructorFilterValues: [],
  },
  sections: [],
  learningItems: [],
  pagination: {
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
}

function batch(batchId: number) {
  return {
    batchId,
    courseTitle: `Batch ${batchId}`,
    courseLogo: null,
    showAttendanceReport: false,
    showEvaluationReport: false,
  }
}

describe('getLearnPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getBatchLearningData.mockResolvedValue(LISTING)
  })

  it('returns an empty listing without querying when the user has no batches', async () => {
    const { getLearnPageData } =
      await import('../services/getLearnPageData.service')
    hoisted.getEnrolledBatches.mockResolvedValueOnce([])

    const result = await getLearnPageData({ learningType: 'lecture' }, 7)

    expect(result.batches).toEqual([])
    expect(result.selectedBatchId).toBeNull()
    expect(result.learningItems).toEqual([])
    expect(hoisted.getBatchLearningData).not.toHaveBeenCalled()
  })

  it('uses the requested batch when the user is enrolled in it', async () => {
    const { getLearnPageData } =
      await import('../services/getLearnPageData.service')
    hoisted.getEnrolledBatches.mockResolvedValueOnce([batch(1), batch(2)])

    const result = await getLearnPageData(
      { learningType: 'lecture', batchId: 2 },
      7,
    )

    expect(result.selectedBatchId).toBe(2)
    expect(hoisted.getBatchLearningData).toHaveBeenCalledWith(
      expect.objectContaining({ batchId: 2, learningType: 'lecture' }),
      7,
    )
  })

  it('falls back to the first enrolled batch when the requested one is not enrolled', async () => {
    const { getLearnPageData } =
      await import('../services/getLearnPageData.service')
    hoisted.getEnrolledBatches.mockResolvedValueOnce([batch(5), batch(6)])

    const result = await getLearnPageData(
      { learningType: 'lecture', batchId: 999 },
      7,
    )

    expect(result.selectedBatchId).toBe(5)
  })

  it('defaults to the first enrolled batch when none is requested', async () => {
    const { getLearnPageData } =
      await import('../services/getLearnPageData.service')
    hoisted.getEnrolledBatches.mockResolvedValueOnce([batch(5), batch(6)])

    const result = await getLearnPageData({ learningType: 'assignment' }, 7)

    expect(result.selectedBatchId).toBe(5)
    expect(result.batches).toHaveLength(2)
  })
})
