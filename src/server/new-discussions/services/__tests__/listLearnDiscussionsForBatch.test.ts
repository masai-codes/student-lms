import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
  getAccessibleSectionIdsForUserInBatch: vi.fn(),
  getUserBatchRestrictions: vi.fn(),
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

vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: hoisted.getUserBatchRestrictions,
}))

describe('listLearnDiscussionsForBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserBatchRestrictions.mockResolvedValue(new Map())
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

  describe('paused batch', () => {
    /**
     * Two lectures — one before the pause date, one after — each with a public
     * discussion, plus the threads lookup. Mirrors the real call order:
     * lectures → assignments → discussions → threads.
     */
    function mockTwoLectureFeed() {
      hoisted.select
        .mockReturnValueOnce({
          from: () => ({
            where: () =>
              Promise.resolve([
                {
                  id: 100,
                  title: 'Before pause',
                  type: 1,
                  schedule: '2026-07-01 10:00:00',
                },
                {
                  id: 200,
                  title: 'After pause',
                  type: 1,
                  schedule: '2026-07-20 10:00:00',
                },
              ]),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({ where: () => Promise.resolve([]) }),
        })
        .mockReturnValueOnce({
          from: () => ({
            leftJoin: () => ({
              where: () => ({
                orderBy: () =>
                  Promise.resolve([
                    discussionRow({ id: 1, entityId: 100 }),
                    discussionRow({ id: 2, entityId: 200 }),
                  ]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({ where: () => Promise.resolve([]) }),
        })
    }

    function discussionRow({
      id,
      entityId,
    }: {
      id: number
      entityId: number
    }) {
      return {
        id,
        title: `Doubt ${id}`,
        message: 'help',
        isClosed: 0,
        public: 1,
        data: null,
        createdAt: '2026-07-01 10:00:00',
        updatedAt: '2026-07-01 10:00:00',
        authorId: 1,
        authorName: 'Student',
        entityType: 'lecture',
        entityId,
      }
    }

    it('hides discussions on content scheduled after the pause date', async () => {
      const { listLearnDiscussionsForBatch } = await import(
        '../listLearnDiscussionsForBatch'
      )
      hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
      hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([11])
      hoisted.getUserBatchRestrictions.mockResolvedValueOnce(
        new Map([[5, { paused: true, pausedDate: '2026-07-10' }]]),
      )
      mockTwoLectureFeed()

      const items = await listLearnDiscussionsForBatch(1, 5)

      expect(items.map((item) => item.contentId)).toEqual([100])
    })

    it('keeps every discussion when the batch is not paused', async () => {
      const { listLearnDiscussionsForBatch } = await import(
        '../listLearnDiscussionsForBatch'
      )
      hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
      hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([11])
      mockTwoLectureFeed()

      const items = await listLearnDiscussionsForBatch(1, 5)

      expect(items.map((item) => item.contentId)).toEqual([100, 200])
    })

    it('ignores a pause on a different batch', async () => {
      const { listLearnDiscussionsForBatch } = await import(
        '../listLearnDiscussionsForBatch'
      )
      hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
      hoisted.getAccessibleSectionIdsForUserInBatch.mockResolvedValueOnce([11])
      hoisted.getUserBatchRestrictions.mockResolvedValueOnce(
        new Map([[9, { paused: true, pausedDate: '2026-07-10' }]]),
      )
      mockTwoLectureFeed()

      const items = await listLearnDiscussionsForBatch(1, 5)

      expect(items.map((item) => item.contentId)).toEqual([100, 200])
    })
  })
})
