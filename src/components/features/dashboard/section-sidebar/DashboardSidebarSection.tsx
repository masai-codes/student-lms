import { AnnouncementsPanel } from './AnnouncementsPanel'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import { YourProgressPanel } from './YourProgressPanel'
import { LmsSupportPanel } from './LmsSupportPanel'
import type { AnnouncementItem } from './AnnouncementsPanel'
import type { ProductUpdateItem } from './ProductUpdatesPanel'
import type { EnrolledBatch } from '@/server/learn/types'
import type { BatchAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'
import type { LmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'

interface DashboardSidebarSectionProps {
  announcements: Array<AnnouncementItem>
  productUpdates: Array<ProductUpdateItem>
  enrolledBatches: Array<EnrolledBatch>
  attendanceData: Array<BatchAttendance>
  lmsSupport: LmsSupportInfo | undefined
}

export function DashboardSidebarSection({
  announcements,
  productUpdates,
  enrolledBatches,
  attendanceData,
  lmsSupport,
}: DashboardSidebarSectionProps) {
  const hasAnnouncements = announcements.length > 0
  const hasProductUpdates = productUpdates.length > 0
  // Announcements goes first when it has items, or when both are empty
  const announcementsFirst = hasAnnouncements || !hasProductUpdates

  return (
    <div className="flex flex-col gap-6">
      {announcementsFirst && <AnnouncementsPanel announcements={announcements} />}
      <ProductUpdatesPanel updates={productUpdates} />
      {!announcementsFirst && <AnnouncementsPanel announcements={announcements} />}
      <YourProgressPanel enrolledBatches={enrolledBatches} attendanceData={attendanceData} />
      <LmsSupportPanel info={lmsSupport} />
    </div>
  )
}
