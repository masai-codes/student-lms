import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.select,
  },
}))

vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIdsForEnrolledUser,
}))

describe('listLearnDiscussionsForBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockEmptyEntityLookups() {
    // lectures query, then assignments query — both empty.
    hoisted.select
      .mockReturnValueOnce({
        from: () => ({ where: () => Promise.resolve([]) }),
      })
      .mockReturnValueOnce({
        from: () => ({ where: () => Promise.resolve([]) }),
      })
  }

  it('returns no discussions when the viewer is not actively enrolled in the batch', async () => {
    const { listLearnDiscussionsForBatch } =
      await import('../listLearnDiscussionsForBatch')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([2, 3])

    await expect(listLearnDiscussionsForBatch(1, 99)).resolves.toEqual([])
    expect(hoisted.select).not.toHaveBeenCalled()
  })

  it('proceeds to query discussions when the viewer is actively enrolled in the batch', async () => {
    const { listLearnDiscussionsForBatch } =
      await import('../listLearnDiscussionsForBatch')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
    mockEmptyEntityLookups()

    await expect(listLearnDiscussionsForBatch(1, 5)).resolves.toEqual([])
    expect(hoisted.select).toHaveBeenCalledTimes(2)
  })
})
