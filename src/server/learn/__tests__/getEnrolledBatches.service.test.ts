import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
  },
}))

vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIdsForEnrolledUser,
}))

describe('getEnrolledBatchesForUser service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty list when user has no enrolled batch ids', async () => {
    const { getEnrolledBatchesForUser } = await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([])

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('maps db rows to {batchId, courseTitle} and preserves enrollment order', async () => {
    const { getEnrolledBatchesForUser } = await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([1, 2])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 2, name: 'Cohort B', meta: { courseTitle: 'DS Cohort B' } },
            { id: 1, name: 'Cohort A', meta: {} },
          ]),
      }),
    })

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      { batchId: 1, courseTitle: 'Cohort A' },
      { batchId: 2, courseTitle: 'DS Cohort B' },
    ])
  })
})
