import { GuidedTourOverlay } from './guided-tour/GuidedTourOverlay'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import type { FeePaymentBanner } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'

/** Which course + tab the guided tour should open on (from the onboarding banner). */
export interface GuidedTourTarget {
  batchId: number
  tab: 'lms' | 'program'
  /** When set, preselect the first step with this action (e.g. deep-link to `agreement`). */
  stepAction?: 'agreement'
}

interface T0FlowGateProps {
  /** From the consolidated overview payload (`overview.t0Flow`); each batch carries its `lectures`. */
  status: T0FlowStatus
  /**
   * Whether the tour should render now. Computed by the dashboard page (which
   * latches it open for the visit) so a mid-view completion doesn't yank it away.
   */
  open: boolean
  onDismiss: () => void
  /** Course + tab to open on (set when reopened from the banner). */
  target: GuidedTourTarget | null
  /** Fee-payment banners (same as the dashboard); shown under the LMS-walkthrough steps. */
  feePaymentBanners: Array<FeePaymentBanner>
}

/**
 * Whether the guided tour should be shown right now — the dashboard page renders
 * the tour *in place of* the dashboard content (so the navbar stays visible)
 * when this is true. Shown when the user has an onboarding flow and it's either
 * forced (navbar "?") or auto-eligible (incomplete + not dismissed this visit).
 */
export function isGuidedTourVisible(
  status: T0FlowStatus,
  { dismissed, forceOpen }: { dismissed: boolean; forceOpen: boolean },
): boolean {
  if (!status.showT0Flow) return false
  return forceOpen || (!dismissed && status.showGuidedTour)
}

/**
 * Decides whether an eligible T0 user sees the guided tour instead of the
 * dashboard. Eligibility (`showGuidedTour`) is owned by the backend and arrives
 * via the consolidated overview; open/dismiss state is lifted to the dashboard
 * page so the onboarding banner (and the navbar "?") can (re)open the tour. The
 * tour renders below the navbar in the dashboard's content area; "See dashboard"
 * hides it for this visit, and on reload the overview refetches so the tour
 * returns while onboarding is incomplete.
 */
export function T0FlowGate({
  status,
  open,
  onDismiss,
  target,
  feePaymentBanners,
}: T0FlowGateProps) {
  if (!open) return null

  return (
    <GuidedTourOverlay
      status={status}
      onSeeDashboard={onDismiss}
      initialBatchId={target?.batchId}
      initialTab={target?.tab}
      initialStepAction={target?.stepAction}
      feePaymentBanners={feePaymentBanners}
    />
  )
}
