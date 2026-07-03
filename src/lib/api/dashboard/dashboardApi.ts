import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { WelcomeModalStatus } from '@/server/api/dashboard/getWelcomeModalStatus.service'
import type { DashboardOverview } from '@/server/api/dashboard/getDashboardOverview.service'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import { fetchJson } from '@/lib/api/fetchJson'

/** Single consolidated payload for the dashboard. */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return fetchJson<DashboardOverview>(DASHBOARD_API.overview)
}

export async function fetchNavbarPillEvent(): Promise<NavbarPillEvent | null> {
  const { event } = await fetchJson<{ event: NavbarPillEvent | null }>(DASHBOARD_API.navbarPill)
  return event
}

export async function fetchWelcomeModalStatus(): Promise<WelcomeModalStatus> {
  return fetchJson<WelcomeModalStatus>(DASHBOARD_API.welcomeModalStatus)
}

export async function dismissWelcomeModalApi(): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.welcomeModalDismiss, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function fetchT0FlowStatus(): Promise<T0FlowStatus> {
  return fetchJson<T0FlowStatus>(DASHBOARD_API.t0FlowStatus)
}

export async function fetchT0FlowLectures(batchId?: number): Promise<T0FlowLecturesResult> {
  const url = batchId ? `${DASHBOARD_API.t0FlowLectures}?batchId=${batchId}` : DASHBOARD_API.t0FlowLectures
  return fetchJson<T0FlowLecturesResult>(url)
}

export async function recordT0FlowStepComplete(
  lectureId: number,
  batchId: number,
  tab: 'lms' | 'program',
  watchedSeconds: number,
): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.t0FlowStepComplete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lectureId, batchId, tab, watchedSeconds }),
  })
}
