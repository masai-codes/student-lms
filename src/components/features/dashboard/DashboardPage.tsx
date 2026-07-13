import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from './layout/DashboardLayout'
import { WelcomeModalGate } from './t0/WelcomeModalGate'
import { T0FlowGate, isGuidedTourVisible } from './t0/T0FlowGate'
import type { GuidedTourTarget } from './t0/T0FlowGate'
import type { DashboardOverviewState } from './shared/types'
import { fetchDashboardOverview } from '@/lib/api/dashboard/dashboardApi'
import { fetchCurrentUser } from '@/lib/api/me/meApi'

const OVERVIEW_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes
const USER_STALE_TIME_MS = 10 * 60 * 1000 // 10 minutes

interface DashboardPageProps {
  /**
   * When true (the route saw `?guidedTour=open` from the navbar "?"), force the
   * guided tour open even if onboarding is already complete.
   */
  openGuidedTourSignal?: boolean
  /**
   * Deep-link target for the guided tour (e.g. a "Sign agreement" CTA from a
   * restricted lecture navigates here with a batch + agreement step preselected).
   */
  guidedTourTarget?: {
    batchId?: number
    tab?: 'lms' | 'program'
    stepAction?: 'agreement'
  }
}

// Feature entry point. The welcome greeting comes from the `me` API; the live
// sections come from the consolidated overview query (each card renders its own
// loading / error / empty state).
export function DashboardPage({
  openGuidedTourSignal = false,
  guidedTourTarget,
}: DashboardPageProps = {}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    staleTime: OVERVIEW_STALE_TIME_MS,
  })

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    staleTime: USER_STALE_TIME_MS,
  })

  // Guided-tour visibility is lifted here so the onboarding banner (rendered in
  // the dashboard layout) can reopen the tour after it's been dismissed. The
  // tour auto-opens on load while onboarding is incomplete (dismissed starts
  // false); "See dashboard" hides it and reveals the banner underneath.
  const [tourDismissed, setTourDismissed] = useState(false)
  const [tourTarget, setTourTarget] = useState<GuidedTourTarget | null>(null)
  const [tourForced, setTourForced] = useState(false)
  const resumeOnboarding = useCallback((batchId: number, tab: 'lms' | 'program') => {
    setTourTarget({ batchId, tab })
    setTourDismissed(false)
  }, [])

  // The navbar "?" navigates here with `?guidedTour=open`; force the tour open
  // (even when complete). A "Sign agreement" CTA adds a batch + agreement step to
  // deep-link into that step. The route strips the params after this fires.
  const targetBatchId = guidedTourTarget?.batchId
  const targetTab = guidedTourTarget?.tab
  const targetStepAction = guidedTourTarget?.stepAction
  useEffect(() => {
    if (openGuidedTourSignal) {
      setTourForced(true)
      setTourDismissed(false)
      setTourTarget(
        targetBatchId != null
          ? {
              batchId: targetBatchId,
              tab: targetTab ?? 'program',
              stepAction: targetStepAction,
            }
          : null,
      )
    }
  }, [openGuidedTourSignal, targetBatchId, targetTab, targetStepAction])

  const overview: DashboardOverviewState = {
    isPending,
    isError,
    banners: data?.banners ?? [],
    announcements: data?.announcements ?? [],
    productUpdates: data?.productUpdates ?? [],
    supportSession: data?.supportSession ?? null,
    schedule: data?.schedule ?? [],
    pendingTasks: data?.pendingTasks ?? [],
    feePaymentBanners: data?.feePaymentBanners ?? [],
    batchStartBanners: data?.batchStartBanners ?? [],
  }

  // When the guided tour is showing it takes over the content area (below the
  // navbar), so the dashboard itself is hidden.
  const tourVisible = data
    ? isGuidedTourVisible(data.t0Flow, { dismissed: tourDismissed, forceOpen: tourForced })
    : false

  return (
    <>
      {tourVisible ? null : (
        <DashboardLayout
          userName={currentUser?.name ?? null}
          overview={overview}
          t0Flow={data?.t0Flow ?? null}
          onResumeOnboarding={resumeOnboarding}
        />
      )}
      {data ? (
        <T0FlowGate
          status={data.t0Flow}
          dismissed={tourDismissed}
          onDismiss={() => {
            setTourDismissed(true)
            setTourForced(false)
          }}
          target={tourTarget}
          forceOpen={tourForced}
          feePaymentBanners={data.feePaymentBanners}
        />
      ) : null}
      {data ? <WelcomeModalGate showWelcomeModal={data.welcomeModal.showWelcomeModal} /> : null}
    </>
  )
}
