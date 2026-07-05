import { GuidedTourOverlay } from './guided-tour/GuidedTourOverlay'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

/** Which course + tab the guided tour should open on (from the onboarding banner). */
export interface GuidedTourTarget {
  batchId: number
  tab: 'lms' | 'program'
}

interface T0FlowGateProps {
  /** From the consolidated overview payload (`overview.t0Flow`); each batch carries its `lectures`. */
  status: T0FlowStatus
  /** Hidden once the learner clicks "See dashboard"; reopened from the onboarding banner. */
  dismissed: boolean
  onDismiss: () => void
  /** Course + tab to open on (set when reopened from the banner). */
  target: GuidedTourTarget | null
  /**
   * Force the tour open even when onboarding is already complete — used by the
   * navbar "?" so learners can revisit the steps at any time.
   */
  forceOpen?: boolean
}

/**
 * Decides whether an eligible T0 user sees the guided tour instead of the
 * dashboard. Eligibility (`showGuidedTour`) is owned by the backend and arrives
 * via the consolidated overview; open/dismiss state is lifted to the dashboard
 * page so the onboarding banner (and the navbar "?") can (re)open the tour. The
 * tour renders as a full-screen overlay; "See dashboard" hides it for this
 * visit, and on reload the overview refetches so the tour returns while
 * onboarding is incomplete.
 */
export function T0FlowGate({ status, dismissed, onDismiss, target, forceOpen = false }: T0FlowGateProps) {
  // Nothing to show unless the user actually has an onboarding flow.
  if (!status.showT0Flow) return null
  // Open when forced (navbar "?"), or auto while onboarding is incomplete and
  // hasn't been dismissed this visit.
  const open = forceOpen || (!dismissed && status.showGuidedTour)
  if (!open) return null

  return (
    <GuidedTourOverlay
      status={status}
      onSeeDashboard={onDismiss}
      initialBatchId={target?.batchId}
      initialTab={target?.tab}
    />
  )
}
