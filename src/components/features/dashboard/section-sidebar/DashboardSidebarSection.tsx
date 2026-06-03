import { AnnouncementsPanel } from './AnnouncementsPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import { YourProgressPanel } from './YourProgressPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import type { AnnouncementItem } from './AnnouncementsPanel'
import type { ProductUpdateItem } from './ProductUpdatesPanel'
import type { EnrolledBatch } from '@/server/learn/types'
import type { BatchAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'

interface DashboardSidebarSectionProps {
  announcements: Array<AnnouncementItem>
  productUpdates: Array<ProductUpdateItem>
  enrolledBatches: Array<EnrolledBatch>
  attendanceData: Array<BatchAttendance>
}

export function DashboardSidebarSection({
  announcements,
  productUpdates,
  enrolledBatches,
  attendanceData,
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
      <YourProgressPanel enrolledBatches={enrolledBatches} attendanceData={attendanceData} />
      <LmsSupportPanel />
    </div>
  )
}
