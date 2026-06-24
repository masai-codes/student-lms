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
}))

function request(cookie: string | null = 'session=abc') {
  return new Request('http://localhost/api/learn/resources/515/bookmark', {
    headers: cookie ? { cookie } : {},
  })
}

describe('resourceBookmark.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserIdFromCookieHeader.mockResolvedValue(7)
    hoisted.add.mockResolvedValue(undefined)
    hoisted.remove.mockResolvedValue(undefined)
  })

  describe('handleAddResourceBookmark', () => {
    it('adds a bookmark and returns isBookmarked: true', async () => {
      const { handleAddResourceBookmark } = await import('../resourceBookmark.handler')

      const response = await handleAddResourceBookmark(request(), '515')

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ isBookmarked: true })
      expect(hoisted.add).toHaveBeenCalledWith(7, 'resource', 515)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleAddResourceBookmark } = await import('../resourceBookmark.handler')
      hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

      const response = await handleAddResourceBookmark(request(null), '515')

      expect(response.status).toBe(401)
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('returns 400 for an invalid resource id', async () => {
      const { handleAddResourceBookmark } = await import('../resourceBookmark.handler')

      const response = await handleAddResourceBookmark(request(), '0')

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        code: 'INVALID_RESOURCE_ID',
      })
      expect(hoisted.add).not.toHaveBeenCalled()
    })

    it('maps a service failure to 500', async () => {
      const { handleAddResourceBookmark } = await import('../resourceBookmark.handler')
      hoisted.add.mockRejectedValueOnce(new Error('boom'))

      const response = await handleAddResourceBookmark(request(), '515')

      expect(response.status).toBe(500)
    })
  })

  describe('handleRemoveResourceBookmark', () => {
    it('removes a bookmark and returns isBookmarked: false', async () => {
      const { handleRemoveResourceBookmark } = await import('../resourceBookmark.handler')

      const response = await handleRemoveResourceBookmark(request(), '515')

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({ isBookmarked: false })
      expect(hoisted.remove).toHaveBeenCalledWith(7, 'resource', 515)
    })

    it('returns 401 when unauthenticated', async () => {
      const { handleRemoveResourceBookmark } = await import('../resourceBookmark.handler')
      hoisted.getUserIdFromCookieHeader.mockResolvedValueOnce(null)

      const response = await handleRemoveResourceBookmark(request(null), '515')

      expect(response.status).toBe(401)
      expect(hoisted.remove).not.toHaveBeenCalled()
    })
  })
})
