import { fetchJson } from '@/lib/api/fetchJson'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import type { DashboardAnnouncementItem } from '@/server/api/dashboard/getDashboardAnnouncements.service'
import type { DashboardProductUpdateItem } from '@/server/api/dashboard/getProductUpdates.service'
import type { DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'
import type { DashboardBannerItem } from '@/server/api/dashboard/getDashboardBanners.service'
import type { DashboardActionBannersResult } from '@/server/api/dashboard/getDashboardActionBanners.service'

type GetAnnouncementsResponse = { announcements: Array<DashboardAnnouncementItem> }
type GetProductUpdatesResponse = { productUpdates: Array<DashboardProductUpdateItem> }
type GetScheduleResponse = { schedule: Array<DashboardScheduleItem> }
type GetBannersResponse = { banners: Array<DashboardBannerItem> }

export async function fetchDashboardAnnouncements(): Promise<
  Array<DashboardAnnouncementItem>
> {
  const { announcements } = await fetchJson<GetAnnouncementsResponse>(
    DASHBOARD_API.announcements,
  )
  return announcements
}

export async function fetchProductUpdates(): Promise<
  Array<DashboardProductUpdateItem>
> {
  const { productUpdates } = await fetchJson<GetProductUpdatesResponse>(
    DASHBOARD_API.productUpdates,
  )
  return productUpdates
}

export async function fetchDashboardSchedule(): Promise<
  Array<DashboardScheduleItem>
> {
  const { schedule } = await fetchJson<GetScheduleResponse>(
    DASHBOARD_API.schedule,
  )
  return schedule
}

export async function fetchDashboardBanners(): Promise<
  Array<DashboardBannerItem>
> {
  const { banners } = await fetchJson<GetBannersResponse>(
    DASHBOARD_API.banners,
  )
  return banners
}

export async function fetchDashboardActionBanners(): Promise<DashboardActionBannersResult> {
  return fetchJson<DashboardActionBannersResult>(DASHBOARD_API.actionBanners)
}

export async function fetchDashboardPendingTasks(): Promise<
  Array<DashboardScheduleItem>
> {
  const { pendingTasks } = await fetchJson<{ pendingTasks: Array<DashboardScheduleItem> }>(
    DASHBOARD_API.pendingTasks,
  )
  return pendingTasks
}
