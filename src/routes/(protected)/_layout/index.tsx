import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/components/features/dashboard'

/**
 * `?guidedTour=open` (set by the navbar "?") requests the guided tour open.
 * A "Sign agreement" CTA on a restricted lecture/assignment adds `batchId`,
 * `tab=program` and `step=agreement` to deep-link into that step for the batch.
 */
interface DashboardSearch {
  guidedTour?: 'open'
  batchId?: number
  tab?: 'lms' | 'program'
  step?: 'agreement'
}

export const Route = createFileRoute('/(protected)/_layout/')({
  validateSearch: (raw): DashboardSearch => {
    const batchId = Number(raw.batchId)
    return {
      guidedTour: raw.guidedTour === 'open' ? 'open' : undefined,
      batchId: Number.isFinite(batchId) && batchId > 0 ? batchId : undefined,
      tab: raw.tab === 'program' || raw.tab === 'lms' ? raw.tab : undefined,
      step: raw.step === 'agreement' ? 'agreement' : undefined,
    }
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  const { guidedTour, batchId, tab, step } = Route.useSearch()
  const navigate = Route.useNavigate()
  const requested = guidedTour === 'open'

  // Strip the one-shot params once consumed so a refresh / close doesn't reopen.
  useEffect(() => {
    if (requested) {
      void navigate({
        search: (prev) => ({
          ...prev,
          guidedTour: undefined,
          batchId: undefined,
          tab: undefined,
          step: undefined,
        }),
        replace: true,
      })
    }
  }, [requested, navigate])

  return (
    <DashboardPage
      openGuidedTourSignal={requested}
      guidedTourTarget={
        requested ? { batchId, tab, stepAction: step } : undefined
      }
    />
  )
}
