// Shared types for the dashboard feature.
//
// The live sections (welcome banners, announcements, product updates, support
// session, schedule, pending tasks) are driven by the consolidated overview
// query and use the server DTOs directly (see `DashboardOverviewState`). The
// greeting name comes from the `me` API.

import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'
import type { DashboardAnnouncement } from '@/server/api/dashboard/announcements/announcementFeed'
import type { DashboardProductUpdate } from '@/server/api/dashboard/product-updates/getProductUpdates.service'
import type { DashboardSupportSession } from '@/server/api/dashboard/support/getSupportSessions.service'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'
import type { FeePaymentBanner } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'
import type { BatchStartBanner } from '@/server/api/dashboard/getBatchStartBanners.service'

/**
 * Live overview sections + the shared query state. Cards render their own
 * loading / error / empty states from this.
 */
export interface DashboardOverviewState {
  isPending: boolean
  isError: boolean
  banners: Array<DashboardBanner>
  announcements: Array<DashboardAnnouncement>
  productUpdates: Array<DashboardProductUpdate>
  supportSession: DashboardSupportSession | null
  schedule: Array<DashboardScheduleItem>
  pendingTasks: Array<DashboardScheduleItem>
  /** One timer / overdue fee-payment banner per partial-fee batch (swipable). */
  feePaymentBanners: Array<FeePaymentBanner>
  /** Upcoming-batch-start banners (swipable, auto-advancing). */
  batchStartBanners: Array<BatchStartBanner>
}
