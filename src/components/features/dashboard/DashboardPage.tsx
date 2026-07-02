import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from './layout/DashboardLayout'
import { MOCK_DASHBOARD_DATA } from './shared/mockData'
import type { DashboardOverviewState } from './shared/types'
import { fetchDashboardOverview } from '@/lib/api/dashboard/dashboardApi'

const OVERVIEW_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

// Feature entry point. The live sections (welcome banners, announcements,
// product updates, support session) are driven by the consolidated overview
// query — each card renders its own loading / error / empty state. The
// remaining sections (profile banner, welcome name, schedule) stay on mock data
// until migrated.
export function DashboardPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    staleTime: OVERVIEW_STALE_TIME_MS,
  })

  const overview: DashboardOverviewState = {
    isPending,
    isError,
    banners: data?.banners ?? [],
    announcements: data?.announcements ?? [],
    productUpdates: data?.productUpdates ?? [],
    supportSession: data?.supportSession ?? null,
  }

  return <DashboardLayout data={MOCK_DASHBOARD_DATA} overview={overview} />
}
