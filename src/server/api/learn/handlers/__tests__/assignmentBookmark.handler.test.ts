import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

const hoisted = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/server/learn/services/learnEntityBookmark.service', () => ({
  addLearnEntityBookmark: hoisted.add,
  removeLearnEntityBookmark: hoisted.remove,
}))
vi.mock('@/server/api/http/requireSessionUser', () => ({
  requireSessionUserId: vi.fn(),
}))

describe('assignmentBookmark.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.add.mockResolvedValue(undefined)
    hoisted.remove.mockResolvedValue(undefined)
  })

  describe('handleAddAssignmentBookmark', () => {
    it('adds a bookmark and returns isBookmarked: true', async () => {
      const { handleAddAssignmentBookmark } =
        await import('../assignmentBookmark.handler')

      const res = await handleAddAssignmentBookmark('79293')

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ isBookmarked: true })
      expect(hoisted.add).toHaveBeenCalledWith(7, 'assignment', 79293)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleAddAssignmentBookmark } =
        await import('../assignmentBookmark.handler')
      const { ApiError } = await import('@/server/api/http/apiError')
      vi.mocked(requireSessionUserId).mockRejectedValueOnce(
        new ApiError(401, 'UNAUTHORIZED'),
      )

      const res = await handleAddAssignmentBookmark('79293')

      expect(res.status).toBe(401)
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid assignment id', async () => {
      const { handleAddAssignmentBookmark } =
        await import('../assignmentBookmark.handler')

      const res = await handleAddAssignmentBookmark('0')

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toMatchObject({
        code: 'INVALID_ASSIGNMENT_ID',
      })
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('maps a service failure to 500', async () => {
      const { handleAddAssignmentBookmark } =
        await import('../assignmentBookmark.handler')
      hoisted.add.mockRejectedValueOnce(new Error('boom'))

      const res = await handleAddAssignmentBookmark('79293')

      expect(res.status).toBe(500)
    })
  })

  describe('handleRemoveAssignmentBookmark', () => {
    it('removes a bookmark and returns isBookmarked: false', async () => {
      const { handleRemoveAssignmentBookmark } =
        await import('../assignmentBookmark.handler')

      const res = await handleRemoveAssignmentBookmark('79293')

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ isBookmarked: false })
      expect(hoisted.remove).toHaveBeenCalledWith(7, 'assignment', 79293)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleRemoveAssignmentBookmark } =
        await import('../assignmentBookmark.handler')
      const { ApiError } = await import('@/server/api/http/apiError')
      vi.mocked(requireSessionUserId).mockRejectedValueOnce(
        new ApiError(401, 'UNAUTHORIZED'),
      )

      const res = await handleRemoveAssignmentBookmark('79293')

      expect(res.status).toBe(401)
      expect(hoisted.remove).not.toHaveBeenCalled()
    })
  })
})
