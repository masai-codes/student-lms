import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({ getCurrentUser: vi.fn(), getUserId: vi.fn() }))

vi.mock('@/server/api/me/getCurrentUser.service', () => ({
  getCurrentUser: hoisted.getCurrentUser,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
}))

describe('handleGetCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
  })

  it('returns the user for an authenticated request', async () => {
    hoisted.getCurrentUser.mockResolvedValueOnce({ name: 'Suryakumar' })
    const { handleGetCurrentUser } = await import('../getCurrentUser.handler')

    const response = await handleGetCurrentUser()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ user: { name: 'Suryakumar' } })
  })

  it('returns 401 when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValueOnce(null)
    const { handleGetCurrentUser } = await import('../getCurrentUser.handler')
    expect((await handleGetCurrentUser()).status).toBe(401)
  })

  it('returns a USER_NOT_FOUND error when the user is missing', async () => {
    hoisted.getCurrentUser.mockResolvedValueOnce(null)
    const { handleGetCurrentUser } = await import('../getCurrentUser.handler')
    // 404 is remapped to a CloudFront-safe status; the body carries the code.
    await expect((await handleGetCurrentUser()).json()).resolves.toEqual(
      expect.objectContaining({ code: 'USER_NOT_FOUND' }),
    )
  })
})
