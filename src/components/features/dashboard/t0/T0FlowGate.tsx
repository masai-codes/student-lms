import { useState } from 'react'
import { GuidedTourOverlay } from './guided-tour/GuidedTourOverlay'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

interface T0FlowGateProps {
  /** From the consolidated overview payload (`overview.t0Flow`); each batch carries its `lectures`. */
  status: T0FlowStatus
}

/**
 * Decides whether an eligible T0 user sees the guided tour instead of the
 * dashboard. Eligibility (`showGuidedTour`) is owned by the backend and arrives
 * via the consolidated overview. The tour renders as a full-screen overlay;
 * "See dashboard" hides it for this visit, and on reload the overview refetches
 * so the tour returns while onboarding is incomplete.
 */
export function T0FlowGate({ status }: T0FlowGateProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !status.showGuidedTour) return null

  return <GuidedTourOverlay status={status} onSeeDashboard={() => setDismissed(true)} />
}
