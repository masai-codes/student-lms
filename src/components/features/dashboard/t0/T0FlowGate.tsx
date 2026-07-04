import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GuidedTourOverlay } from './guided-tour/GuidedTourOverlay'
import { fetchT0FlowStatus } from '@/lib/api/dashboard/dashboardApi'

const T0_STATUS_STALE_TIME_MS = 60 * 1000 // 1 minute

/**
 * Decides whether an eligible T0 user sees the guided tour instead of the
 * dashboard. The backend owns the rule (`showGuidedTour`); here we render the
 * tour as a full-screen overlay when eligible. "See dashboard" hides it for this
 * visit; on reload the status refetches and the tour returns while incomplete.
 */
export function T0FlowGate() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery({
    queryKey: ['dashboard', 't0-flow-status'],
    queryFn: fetchT0FlowStatus,
    staleTime: T0_STATUS_STALE_TIME_MS,
  })

  if (dismissed || !data?.showGuidedTour) return null

  return <GuidedTourOverlay status={data} onSeeDashboard={() => setDismissed(true)} />
}
