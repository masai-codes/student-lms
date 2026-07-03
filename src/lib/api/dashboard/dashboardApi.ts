import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { WelcomeModalStatus } from '@/server/api/dashboard/getWelcomeModalStatus.service'
import type { PaymentBannerInfo } from '@/server/api/dashboard/getPaymentBannerInfo.service'
import type { DashboardOverview } from '@/server/api/dashboard/getDashboardOverview.service'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { NpsFormData } from '@/server/api/dashboard/getNpsForm.service'
import type { NpsSubmissionResult } from '@/server/api/dashboard/createNpsSubmission.service'
import type { AssessLinkResult } from '@/server/api/dashboard/getAssessLink.service'
import type { AgreementDataResponse } from '@/server/api/dashboard/getAgreementData.service'
import type { NpsQuestionAnswer } from '@/server/api/dashboard/submitNpsForm.service'
import type { AgreementDetailsData } from '@/server/api/dashboard/saveAgreementDetails.service'
import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import type { T0FlowStudentStatusResult } from '@/server/api/dashboard/getT0FlowStudentStatus.service'
import { DASHBOARD_API } from '@/lib/api/dashboardPaths'
import { fetchJson } from '@/lib/api/fetchJson'

/** Single consolidated payload for the dashboard (banners for now). */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return fetchJson<DashboardOverview>(DASHBOARD_API.overview)
}

export async function fetchPaymentBannerInfo(): Promise<PaymentBannerInfo | null> {
  const { paymentBanner } = await fetchJson<{ paymentBanner: PaymentBannerInfo | null }>(DASHBOARD_API.paymentBanner)
  return paymentBanner
}

export async function fetchNavbarPillEvent(): Promise<NavbarPillEvent | null> {
  const { event } = await fetchJson<{ event: NavbarPillEvent | null }>(DASHBOARD_API.navbarPill)
  return event
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

export async function fetchT0FlowStatus(): Promise<T0FlowStatus> {
  return fetchJson<T0FlowStatus>(DASHBOARD_API.t0FlowStatus)
}

export async function fetchT0FlowStudentStatus(batchId: number): Promise<T0FlowStudentStatusResult> {
  return fetchJson<T0FlowStudentStatusResult>(
    `${DASHBOARD_API.t0FlowStudentStatus}?batchId=${batchId}`,
  )
}

export async function fetchT0FlowLectures(batchId?: number): Promise<T0FlowLecturesResult> {
  const url = batchId ? `${DASHBOARD_API.t0FlowLectures}?batchId=${batchId}` : DASHBOARD_API.t0FlowLectures
  return fetchJson<T0FlowLecturesResult>(url)
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
