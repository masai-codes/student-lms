import { ProfileActionBanner } from '../section-banner/ProfileActionBanner'
import { ScheduleSection } from '../section-schedule/ScheduleSection'
import { DashboardSidebar } from '../section-sidebar/DashboardSidebar'
import { WelcomeSection } from '../section-welcome/WelcomeSection'
import type { DashboardData } from '../shared/types'

interface DashboardLayoutProps {
  data: DashboardData
}

// Top-level dashboard composition: profile banner, welcome header, and the
// two-column schedule + sidebar grid.
export function DashboardLayout({ data }: DashboardLayoutProps) {
  return (
    <div className="mx-4 mb-8 mt-4 flex flex-col gap-6 md:mx-8">
      <ProfileActionBanner label={data.profileActionLabel} />

      <WelcomeSection studentName={data.studentName} banners={data.welcomeBanners} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ScheduleSection
          weeks={data.scheduleWeeks}
          pendingTaskCount={data.pendingTaskCount}
        />
        <DashboardSidebar
          announcements={data.announcements}
          productUpdates={data.productUpdates}
        />
      </div>
    </div>
  )
}
