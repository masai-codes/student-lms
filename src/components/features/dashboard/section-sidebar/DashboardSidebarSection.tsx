import { AnnouncementsPanel } from './AnnouncementsPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import { YourProgressPanel } from './YourProgressPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import type { AnnouncementItem } from './AnnouncementsPanel'
import type { ProductUpdateItem } from './ProductUpdatesPanel'
import type { EnrolledBatch } from '@/server/learn/types'

interface DashboardSidebarSectionProps {
  announcements: Array<AnnouncementItem>
  productUpdates: Array<ProductUpdateItem>
  enrolledBatches: Array<EnrolledBatch>
}

export function DashboardSidebarSection({
  announcements,
  productUpdates,
  enrolledBatches,
}: DashboardSidebarSectionProps) {
  const hasAnnouncements = announcements.length > 0

  return (
    <div className="flex flex-col gap-4">
      {hasAnnouncements ? (
        <>
          <AnnouncementsPanel announcements={announcements} />
          <ProductUpdatesPanel updates={productUpdates} />
        </>
      ) : (
        <>
          <ProductUpdatesPanel updates={productUpdates} />
          <AnnouncementsPanel announcements={announcements} />
        </>
      )}
      <YourProgressPanel enrolledBatches={enrolledBatches} />
      <LmsSupportPanel />
    </div>
  )
}
