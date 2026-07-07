import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/components/features/dashboard'

/** `?guidedTour=open` (set by the navbar "?") requests the guided tour open. */
interface DashboardSearch {
  guidedTour?: 'open'
}

export const Route = createFileRoute('/(protected)/_layout/')({
  validateSearch: (raw): DashboardSearch => ({
    guidedTour: raw.guidedTour === 'open' ? 'open' : undefined,
  }),
  component: DashboardRoute,
})

function DashboardRoute() {
  const { guidedTour } = Route.useSearch()
  const navigate = Route.useNavigate()
  const requested = guidedTour === 'open'

  // Strip the one-shot param once consumed so a refresh / close doesn't reopen.
  useEffect(() => {
    if (requested) {
      void navigate({ search: (prev) => ({ ...prev, guidedTour: undefined }), replace: true })
    }
  }, [requested, navigate])

  return <DashboardPage openGuidedTourSignal={requested} />
}
