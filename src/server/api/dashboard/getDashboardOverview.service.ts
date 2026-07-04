import { getWelcomeBanners } from './banners/getWelcomeBanners.service'
import { getAnnouncementsFeed } from './announcements/getAnnouncementsFeed.service'
import {
  DASHBOARD_PRODUCT_UPDATES_LIMIT,
  getProductUpdates,
} from './product-updates/getProductUpdates.service'
import { getSupportSessions } from './support/getSupportSessions.service'
import { selectFeaturedSupportSession } from './support/featuredSupportSession'
import { getDashboardSchedule } from './schedule/getDashboardSchedule.service'
import { getDashboardPendingTasks } from './pending/getDashboardPendingTasks.service'
import { getWelcomeModalStatus } from './getWelcomeModalStatus.service'
import { getT0FlowStatus } from './getT0FlowStatus.service'
import { getT0FlowLectures } from './getT0FlowLectures.service'
import type { DashboardBanner } from './banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from './announcements/announcementFeed'
import type { DashboardProductUpdate } from './product-updates/getProductUpdates.service'
import type { DashboardSupportSession } from './support/getSupportSessions.service'
import type { DashboardScheduleItem } from './schedule/scheduleTypes'
import type { WelcomeModalStatus } from './getWelcomeModalStatus.service'
import type { T0FlowStatus } from './getT0FlowStatus.service'
import type { T0FlowLecturesResult } from './getT0FlowLectures.service'

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
  /** Lectures + assignments over the next 7 days (soonest first). */
  schedule: Array<DashboardScheduleItem>
  /** Pending assignments (not begun) + catch-up-eligible lectures. */
  pendingTasks: Array<DashboardScheduleItem>
  /** Whether to show the one-time welcome modal. */
  welcomeModal: WelcomeModalStatus
  /** T0 onboarding gate + per-batch progress. */
  t0Flow: T0FlowStatus
  /**
   * Guided-tour lectures for the primary (first) batch — only when the user is
   * in the T0 flow, else null. Other batches are fetched on demand when the
   * learner switches batch in the tour.
   */
  t0FlowLectures: T0FlowLecturesResult | null
}

export async function getDashboardOverview(
  userId: number,
  now: Date = new Date(),
): Promise<DashboardOverview> {
  const [banners, announcements, productUpdates, supportSessions, schedule, pendingTasks, welcomeModal, t0Flow] =
    await Promise.all([
      getWelcomeBanners(userId, now),
      getAnnouncementsFeed(userId, now),
      getProductUpdates(userId),
      getSupportSessions(userId, now),
      getDashboardSchedule(userId, now),
      getDashboardPendingTasks(userId, now),
      getWelcomeModalStatus(userId),
      getT0FlowStatus(userId),
    ])

  // Only compute lectures for T0 users, for their primary (first) batch.
  const primaryBatchId = t0Flow.batches.at(0)?.batchId
  const t0FlowLectures =
    t0Flow.showT0Flow && primaryBatchId !== undefined ? await getT0FlowLectures(userId, primaryBatchId) : null

  return {
    banners,
    announcements,
    // Backend serves a full page (25); the dashboard card shows the top 5.
    productUpdates: productUpdates.slice(0, DASHBOARD_PRODUCT_UPDATES_LIMIT),
    // One card at a time: the live session, else the soonest upcoming one.
    supportSession: selectFeaturedSupportSession(supportSessions, now),
    schedule,
    pendingTasks,
    welcomeModal,
    t0Flow,
    t0FlowLectures,
  }
}
