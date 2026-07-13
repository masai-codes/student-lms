import { AnnouncementsPanel } from './AnnouncementsPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import type { DashboardOverviewState } from '../shared/types'

interface DashboardSidebarProps {
  overview: DashboardOverviewState
}

// Right-hand column composing the announcement, product-update and support
// cards, all driven by the shared overview query state.
//
// Ordering follows an importance hierarchy:
//   1. A LIVE support session pins to the top.
//   2. Announcements (when there's at least one) sit above product updates.
//   3. Product updates.
//   4. The support session card (when not live).
//   5. An EMPTY announcements card ("No announcements yet") drops to the very
//      bottom, below the support session.
export function DashboardSidebar({ overview }: DashboardSidebarProps) {
  const isSupportLive = overview.supportSession?.status === 'live'
  const announcementsEmpty =
    !overview.isPending && !overview.isError && overview.announcements.length === 0

  const announcementsCard = (
    <AnnouncementsPanel
      announcements={overview.announcements}
      isLoading={overview.isPending}
      isError={overview.isError}
    />
  )
  const supportCard = <LmsSupportPanel session={overview.supportSession} />

  return (
    <aside data-testid="dashboard-sidebar" className="flex flex-col gap-5">
      {isSupportLive && supportCard}
      {!announcementsEmpty && announcementsCard}
      <ProductUpdatesPanel
        updates={overview.productUpdates}
        isLoading={overview.isPending}
        isError={overview.isError}
      />
      {!isSupportLive && supportCard}
      {announcementsEmpty && announcementsCard}
    </aside>
  )
}
