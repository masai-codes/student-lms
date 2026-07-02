import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getWelcomeBanners: vi.fn(),
  getAnnouncementsFeed: vi.fn(),
}))

vi.mock('../banners/getWelcomeBanners.service', () => ({
  getWelcomeBanners: hoisted.getWelcomeBanners,
}))
vi.mock('../announcements/getAnnouncementsFeed.service', () => ({
  getAnnouncementsFeed: hoisted.getAnnouncementsFeed,
}))

describe('getDashboardOverview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('composes the welcome banners and announcements under a single payload', async () => {
    const banners = [{ id: 1, title: 'B', description: null, imageUrl: null, ctaUrl: null }]
    const announcements = [
      { id: 2, source: 'a', title: 'A', body: '', authorName: null, isForYou: false, ctaName: null, ctaLink: null },
    ]
    hoisted.getWelcomeBanners.mockResolvedValueOnce(banners)
    hoisted.getAnnouncementsFeed.mockResolvedValueOnce(announcements)
    const { getDashboardOverview } = await import('../getDashboardOverview.service')

    const now = new Date('2026-07-02T00:00:00Z')
    const result = await getDashboardOverview(7, now)

    expect(hoisted.getWelcomeBanners).toHaveBeenCalledWith(7, now)
    expect(hoisted.getAnnouncementsFeed).toHaveBeenCalledWith(7, now)
    expect(result).toEqual({ banners, announcements })
  })
})
