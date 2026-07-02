import { ProfileActionBanner } from '../section-banner/ProfileActionBanner'
import { ScheduleSection } from '../section-schedule/ScheduleSection'
import { DashboardSidebar } from '../section-sidebar/DashboardSidebar'
import { WelcomeSection } from '../section-welcome/WelcomeSection'
import type { DashboardData } from '../shared/types'

interface DashboardLayoutProps {
  data: DashboardData
}

// Top-level dashboard composition: the purple profile banner sits on top of a
// white content card (welcome header + the two-column schedule / sidebar grid)
// whose rounded top corners tuck up under the banner, so the two read as one
// connected surface.
export function DashboardLayout({ data }: DashboardLayoutProps) {
  return (
    <div data-testid="dashboard-root" className="mx-4 mb-8 mt-4 md:mx-8">
      <ProfileActionBanner label={data.profileActionLabel} />

      <div
        data-testid="dashboard-content"
        className="relative -mt-4 flex flex-col gap-6 rounded-2xl bg-white px-4 py-6 md:px-6"
      >
        <WelcomeSection
          studentName={data.studentName}
          banners={data.welcomeBanners}
        />

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
    </div>
  )
}
