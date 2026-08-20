import type { DashboardOverview } from '@/server/api/dashboard/getDashboardOverview.service'
import type { DashboardOverviewApp } from '@/server/api/dashboard/getDashboardOverviewApp.service'
import type { DashboardScheduleItem } from '@/server/api/dashboard/schedule/scheduleTypes'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import type { T0FlowDocumentsStatus } from '@/server/api/dashboard/getT0FlowDocuments.service'
import type { UploadProfilePhotoResult } from '@/server/api/dashboard/uploadProfilePhoto.service'
import type { AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'
import type { SaveAgreementResult } from '@/server/api/dashboard/agreement/saveAgreementDetails.service'
import type { SubmitAgreementResult } from '@/server/api/dashboard/agreement/submitAgreement.service'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import { fetchJson } from '@/lib/api/fetchJson'

/**
 * Single consolidated payload for the dashboard — includes the T0 welcome-modal
 * status, guided-tour status, and the primary batch's tour lectures, so the
 * dashboard loads with one GET instead of several.
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return fetchJson<DashboardOverview>(DASHBOARD_API.overview)
}

/** Slim overview for the mobile app (pending tasks + transfer/start banners). */
async function fetchDashboardOverviewApp(): Promise<DashboardOverviewApp> {
  return fetchJson<DashboardOverviewApp>(DASHBOARD_API.overviewApp)
}

async function fetchDashboardPendingTasks(): Promise<{
  pendingTasks: Array<DashboardScheduleItem>
}> {
  return fetchJson<{ pendingTasks: Array<DashboardScheduleItem> }>(
    DASHBOARD_API.pendingTasks,
  )
}

export async function fetchNavbarPillEvent(): Promise<NavbarPillEvent | null> {
  const { event } = await fetchJson<{ event: NavbarPillEvent | null }>(
    DASHBOARD_API.navbarPill,
  )
  return event
}

export async function dismissWelcomeModalApi(): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.welcomeModalDismiss, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

/** On-demand document-upload status for a batch (hits the external admissions API). */
export async function fetchT0FlowDocuments(
  batchId: number,
): Promise<T0FlowDocumentsStatus> {
  return fetchJson<T0FlowDocumentsStatus>(
    `${DASHBOARD_API.t0FlowDocuments}?batchId=${batchId}`,
  )
}

/** Fetches a non-primary batch's guided-tour lectures (the primary batch's come from the overview). */
export async function fetchT0FlowLectures(
  batchId?: number,
): Promise<T0FlowLecturesResult> {
  const url = batchId
    ? `${DASHBOARD_API.t0FlowLectures}?batchId=${batchId}`
    : DASHBOARD_API.t0FlowLectures
  return fetchJson<T0FlowLecturesResult>(url)
}

export async function uploadProfilePhoto(
  image: string,
): Promise<UploadProfilePhotoResult> {
  return fetchJson<UploadProfilePhotoResult>(DASHBOARD_API.profilePhoto, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  })
}

export async function saveAgreementDetailsApi(
  sectionId: number,
  values: AgreementFormValues,
): Promise<SaveAgreementResult> {
  return fetchJson<SaveAgreementResult>(DASHBOARD_API.agreementSave, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId, values }),
  })
}

export async function submitAgreementApi(
  sectionId: number,
): Promise<SubmitAgreementResult> {
  return fetchJson<SubmitAgreementResult>(DASHBOARD_API.agreementSubmit, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId }),
  })
}

/** Stamps the agreement's first-view time (starts the review countdown). Idempotent. */
export async function recordAgreementViewedApi(
  sectionId: number,
): Promise<{ viewTime: string }> {
  return fetchJson<{ viewTime: string }>(DASHBOARD_API.agreementView, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId }),
  })
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
