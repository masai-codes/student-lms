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

describe('resourceBookmark.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireSessionUserId).mockResolvedValue(7)
    hoisted.add.mockResolvedValue(undefined)
    hoisted.remove.mockResolvedValue(undefined)
  })

  describe('handleAddResourceBookmark', () => {
    it('adds a bookmark and returns isBookmarked: true', async () => {
      const { handleAddResourceBookmark } =
        await import('../resourceBookmark.handler')

      const response = await handleAddResourceBookmark('515')

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ isBookmarked: true })
      expect(hoisted.add).toHaveBeenCalledWith(7, 'resource', 515)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleAddResourceBookmark } =
        await import('../resourceBookmark.handler')
      const { ApiError } = await import('@/server/api/http/apiError')
      vi.mocked(requireSessionUserId).mockRejectedValueOnce(
        new ApiError(401, 'UNAUTHORIZED'),
      )

      const response = await handleAddResourceBookmark('515')

      expect(response.status).toBe(401)
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid resource id', async () => {
      const { handleAddResourceBookmark } =
        await import('../resourceBookmark.handler')

      const response = await handleAddResourceBookmark('0')

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        code: 'INVALID_RESOURCE_ID',
      })
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('maps a service failure to 500', async () => {
      const { handleAddResourceBookmark } =
        await import('../resourceBookmark.handler')
      hoisted.add.mockRejectedValueOnce(new Error('boom'))

      const response = await handleAddResourceBookmark('515')

      expect(response.status).toBe(500)
    })
  })

  describe('handleRemoveResourceBookmark', () => {
    it('removes a bookmark and returns isBookmarked: false', async () => {
      const { handleRemoveResourceBookmark } =
        await import('../resourceBookmark.handler')

      const response = await handleRemoveResourceBookmark('515')

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ isBookmarked: false })
      expect(hoisted.remove).toHaveBeenCalledWith(7, 'resource', 515)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleRemoveResourceBookmark } =
        await import('../resourceBookmark.handler')
      const { ApiError } = await import('@/server/api/http/apiError')
      vi.mocked(requireSessionUserId).mockRejectedValueOnce(
        new ApiError(401, 'UNAUTHORIZED'),
      )

      const response = await handleRemoveResourceBookmark('515')

      expect(response.status).toBe(401)
      expect(hoisted.remove).not.toHaveBeenCalled()
    })
  })
})
