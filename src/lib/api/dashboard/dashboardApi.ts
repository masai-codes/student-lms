import { fetchJson } from '@/lib/api/fetchJson'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import type { NpsFormData } from '@/server/api/dashboard/getNpsForm.service'
import type { NpsSubmissionResult } from '@/server/api/dashboard/createNpsSubmission.service'
import type { AssessLinkResult } from '@/server/api/dashboard/getAssessLink.service'
import type { AgreementDataResponse } from '@/server/api/dashboard/getAgreementData.service'
import type { NpsQuestionAnswer } from '@/server/api/dashboard/submitNpsForm.service'
import type { AgreementDetailsData } from '@/server/api/dashboard/saveAgreementDetails.service'
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

export async function fetchNpsForm(formId: number): Promise<NpsFormData> {
  return fetchJson<NpsFormData>(DASHBOARD_API.npsForm(formId))
}

export async function startNpsSubmission(formId: number): Promise<NpsSubmissionResult> {
  return fetchJson<NpsSubmissionResult>(DASHBOARD_API.npsFormStart(formId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function saveNpsResponse(
  formId: number,
  submissionId: number,
  questionId: number,
  response: unknown,
): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.npsFormResponse(formId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId, questionId, response }),
  })
}

export async function completeNpsSubmission(formId: number, submissionId: number): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.npsFormComplete(formId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  })
}

export async function fetchAssessLink(formId: number): Promise<AssessLinkResult> {
  return fetchJson<AssessLinkResult>(DASHBOARD_API.assessNpsLink(formId))
}

export async function fetchAgreementData(sectionId: number): Promise<AgreementDataResponse> {
  return fetchJson<AgreementDataResponse>(DASHBOARD_API.agreement(sectionId))
}

export async function recordAgreementOpen(sectionId: number): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.agreementOpen(sectionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function saveAgreementDetails(
  sectionId: number,
  data: AgreementDetailsData,
): Promise<{ ipAddress: string; referenceNumber: string }> {
  const res = await fetchJson<{ success: boolean; ipAddress: string; referenceNumber: string }>(
    DASHBOARD_API.agreementDetails(sectionId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    },
  )
  return { ipAddress: res.ipAddress, referenceNumber: res.referenceNumber }
}

export async function recordAgreementStep(sectionId: number, stepKey: string): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.agreementStep(sectionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepKey }),
  })
}

export async function submitAgreement(sectionId: number): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.agreementSubmit(sectionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function dismissAgreement(sectionId: number): Promise<void> {
  await fetchJson<{ success: boolean }>(DASHBOARD_API.agreementDismiss(sectionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function submitNpsFormAnswers(
  formId: number,
  answers: Array<NpsQuestionAnswer>,
): Promise<{ submissionId: number }> {
  return fetchJson<{ submissionId: number }>(DASHBOARD_API.npsForm(formId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
}
