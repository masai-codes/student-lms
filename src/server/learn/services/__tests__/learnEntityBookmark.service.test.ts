import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.select,
    insert: hoisted.insert,
    update: hoisted.update,
    delete: hoisted.delete,
  },
}))

/** select(...).from(...).where(...).limit(...) resolves to `rows`. */
function mockSelectOnce(rows: Array<unknown>) {
  hoisted.select.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(rows),
      }),
    }),
  })
}

async function importService() {
  return import('../learnEntityBookmark.service')
}

describe('learnEntityBookmark.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLearnEntityBookmarkState', () => {
    it('returns true when an active bookmark row exists', async () => {
      mockSelectOnce([{ id: 5 }])
      const { getLearnEntityBookmarkState } = await importService()

      await expect(
        getLearnEntityBookmarkState(1, 'resource', 515),
      ).resolves.toBe(true)
    })

    it('returns false when no active bookmark row exists', async () => {
      mockSelectOnce([])
      const { getLearnEntityBookmarkState } = await importService()

      await expect(
        getLearnEntityBookmarkState(1, 'lecture', 99),
      ).resolves.toBe(false)
    })
  })

  describe('addLearnEntityBookmark', () => {
    it('inserts a new row when none exists', async () => {
      mockSelectOnce([])
      const values = vi.fn().mockResolvedValue(undefined)
      hoisted.insert.mockReturnValue({ values })
      const { addLearnEntityBookmark } = await importService()

      await addLearnEntityBookmark(7, 'resource', 515)

      expect(hoisted.insert).toHaveBeenCalledTimes(1)
      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          entityType: 'App\\Models\\Lecture',
          entityId: 515,
          isBookmarked: 1,
        }),
      )
      expect(hoisted.update).not.toHaveBeenCalled()
    })

    it('reactivates an existing soft-removed row', async () => {
      mockSelectOnce([{ id: 12, isBookmarked: 0 }])
      const where = vi.fn().mockResolvedValue(undefined)
      const set = vi.fn().mockReturnValue({ where })
      hoisted.update.mockReturnValue({ set })
      const { addLearnEntityBookmark } = await importService()

      await addLearnEntityBookmark(7, 'assignment', 78465)

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ isBookmarked: 1 }),
      )
      expect(hoisted.insert).not.toHaveBeenCalled()
    })

    it('is a no-op when already bookmarked', async () => {
      mockSelectOnce([{ id: 12, isBookmarked: 1 }])
      const { addLearnEntityBookmark } = await importService()

      await addLearnEntityBookmark(7, 'resource', 515)

      expect(hoisted.insert).not.toHaveBeenCalled()
      expect(hoisted.update).not.toHaveBeenCalled()
    })
  })

  describe('removeLearnEntityBookmark', () => {
    it('deletes the bookmark row for the entity', async () => {
      const where = vi.fn().mockResolvedValue(undefined)
      hoisted.delete.mockReturnValue({ where })
      const { removeLearnEntityBookmark } = await importService()

      await removeLearnEntityBookmark(7, 'resource', 515)

      expect(hoisted.delete).toHaveBeenCalledTimes(1)
      expect(where).toHaveBeenCalledTimes(1)
    })
  })
})
