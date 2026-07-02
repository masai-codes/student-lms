import { getWelcomeBanners } from './banners/getWelcomeBanners.service'
import { getAnnouncementsFeed } from './announcements/getAnnouncementsFeed.service'
import {
  DASHBOARD_PRODUCT_UPDATES_LIMIT,
  getProductUpdates,
} from './product-updates/getProductUpdates.service'
import { getSupportSessions } from './support/getSupportSessions.service'
import { selectFeaturedSupportSession } from './support/featuredSupportSession'
import type { DashboardBanner } from './banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from './announcements/announcementFeed'
import type { DashboardProductUpdate } from './product-updates/getProductUpdates.service'
import type { DashboardSupportSession } from './support/getSupportSessions.service'

/**
 * Everything the dashboard needs in a single payload. Each field is produced by
 * its own focused service so this composition stays thin — as more sections are
 * migrated from static UI to live data (schedule, …) they slot in here as
 * additional `await`ed services.
 */
export interface DashboardOverview {
  banners: Array<DashboardBanner>
  announcements: Array<DashboardAnnouncement>
  productUpdates: Array<DashboardProductUpdate>
  /** The single support session the card should feature, or null (card hidden). */
  supportSession: DashboardSupportSession | null
}

export async function getDashboardOverview(
  userId: number,
  now: Date = new Date(),
): Promise<DashboardOverview> {
  const [banners, announcements, productUpdates, supportSessions] = await Promise.all([
    getWelcomeBanners(userId, now),
    getAnnouncementsFeed(userId, now),
    getProductUpdates(userId),
    getSupportSessions(userId, now),
  ])

  return {
    banners,
    announcements,
    // Backend serves a full page (25); the dashboard card shows the top 5.
    productUpdates: productUpdates.slice(0, DASHBOARD_PRODUCT_UPDATES_LIMIT),
    // One card at a time: the live session, else the soonest upcoming one.
    supportSession: selectFeaturedSupportSession(supportSessions, now),
  }
}
