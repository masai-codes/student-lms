import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
  getAccessibleSectionIdsForUserInBatch: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.select,
  },
}))

vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIdsForEnrolledUser,
}))

vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  getAccessibleSectionIdsForUserInBatch:
    hoisted.getAccessibleSectionIdsForUserInBatch,
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
    expect(hoisted.getAccessibleSectionIdsForUserInBatch).not.toHaveBeenCalled()
    expect(hoisted.select).not.toHaveBeenCalled()
  })

  it('proceeds to query discussions when the viewer is actively enrolled in the batch', async () => {
    const { listLearnDiscussionsForBatch } =
      await import('../listLearnDiscussionsForBatch')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
    hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([11, 12])
    mockEmptyEntityLookups()

    await expect(listLearnDiscussionsForBatch(1, 5)).resolves.toEqual([])
    expect(hoisted.select).toHaveBeenCalledTimes(2)
  })

  it('scopes content to the sections the viewer can actually open, not the whole batch', async () => {
    const { listLearnDiscussionsForBatch } =
      await import('../listLearnDiscussionsForBatch')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
    hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([11])
    mockEmptyEntityLookups()

    await listLearnDiscussionsForBatch(7, 5)

    expect(hoisted.getAccessibleSectionIdsForUserInBatch).toHaveBeenCalledWith(
      7,
      5,
    )
  })

  it('returns nothing when the viewer belongs to no section of an enrolled batch', async () => {
    // A sibling section's public discussion must not leak just because the
    // viewer is in the same (catch-all) batch — the detail page would 404.
    const { listLearnDiscussionsForBatch } =
      await import('../listLearnDiscussionsForBatch')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
    hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([])

    await expect(listLearnDiscussionsForBatch(1, 5)).resolves.toEqual([])
    expect(hoisted.select).not.toHaveBeenCalled()
  })
})
