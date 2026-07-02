import { AnnouncementsPanel } from './AnnouncementsPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import type { DashboardOverviewState } from '../shared/types'

interface DashboardSidebarProps {
  overview: DashboardOverviewState
}

// Right-hand column composing the announcement, product-update and support
// cards, all driven by the shared overview query state.
export function DashboardSidebar({ overview }: DashboardSidebarProps) {
  return (
    <aside data-testid="dashboard-sidebar" className="flex flex-col gap-5">
      <AnnouncementsPanel
        announcements={overview.announcements}
        isLoading={overview.isPending}
        isError={overview.isError}
      />
      <ProductUpdatesPanel
        updates={overview.productUpdates}
        isLoading={overview.isPending}
        isError={overview.isError}
      />
      <LmsSupportPanel session={overview.supportSession} />
    </aside>
  )
}
