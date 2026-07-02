import { getWelcomeBanners } from './banners/getWelcomeBanners.service'
import { getAnnouncementsFeed } from './announcements/getAnnouncementsFeed.service'
import type { DashboardBanner } from './banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from './announcements/announcementFeed'

/**
 * Everything the dashboard needs in a single payload. Each field is produced by
 * its own focused service so this composition stays thin — as more sections are
 * migrated from static UI to live data (schedule, product updates, …) they slot
 * in here as additional `await`ed services.
 */
export interface DashboardOverview {
  banners: Array<DashboardBanner>
  announcements: Array<DashboardAnnouncement>
}

export async function getDashboardOverview(
  userId: number,
  now: Date = new Date(),
): Promise<DashboardOverview> {
  const [banners, announcements] = await Promise.all([
    getWelcomeBanners(userId, now),
    getAnnouncementsFeed(userId, now),
  ])

  return { banners, announcements }
}
