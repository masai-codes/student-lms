import type { AgreementSection } from '@/server/api/dashboard/agreement/getAgreementRenderData.service'
import type { T0FlowLectureItem, T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { StudentKitStatus } from '@/server/api/dashboard/t0/getStudentKitStatus.service'

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
  action?: 'profile-photo' | 'download-app' | 'agreement' | 'documents' | 'student-kit' | 'id-card'
  /** Present for the agreement action — the full render detail for that section. */
  agreement?: AgreementSection
  /** Present for the student-kit action. */
  studentKit?: StudentKitStatus
  /** Present for the id-card action — the card URL + whether it's unlocked. */
  idCard?: { url: string | null; unlocked: boolean }
  /** Gated behind an earlier step (e.g. documents/kit locked until agreement signed). */
  locked?: boolean
}

function videoStep(item: T0FlowLectureItem, completedIds: ReadonlySet<number>): GuidedTourStep {
  return {
    key: `lecture-${item.lectureId}`,
    kind: 'video',
    title: item.title,
    completed: completedIds.has(item.lectureId),
    video: { lectureId: item.lectureId, videoUrl: item.videoUrl },
  }
}

/**
 * LMS Walkthrough steps: the walkthrough videos followed by the two fixed
 * steps (profile photo, download app). Completion of the fixed steps mirrors the
 * backend denominator (`+2`). The lite (non-T0) flow has no walkthrough videos —
 * strictly the two fixed steps.
 */
export function buildLmsSteps(
  lectures: T0FlowLecturesResult,
  status: T0FlowStatus,
): Array<GuidedTourStep> {
  const completedIds = new Set(lectures.completedLectureIds)
  const videoSteps = status.flowVariant === 'lite' ? [] : lectures.lmsLectures.map((l) => videoStep(l, completedIds))

  return [
    ...videoSteps,
    {
      key: 'profile-photo',
      kind: 'fixed',
      title: 'Add your profile photo',
      completed: status.profilePhotoUrl !== null,
      action: 'profile-photo',
    },
    {
      key: 'download-app',
      kind: 'fixed',
      title: 'Download the mobile app',
      completed: status.downloadAppCompleted,
      action: 'download-app',
    },
  ]
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
  status: T0FlowStatus,
): Array<GuidedTourStep> {
  const completedIds = new Set(lectures.completedLectureIds)
  const isLite = status.flowVariant === 'lite'
  const videoSteps = isLite ? [] : lectures.programLectures.map((l) => videoStep(l, completedIds))

  const agreementSteps: Array<GuidedTourStep> = lectures.legalAgreementSections.map((a) => ({
    key: `agreement-${a.sectionId}`,
    kind: 'fixed',
    title: a.sectionName || 'Sign your agreement',
    completed: a.completed,
    action: 'agreement',
    agreement: a,
  }))

  // Lite is agreement-only — no documents / kit / ID-card capstone.
  if (isLite) return [...agreementSteps]

  // Documents + student kit are locked until every agreement is signed.
  const agreementsSigned = lectures.legalAgreementSections.every((a) => a.completed)

  const extraSteps: Array<GuidedTourStep> = []
  if (lectures.isDocumentsRequired) {
    // Completion comes from the on-demand documents status the step fetches.
    extraSteps.push({ key: 'documents', kind: 'fixed', title: 'Upload your documents', completed: false, action: 'documents', locked: !agreementsSigned })
  }
  if (lectures.studentKit.applicable) {
    extraSteps.push({
      key: 'student-kit',
      kind: 'fixed',
      title: 'Track your student kit',
      completed: lectures.studentKit.detailsFilled,
      action: 'student-kit',
      studentKit: lectures.studentKit,
      locked: !agreementsSigned,
    })
  }

  // The ID card is the capstone reveal: unlocked once every program video is
  // watched and every agreement signed.
  const idCardUnlocked = videoSteps.every((s) => s.completed) && agreementsSigned
  extraSteps.push({
    key: 'id-card',
    kind: 'fixed',
    title: 'Your student ID card',
    completed: idCardUnlocked && lectures.idCardUrl !== null,
    action: 'id-card',
    idCard: { url: lectures.idCardUrl, unlocked: idCardUnlocked },
  })

  return [...videoSteps, ...agreementSteps, ...extraSteps]
}
