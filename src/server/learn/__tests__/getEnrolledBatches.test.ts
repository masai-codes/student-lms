import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getCurrentSessionUserId: vi.fn(),
  getEnrolledBatchesForUser: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentSessionUserId: hoisted.getCurrentSessionUserId,
}))

vi.mock('@/server/learn/services/getEnrolledBatches.service', () => ({
  getEnrolledBatchesForUser: hoisted.getEnrolledBatchesForUser,
}))

describe('getEnrolledBatches api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns enrolled batches for current session user', async () => {
    const { getEnrolledBatchesHandler } = await import('../getEnrolledBatches')
    hoisted.getCurrentSessionUserId.mockResolvedValueOnce(101)
    hoisted.getEnrolledBatchesForUser.mockResolvedValueOnce([
      { batchId: 11, courseTitle: 'Cohort A', courseLogo: null },
    ])

    await expect(getEnrolledBatchesHandler()).resolves.toEqual([
      { batchId: 11, courseTitle: 'Cohort A', courseLogo: null },
    ])
    expect(hoisted.getEnrolledBatchesForUser).toHaveBeenCalledWith(101)
  })

  it('throws unauthorized when session user is missing', async () => {
    const { getEnrolledBatchesHandler } = await import('../getEnrolledBatches')
    hoisted.getCurrentSessionUserId.mockResolvedValueOnce(null)

    await expect(getEnrolledBatchesHandler()).rejects.toThrow('UNAUTHORIZED')
  })

  it('throws stable server error when service fails', async () => {
    const { getEnrolledBatchesHandler } = await import('../getEnrolledBatches')
    hoisted.getCurrentSessionUserId.mockResolvedValueOnce(101)
    hoisted.getEnrolledBatchesForUser.mockRejectedValueOnce(new Error('db fail'))

    await expect(getEnrolledBatchesHandler()).rejects.toThrow(
      'SERVER_ERROR_FETCHING_ENROLLED_BATCHES'
    )
  })
})
