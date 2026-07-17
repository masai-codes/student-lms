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

const webRequest = () => new Request('http://localhost/api/dashboard/overview')
const appRequest = () =>
  new Request('http://localhost/api/dashboard/overview', {
    headers: { 'X-App-Mobile': 'true' },
  })
const mobileViewportRequest = () =>
  new Request('http://localhost/api/dashboard/overview', {
    headers: { 'X-Client-Mobile-Viewport': 'true' },
  })

describe('handleGetDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
  })

  it('returns the overview payload for a web request (platform "web")', async () => {
    const overview = {
      banners: [
        { id: 1, title: 'B', description: null, imageUrl: null, ctaUrl: null },
      ],
    }
    hoisted.getDashboardOverview.mockResolvedValueOnce(overview)
    const { handleGetDashboardOverview } =
      await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview(webRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(overview)
    expect(hoisted.getDashboardOverview).toHaveBeenCalledWith(
      101,
      expect.any(Date),
      'web',
    )
  })

  it('uses platform "app" when the request carries the X-App-Mobile header', async () => {
    hoisted.getDashboardOverview.mockResolvedValueOnce({ banners: [] })
    const { handleGetDashboardOverview } =
      await import('../getDashboardOverview.handler')

    await handleGetDashboardOverview(appRequest())

    expect(hoisted.getDashboardOverview).toHaveBeenCalledWith(
      101,
      expect.any(Date),
      'app',
    )
  })

  it('uses platform "app" on a mobile-viewport browser (X-Client-Mobile-Viewport)', async () => {
    hoisted.getDashboardOverview.mockResolvedValueOnce({ banners: [] })
    const { handleGetDashboardOverview } =
      await import('../getDashboardOverview.handler')

    await handleGetDashboardOverview(mobileViewportRequest())

    expect(hoisted.getDashboardOverview).toHaveBeenCalledWith(
      101,
      expect.any(Date),
      'app',
    )
  })

  it('returns 401 when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValueOnce(null)
    const { handleGetDashboardOverview } =
      await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview(webRequest())
    expect(response.status).toBe(401)
  })

  it('maps an unexpected service failure to a 500', async () => {
    hoisted.getDashboardOverview.mockRejectedValueOnce(new Error('boom'))
    const { handleGetDashboardOverview } =
      await import('../getDashboardOverview.handler')

    const response = await handleGetDashboardOverview(webRequest())
    expect(response.status).toBe(500)
  })
})
