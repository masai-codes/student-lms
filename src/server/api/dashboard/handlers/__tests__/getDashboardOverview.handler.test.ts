import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getDashboardOverview: vi.fn(),
  getUserId: vi.fn(),
}))

vi.mock('@/server/api/dashboard/getDashboardOverview.service', () => ({
  getDashboardOverview: hoisted.getDashboardOverview,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
}))

describe('handleGetDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
  })

  it('returns the overview payload for an authenticated user', async () => {
    const overview = { banners: [{ id: 1, title: 'B', description: null, imageUrl: null, ctaUrl: null }] }
    hoisted.getDashboardOverview.mockResolvedValueOnce(overview)
    const { handleGetDashboardOverview } = await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(overview)
    expect(hoisted.getDashboardOverview).toHaveBeenCalledWith(101)
  })

  it('returns 401 when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValueOnce(null)
    const { handleGetDashboardOverview } = await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview()
    expect(response.status).toBe(401)
  })

  it('maps an unexpected service failure to a 500', async () => {
    hoisted.getDashboardOverview.mockRejectedValueOnce(new Error('boom'))
    const { handleGetDashboardOverview } = await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview()
    expect(response.status).toBe(500)
  })
})
