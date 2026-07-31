import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getDashboardPendingTasks: vi.fn(),
  getBatchTransferPaymentBanners: vi.fn(),
  getBatchStartBanners: vi.fn(),
}))

vi.mock('../pending/getDashboardPendingTasks.service', () => ({
  getDashboardPendingTasks: hoisted.getDashboardPendingTasks,
}))
vi.mock('../getBatchTransferPaymentBanners.service', () => ({
  getBatchTransferPaymentBanners: hoisted.getBatchTransferPaymentBanners,
}))
vi.mock('../getBatchStartBanners.service', () => ({
  getBatchStartBanners: hoisted.getBatchStartBanners,
}))

describe('getDashboardOverviewApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('composes pending tasks + transfer/start banners for the user', async () => {
    const now = new Date('2026-07-31T10:00:00+05:30')
    const pendingTasks = [
      {
        id: 1,
        learningType: 'assignment' as const,
        title: 'Finish sprint',
        courseName: null,
        enableZoomWebView: false,
      },
    ]
    const batchTransferPaymentBanners = [
      {
        batchUserId: 10,
        toBatchId: 22,
        courseTitle: 'SDE-2',
        paymentUrl: '/api/admissions/enrolment-payment-redirect?enrolmentId=99',
      },
    ]
    const batchStartBanners = [
      {
        batchId: 5,
        courseTitle: 'SDE-1',
        startDate: '2026-08-12',
        startDateLabel: '12 Aug 2026',
      },
    ]
    hoisted.getDashboardPendingTasks.mockResolvedValueOnce(pendingTasks)
    hoisted.getBatchTransferPaymentBanners.mockResolvedValueOnce(
      batchTransferPaymentBanners,
    )
    hoisted.getBatchStartBanners.mockResolvedValueOnce(batchStartBanners)

    const { getDashboardOverviewApp } =
      await import('../getDashboardOverviewApp.service')
    const result = await getDashboardOverviewApp(7, now)

    expect(result).toEqual({
      pendingTasks,
      batchTransferPaymentBanners,
      batchStartBanners,
    })
    expect(hoisted.getDashboardPendingTasks).toHaveBeenCalledWith(7, now)
    expect(hoisted.getBatchTransferPaymentBanners).toHaveBeenCalledWith(7)
    expect(hoisted.getBatchStartBanners).toHaveBeenCalledWith(7, now)
  })

  it('returns empty arrays when every sub-service yields none', async () => {
    hoisted.getDashboardPendingTasks.mockResolvedValueOnce([])
    hoisted.getBatchTransferPaymentBanners.mockResolvedValueOnce([])
    hoisted.getBatchStartBanners.mockResolvedValueOnce([])

    const { getDashboardOverviewApp } =
      await import('../getDashboardOverviewApp.service')
    await expect(getDashboardOverviewApp(7)).resolves.toEqual({
      pendingTasks: [],
      batchTransferPaymentBanners: [],
      batchStartBanners: [],
    })
  })
})
