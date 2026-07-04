import { useState } from 'react'
import { GuidedTourOverlay } from './guided-tour/GuidedTourOverlay'
import type { T0FlowLecturesResult } from '@/server/api/dashboard/getT0FlowLectures.service'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

interface T0FlowGateProps {
  /** From the consolidated overview payload (`overview.t0Flow`). */
  status: T0FlowStatus
  /** Primary-batch guided-tour lectures from the overview (`overview.t0FlowLectures`). */
  primaryLectures: T0FlowLecturesResult | null
}

/**
 * Decides whether an eligible T0 user sees the guided tour instead of the
 * dashboard. Eligibility (`showGuidedTour`) is owned by the backend and arrives
 * via the consolidated overview. The tour renders as a full-screen overlay;
 * "See dashboard" hides it for this visit, and on reload the overview refetches
 * so the tour returns while onboarding is incomplete.
 */
export function T0FlowGate({ status, primaryLectures }: T0FlowGateProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !status.showGuidedTour) return null

  return (
    <GuidedTourOverlay
      status={status}
      primaryLectures={primaryLectures}
      onSeeDashboard={() => setDismissed(true)}
    />
  )
}
