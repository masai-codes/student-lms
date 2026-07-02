import { AnnouncementsPanel } from './AnnouncementsPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import type { Announcement, ProductUpdate } from '../shared/types'

interface DashboardSidebarProps {
  announcements: Array<Announcement>
  productUpdates: Array<ProductUpdate>
}

// Right-hand column composing the announcement, product-update and support cards.
export function DashboardSidebar({
  announcements,
  productUpdates,
}: DashboardSidebarProps) {
  return (
    <aside data-testid="dashboard-sidebar" className="flex flex-col gap-5">
      <AnnouncementsPanel announcements={announcements} />
      <ProductUpdatesPanel updates={productUpdates} />
      <LmsSupportPanel />
    </aside>
  )
}
