import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

/** One purple onboarding banner — a single course still being set up. */
export interface OnboardingBanner {
  batchId: number
  /** Course / batch title shown on the banner. */
  courseTitle: string
  /** Numerator: guided-tour steps the learner has finished. */
  completed: number
  /** Denominator: total guided-tour steps for this course. */
  total: number
  /** Which guided-tour tab to open when the learner resumes. */
  targetTab: 'lms' | 'program'
}

/**
 * Builds the onboarding banners for a T0 learner — one per course that still
 * has a mandatory guided-tour step pending. Returns `[]` for non-T0 users and
 * for courses whose onboarding is already complete (so the banner disappears
 * as soon as everything is done).
 *
 * Progress fraction follows the fee gate exactly as the backend computes it:
 * - **Program onboarding locked** (`program === null`, full fees unpaid): the
 *   fraction is the LMS walkthrough alone (`lms.completed` / `lms.total`).
 * - **Full fees paid** (`program !== null`): the LMS walkthrough and program
 *   onboarding numerators and denominators are summed.
 *
 * A course counts as pending when either tab still has a step left — the same
 * predicate that drives `showGuidedTour` on the backend.
 */
export function buildOnboardingBanners(
  status: T0FlowStatus | null | undefined,
): Array<OnboardingBanner> {
  if (!status?.showT0Flow) return []

  const banners: Array<OnboardingBanner> = []
  for (const batch of status.batches) {
    const { lms, program } = batch
    const lmsPending = !lms.complete
    // `program` is null while the program tab is locked (full fees unpaid), so
    // it only contributes to the fraction / pending state after full payment.
    const programPending = program !== null && !program.complete
    if (!lmsPending && !programPending) continue

    banners.push({
      batchId: batch.batchId,
      courseTitle: batch.batchName,
      completed: lms.completed + (program?.completed ?? 0),
      total: lms.total + (program?.total ?? 0),
      // Send the learner to whichever tab still has work: the walkthrough first,
      // then program onboarding once the walkthrough is done.
      targetTab: lmsPending ? 'lms' : 'program',
    })
  }

  return banners
}
