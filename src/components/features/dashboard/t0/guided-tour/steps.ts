import type { AgreementSection } from '@/server/api/dashboard/agreement/getAgreementRenderData.service'
import type {
  T0FlowLectureItem,
  T0FlowLecturesResult,
} from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'
import { isIHubPortal } from '@/utils/portal'

/**
 * Pure step-model builders for the guided tour. Each tab is a list of steps the
 * UI renders in order; a step is either a **video** (watch to complete, reports
 * back to the backend) or a **fixed** action (profile photo, download app,
 * agreement, …) whose completion comes from the T0 status / lectures payload.
 */

export type GuidedTourStepKind = 'video' | 'fixed'

export interface GuidedTourStep {
  /** Stable key for React + `data-testid`. */
  key: string
  kind: GuidedTourStepKind
  title: string
  completed: boolean
  /** Present for video steps — the lecture to play + report against. */
  video?: { lectureId: number; videoUrl: string | null }
  /** Present for fixed steps — what kind of action row to render. */
  action?:
    | 'profile-photo'
    | 'download-app'
    | 'agreement'
    | 'documents'
    | 'student-kit'
    | 'id-card'
  /** Present for the agreement action — the full render detail for that section. */
  agreement?: AgreementSection
  /** Present for the student-kit action. */
  studentKit?: StudentKitStatus
  /** Present for the id-card action — the card URL + whether it's unlocked. */
  idCard?: { url: string | null; unlocked: boolean }
  /** Gated behind an earlier step (e.g. documents/kit locked until agreement signed). */
  locked?: boolean
}

function videoStep(
  item: T0FlowLectureItem,
  completedIds: ReadonlySet<number>,
): GuidedTourStep {
  return {
    key: `lecture-${item.lectureId}`,
    kind: 'video',
    title: item.title,
    completed: completedIds.has(item.lectureId),
    video: { lectureId: item.lectureId, videoUrl: item.videoUrl },
  }
}

/**
 * LMS Walkthrough steps: the walkthrough videos followed by the fixed steps
 * (profile photo, and — Masai only — download app). Completion of the fixed
 * steps mirrors the backend denominator (`lmsWalkthroughExtraSteps`): iHub has
 * no mobile app, so the download-app step is dropped here AND from the backend
 * total to keep the progress bar reachable. The lite (non-T0) flow has no
 * walkthrough videos — strictly the fixed steps.
 */
export function buildLmsSteps(
  lectures: T0FlowLecturesResult,
  status: T0FlowStatus,
  flowVariant: 'full' | 'lite',
): Array<GuidedTourStep> {
  const completedIds = new Set(lectures.completedLectureIds)
  const videoSteps =
    flowVariant === 'lite'
      ? []
      : lectures.lmsLectures.map((l) => videoStep(l, completedIds))

  const fixedSteps: Array<GuidedTourStep> = [
    {
      key: 'profile-photo',
      kind: 'fixed',
      title: 'Add your profile photo',
      completed: status.profilePhotoUrl !== null,
      action: 'profile-photo',
    },
  ]

  if (!isIHubPortal()) {
    fixedSteps.push({
      key: 'download-app',
      kind: 'fixed',
      title: 'Download the mobile app',
      completed: status.downloadAppCompleted,
      action: 'download-app',
    })
  }

  return [...videoSteps, ...fixedSteps]
}

/**
 * Program Onboarding steps.
 * - **Full (T0):** the onboarding videos, the agreement (if the batch has one),
 *   plus the non-counted extras — document upload, student kit, and the ID-card
 *   reveal — shown when applicable.
 * - **Lite (non-T0):** strictly the agreement step. All video / documents /
 *   student-kit / ID-card extras are suppressed.
 */
export function buildProgramSteps(
  lectures: T0FlowLecturesResult,
  flowVariant: 'full' | 'lite',
): Array<GuidedTourStep> {
  const completedIds = new Set(lectures.completedLectureIds)
  const isLite = flowVariant === 'lite'
  const videoSteps = isLite
    ? []
    : lectures.programLectures.map((l) => videoStep(l, completedIds))

  const agreementSteps: Array<GuidedTourStep> =
    lectures.legalAgreementSections.map((a) => ({
      key: `agreement-${a.sectionId}`,
      kind: 'fixed',
      title: a.sectionName || 'Sign your agreement',
      completed: a.completed,
      action: 'agreement',
      agreement: a,
    }))

  // Lite is agreement-only — no documents / kit / ID-card capstone.
  if (isLite) return [...agreementSteps]

  // Documents + student kit are optional steps — always available (not gated on
  // the agreement). Visibility is decided solely by the admissions API.
  const extraSteps: Array<GuidedTourStep> = []
  if (lectures.isDocumentsRequired) {
    // Green-checked once the admissions API reports the documents as uploaded.
    extraSteps.push({
      key: 'documents',
      kind: 'fixed',
      title: 'Upload your documents',
      completed: lectures.documentsUploaded,
      action: 'documents',
    })
  }
  if (lectures.studentKit.applicable) {
    extraSteps.push({
      key: 'student-kit',
      kind: 'fixed',
      title: 'Track your student kit',
      completed: lectures.studentKit.detailsFilled,
      action: 'student-kit',
      studentKit: lectures.studentKit,
    })
  }

  // The ID card is NOT a step — it's rendered as a capstone card below the step
  // list (see `getIdCardState`).
  return [...videoSteps, ...agreementSteps, ...extraSteps]
}

export interface IdCardState {
  /** Whether to render the ID-card capstone at all (full flow only). */
  show: boolean
  url: string | null
  /** Unlocked once every program video is watched and every agreement signed. */
  unlocked: boolean
}

/**
 * State for the ID-card capstone shown beneath the Program Onboarding steps
 * (not a step itself). Hidden for the lite (non-T0) flow.
 */
export function getIdCardState(
  lectures: T0FlowLecturesResult,
  flowVariant: 'full' | 'lite',
): IdCardState {
  if (flowVariant === 'lite') return { show: false, url: null, unlocked: false }

  const completedIds = new Set(lectures.completedLectureIds)
  const videosComplete = lectures.programLectures.every((l) =>
    completedIds.has(l.lectureId),
  )
  const agreementsSigned = lectures.legalAgreementSections.every(
    (a) => a.completed,
  )

  return {
    show: true,
    url: lectures.idCardUrl,
    unlocked: videosComplete && agreementsSigned,
  }
}
