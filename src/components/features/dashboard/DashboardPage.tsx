import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from './layout/DashboardLayout'
import { WelcomeModalGate } from './t0/WelcomeModalGate'
import { T0FlowGate } from './t0/T0FlowGate'
import type { DashboardOverviewState } from './shared/types'
import { fetchDashboardOverview } from '@/lib/api/dashboard/dashboardApi'
import { fetchCurrentUser } from '@/lib/api/me/meApi'

const OVERVIEW_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes
const USER_STALE_TIME_MS = 10 * 60 * 1000 // 10 minutes

// Feature entry point. The welcome greeting comes from the `me` API; the live
// sections come from the consolidated overview query (each card renders its own
// loading / error / empty state).
export function DashboardPage() {
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

  const overview: DashboardOverviewState = {
    isPending,
    isError,
    banners: data?.banners ?? [],
    announcements: data?.announcements ?? [],
    productUpdates: data?.productUpdates ?? [],
    supportSession: data?.supportSession ?? null,
    schedule: data?.schedule ?? [],
    pendingTasks: data?.pendingTasks ?? [],
  }

  return (
    <>
      <DashboardLayout userName={currentUser?.name ?? null} overview={overview} />
      <T0FlowGate />
      <WelcomeModalGate />
    </>
  )
}
