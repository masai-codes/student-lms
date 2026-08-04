import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getDashboardOverviewApp: vi.fn(),
  getUserId: vi.fn(),
}))

vi.mock('@/server/api/dashboard/getDashboardOverviewApp.service', () => ({
  getDashboardOverviewApp: hoisted.getDashboardOverviewApp,
}))
vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getUserId,
}))

describe('handleGetDashboardOverviewApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserId.mockResolvedValue(101)
  })

  it('returns the overview-app payload when authenticated', async () => {
    const overview = {
      pendingTasks: [],
      batchTransferPaymentBanners: [
        {
          batchUserId: 10,
          toBatchId: 22,
          courseTitle: 'SDE-2',
          paymentUrl: null,
        },
      ],
      batchStartBanners: [],
    }
    hoisted.getDashboardOverviewApp.mockResolvedValueOnce(overview)
    const { handleGetDashboardOverviewApp } =
      await import('../getDashboardOverviewApp.handler')

    const response = await handleGetDashboardOverviewApp()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(overview)
    expect(hoisted.getDashboardOverviewApp).toHaveBeenCalledWith(
      101,
      expect.any(Date),
    )
  })

  it('returns 401 when unauthenticated', async () => {
    hoisted.getUserId.mockResolvedValueOnce(null)
    const { handleGetDashboardOverviewApp } =
      await import('../getDashboardOverviewApp.handler')

    const response = await handleGetDashboardOverviewApp()

    expect(response.status).toBe(401)
  })

  it('maps an unexpected service failure to a 500', async () => {
    hoisted.getDashboardOverviewApp.mockRejectedValueOnce(new Error('boom'))
    const { handleGetDashboardOverviewApp } =
      await import('../getDashboardOverviewApp.handler')

    const response = await handleGetDashboardOverviewApp()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      code: 'SERVER_ERROR_FETCHING_DASHBOARD_OVERVIEW_APP',
    })
  })
})
