import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  getUserIdFromCookieHeader: vi.fn(),
}))

vi.mock('@/server/learn/services/learnEntityBookmark.service', () => ({
  addLearnEntityBookmark: hoisted.add,
  removeLearnEntityBookmark: hoisted.remove,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getUserIdFromCookieHeader: hoisted.getUserIdFromCookieHeader,
  getUserIdFromRequest: hoisted.getUserIdFromCookieHeader,
}))

describe('lectureBookmark.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserIdFromCookieHeader.mockResolvedValue(7)
    hoisted.add.mockResolvedValue(undefined)
    hoisted.remove.mockResolvedValue(undefined)
  })

  describe('handleAddLectureBookmark', () => {
    it('adds a bookmark and returns isBookmarked: true', async () => {
      const { handleAddLectureBookmark } =
        await import('../lectureBookmark.handler')

      const res = await handleAddLectureBookmark('572')

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ isBookmarked: true })
      expect(hoisted.add).toHaveBeenCalledWith(7, 'lecture', 572)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleAddLectureBookmark } =
        await import('../lectureBookmark.handler')
      hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

      const res = await handleAddLectureBookmark('572')

      expect(res.status).toBe(401)
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid lecture id', async () => {
      const { handleAddLectureBookmark } =
        await import('../lectureBookmark.handler')

      const res = await handleAddLectureBookmark('0')

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toMatchObject({
        code: 'INVALID_LECTURE_ID',
      })
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('maps a service failure to 500', async () => {
      const { handleAddLectureBookmark } =
        await import('../lectureBookmark.handler')
      hoisted.add.mockRejectedValueOnce(new Error('boom'))

      const res = await handleAddLectureBookmark('572')

      expect(res.status).toBe(500)
    })
  })

  describe('handleRemoveLectureBookmark', () => {
    it('removes a bookmark and returns isBookmarked: false', async () => {
      const { handleRemoveLectureBookmark } =
        await import('../lectureBookmark.handler')

      const res = await handleRemoveLectureBookmark('572')

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ isBookmarked: false })
      expect(hoisted.remove).toHaveBeenCalledWith(7, 'lecture', 572)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleRemoveLectureBookmark } =
        await import('../lectureBookmark.handler')
      hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

      const res = await handleRemoveLectureBookmark('572')

      expect(res.status).toBe(401)
      expect(hoisted.remove).not.toHaveBeenCalled()
    })
  })
})
