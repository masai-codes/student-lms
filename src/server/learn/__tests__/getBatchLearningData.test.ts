import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetBatchLearningDataInput } from '@/server/learn/types'

const hoisted = vi.hoisted(() => ({
  getBatchLearningDataService: vi.fn(),
}))

vi.mock('@/server/learn/services/getBatchLearningData.service', () => ({
  getBatchLearningData: hoisted.getBatchLearningDataService,
}))

describe('getBatchLearningData api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns learning data payload from service', async () => {
    const { getBatchLearningDataHandler } =
      await import('../getBatchLearningData')
    const input: GetBatchLearningDataInput = {
      batchId: 1,
      learningType: 'lecture',
      page: 1,
      pageSize: 10,
    }
    const payload = {
      filterValues: {
        moduleFilterValues: ['Module 1'],
        categoryFilterValues: ['coding'],
        typeFilterValues: ['live'],
        priorityFilterValues: ['recommended'],
        instructorFilterValues: ['Ananya Singh'],
      },
      learningItems: [
        {
          id: 101,
          learningType: 'lecture',
          title: 'React Intro',
          hostName: 'Ananya Singh',
          scheduleDate: '2026-05-10 10:00:00',
          type: 'live',
          category: 'coding',
          isOptional: 'recommended',
          moduleName: 'Module 1',
          attendance: null,
          assignmentProgressStatus: null,
          resourcePhase: null,
          listingCtas: {
            joinLive: 'hidden',
            showAttendance: false,
            assignmentStatusChip: null,
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
    hoisted.getBatchLearningDataService.mockResolvedValueOnce(payload)

    await expect(
      getBatchLearningDataHandler({ data: input, userId: 1 }),
    ).resolves.toEqual(payload)
    expect(hoisted.getBatchLearningDataService).toHaveBeenCalledWith(input, 1)
  })

  it('throws stable server error when service fails', async () => {
    const { getBatchLearningDataHandler } =
      await import('../getBatchLearningData')
    const input: GetBatchLearningDataInput = {
      batchId: 1,
      learningType: 'assignment',
    }
    hoisted.getBatchLearningDataService.mockRejectedValueOnce(
      new Error('db fail'),
    )

    await expect(
      getBatchLearningDataHandler({ data: input, userId: 1 }),
    ).rejects.toThrow('SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA')
  })
})
