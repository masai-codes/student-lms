import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getWelcomeBanners: vi.fn(),
  getAnnouncementsFeed: vi.fn(),
  getProductUpdates: vi.fn(),
  getSupportSessions: vi.fn(),
  getDashboardSchedule: vi.fn(),
  getDashboardPendingTasks: vi.fn(),
}))

vi.mock('../banners/getWelcomeBanners.service', () => ({
  getWelcomeBanners: hoisted.getWelcomeBanners,
}))
vi.mock('../announcements/getAnnouncementsFeed.service', () => ({
  getAnnouncementsFeed: hoisted.getAnnouncementsFeed,
}))
vi.mock('../product-updates/getProductUpdates.service', () => ({
  getProductUpdates: hoisted.getProductUpdates,
  DASHBOARD_PRODUCT_UPDATES_LIMIT: 5,
}))
vi.mock('../support/getSupportSessions.service', () => ({
  getSupportSessions: hoisted.getSupportSessions,
}))
vi.mock('../schedule/getDashboardSchedule.service', () => ({
  getDashboardSchedule: hoisted.getDashboardSchedule,
}))
vi.mock('../pending/getDashboardPendingTasks.service', () => ({
  getDashboardPendingTasks: hoisted.getDashboardPendingTasks,
}))

const banners = [{ id: 1, title: 'B', description: null, imageUrl: null, ctaUrl: null }]
const announcements = [
  { id: 2, source: 'a', title: 'A', body: '', authorName: null, isForYou: false, ctaName: null, ctaLink: null },
]
const liveSession = {
  id: 3,
  title: 'Support',
  schedule: '2026-07-02T11:00:00+05:30',
  concludes: '2026-07-02T13:00:00+05:30',
  zoomLink: 'https://zoom.us/j/1',
  status: 'live',
}

describe('getDashboardOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getWelcomeBanners.mockResolvedValue(banners)
    hoisted.getAnnouncementsFeed.mockResolvedValue(announcements)
    hoisted.getSupportSessions.mockResolvedValue([liveSession])
    hoisted.getDashboardSchedule.mockResolvedValue([])
    hoisted.getDashboardPendingTasks.mockResolvedValue([])
  })

  it('composes every section and features the selected support session', async () => {
    const productUpdates = [{ id: 9, title: 'Update', imageUrl: null }]
    const schedule = [{ id: 4, learningType: 'lecture', title: 'Workshop' }]
    const pendingTasks = [{ id: 5, learningType: 'assignment', title: 'Worksheet' }]
    hoisted.getProductUpdates.mockResolvedValueOnce(productUpdates)
    hoisted.getDashboardSchedule.mockResolvedValueOnce(schedule)
    hoisted.getDashboardPendingTasks.mockResolvedValueOnce(pendingTasks)
    const { getDashboardOverview } = await import('../getDashboardOverview.service')

    const now = new Date('2026-07-02T00:00:00Z')
    const result = await getDashboardOverview(7, now)

    expect(hoisted.getWelcomeBanners).toHaveBeenCalledWith(7, now)
    expect(hoisted.getAnnouncementsFeed).toHaveBeenCalledWith(7, now)
    expect(hoisted.getProductUpdates).toHaveBeenCalledWith(7)
    expect(hoisted.getSupportSessions).toHaveBeenCalledWith(7, now)
    expect(hoisted.getDashboardSchedule).toHaveBeenCalledWith(7, now)
    expect(hoisted.getDashboardPendingTasks).toHaveBeenCalledWith(7, now)
    expect(result).toEqual({
      banners,
      announcements,
      productUpdates,
      supportSession: liveSession,
      schedule,
      pendingTasks,
    })
  })

  it('caps product updates at the dashboard limit of 5', async () => {
    hoisted.getProductUpdates.mockResolvedValueOnce(
      Array.from({ length: 8 }, (_, i) => ({ id: i, title: `U${i}`, imageUrl: null })),
    )
    const { getDashboardOverview } = await import('../getDashboardOverview.service')

    const result = await getDashboardOverview(7, new Date('2026-07-02T00:00:00Z'))
    expect(result.productUpdates).toHaveLength(5)
    expect(result.productUpdates.map((u) => u.id)).toEqual([0, 1, 2, 3, 4])
  })
})
