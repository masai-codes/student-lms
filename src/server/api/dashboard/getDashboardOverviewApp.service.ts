import { getBatchStartBanners } from './getBatchStartBanners.service'
import type { BatchStartBanner } from './getBatchStartBanners.service'
import { getBatchTransferPaymentBanners } from './getBatchTransferPaymentBanners.service'
import type { BatchTransferPaymentBanner } from './getBatchTransferPaymentBanners.service'
import { getDashboardPendingTasks } from './pending/getDashboardPendingTasks.service'
import type { DashboardScheduleItem } from './schedule/scheduleTypes'

/**
 * Slim dashboard payload for the mobile app — only the sections the app
 * surfaces on its home screen (pending tasks + transfer/start banners).
 */
export interface DashboardOverviewApp {
  pendingTasks: Array<DashboardScheduleItem>
  batchTransferPaymentBanners: Array<BatchTransferPaymentBanner>
  batchStartBanners: Array<BatchStartBanner>
}

export async function getDashboardOverviewApp(
  userId: number,
  now: Date = new Date(),
): Promise<DashboardOverviewApp> {
  const [pendingTasks, batchTransferPaymentBanners, batchStartBanners] =
    await Promise.all([
      getDashboardPendingTasks(userId, now),
      getBatchTransferPaymentBanners(userId),
      getBatchStartBanners(userId, now),
    ])

  return {
    pendingTasks,
    batchTransferPaymentBanners,
    batchStartBanners,
  }
}
