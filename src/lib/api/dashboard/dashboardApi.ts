import type { DashboardOverview } from '@/server/api/dashboard/getDashboardOverview.service'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
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

export async function fetchNavbarPillEvent(): Promise<NavbarPillEvent | null> {
  const { event } = await fetchJson<{ event: NavbarPillEvent | null }>(DASHBOARD_API.navbarPill)
  return event
}

export async function dismissWelcomeModalApi(): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.welcomeModalDismiss, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

/** Fetches a non-primary batch's guided-tour lectures (the primary batch's come from the overview). */
export async function fetchT0FlowLectures(batchId?: number): Promise<T0FlowLecturesResult> {
  const url = batchId ? `${DASHBOARD_API.t0FlowLectures}?batchId=${batchId}` : DASHBOARD_API.t0FlowLectures
  return fetchJson<T0FlowLecturesResult>(url)
}

export async function uploadProfilePhoto(image: string): Promise<UploadProfilePhotoResult> {
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

export async function submitAgreementApi(sectionId: number): Promise<SubmitAgreementResult> {
  return fetchJson<SubmitAgreementResult>(DASHBOARD_API.agreementSubmit, {
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
