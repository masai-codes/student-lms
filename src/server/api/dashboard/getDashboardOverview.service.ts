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
import { getFeePaymentBanners } from './t0/getFeePaymentBanner.service'
import type { FeePaymentBanner } from './t0/getFeePaymentBanner.service'
import { getBatchStartBanners } from './getBatchStartBanners.service'
import type { BatchStartBanner } from './getBatchStartBanners.service'
import type { DashboardBanner } from './banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from './announcements/announcementFeed'
import type { DashboardProductUpdate } from './product-updates/getProductUpdates.service'
import type { DashboardSupportSession } from './support/getSupportSessions.service'
import type { DashboardScheduleItem } from './schedule/scheduleTypes'
import type { WelcomeModalStatus } from './getWelcomeModalStatus.service'
import type { T0FlowStatus } from './getT0FlowStatus.service'
import type { GuidedTourPlatform } from './t0/guidedTourProgress'

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
  /**
   * T0 onboarding gate + per-batch progress. The primary (first) batch also
   * carries its guided-tour `lectures` inline (`batches[0].lectures`); other
   * batches have `lectures: null` and are fetched on demand when the learner
   * switches batch in the tour.
   */
  t0Flow: T0FlowStatus
  /**
   * One fee-payment banner per partial-fee batch (timer before its deadline,
   * overdue after), each tagged with the course name — rendered as a swipable
   * carousel. Empty for full-fee / non-T0 users.
   */
  feePaymentBanners: Array<FeePaymentBanner>
  /**
   * Banners for enrolled batches with an upcoming start date ("Your course …
   * will start on {date}"), soonest-first. Empty when none are upcoming.
   */
  batchStartBanners: Array<BatchStartBanner>
}

export async function getDashboardOverview(
  userId: number,
  now: Date = new Date(),
  platform: GuidedTourPlatform = 'web',
): Promise<DashboardOverview> {
  const [
    banners,
    announcements,
    productUpdates,
    supportSessions,
    schedule,
    pendingTasks,
    welcomeModal,
    t0Flow,
    feePaymentBanners,
    batchStartBanners,
  ] = await Promise.all([
    getWelcomeBanners(userId, now),
    getAnnouncementsFeed(userId, now),
    getProductUpdates(),
    getSupportSessions(now),
    getDashboardSchedule(userId, now),
    getDashboardPendingTasks(userId, now),
    getWelcomeModalStatus(userId),
    getT0FlowStatus(userId, platform),
    getFeePaymentBanners(userId, now),
    getBatchStartBanners(userId, now),
  ])

  // Only compute lectures for T0 users, for their primary (first) batch, and
  // nest them onto that batch so lectures live in the batch hierarchy.
  const primaryBatchId = t0Flow.batches.at(0)?.batchId
  const primaryLectures =
    t0Flow.showT0Flow && primaryBatchId !== undefined
      ? await getT0FlowLectures(userId, primaryBatchId, platform)
      : null
  const t0FlowWithLectures: T0FlowStatus = {
    ...t0Flow,
    batches: t0Flow.batches.map((batch, index) => ({
      ...batch,
      lectures: index === 0 ? primaryLectures : null,
    })),
  }

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
    t0Flow: t0FlowWithLectures,
    feePaymentBanners,
    batchStartBanners,
  }
}
