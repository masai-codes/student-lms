import { fetchJson } from '@/lib/api/fetchJson'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import type { DashboardAnnouncementItem } from '@/server/api/dashboard/getDashboardAnnouncements.service'
import type { DashboardProductUpdateItem } from '@/server/api/dashboard/getProductUpdates.service'
import type { DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'
import type { DashboardBannerItem } from '@/server/api/dashboard/getDashboardBanners.service'
import type { DashboardActionBannersResult } from '@/server/api/dashboard/getDashboardActionBanners.service'
import type { LmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'
import type { BatchAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import type { EnrolledBatch } from '@/server/learn/types'

export interface DashboardRightSectionData {
  announcements: Array<DashboardAnnouncementItem>
  productUpdates: Array<DashboardProductUpdateItem>
  lmsSupport: LmsSupportInfo
  attendance: Array<BatchAttendance>
  batches: Array<EnrolledBatch>
}

export async function fetchDashboardRightSection(): Promise<DashboardRightSectionData> {
  return fetchJson<DashboardRightSectionData>(DASHBOARD_API.rightSection)
}

export interface DashboardLeftSectionData {
  schedule: Array<DashboardScheduleItem>
  banners: Array<DashboardBannerItem>
  actionBanners: DashboardActionBannersResult
  pendingTasksCount: number
}

export async function fetchDashboardLeftSection(): Promise<DashboardLeftSectionData> {
  return fetchJson<DashboardLeftSectionData>(DASHBOARD_API.leftSection)
}

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

export async function fetchDashboardAttendance(): Promise<Array<BatchAttendance>> {
  const { attendance } = await fetchJson<{ attendance: Array<BatchAttendance> }>(
    DASHBOARD_API.attendance,
  )
  return attendance
}

export async function fetchNavbarPillEvent(): Promise<NavbarPillEvent | null> {
  const { event } = await fetchJson<{ event: NavbarPillEvent | null }>(DASHBOARD_API.navbarPill)
  return event
}

export async function fetchLmsSupportInfo(): Promise<LmsSupportInfo> {
  const { lmsSupport } = await fetchJson<{ lmsSupport: LmsSupportInfo }>(
    DASHBOARD_API.lmsSupport,
  )
  return lmsSupport
}
