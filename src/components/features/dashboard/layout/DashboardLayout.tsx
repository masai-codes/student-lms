import { ScheduleSection } from '../section-schedule/ScheduleSection'
import { DashboardSidebar } from '../section-sidebar/DashboardSidebar'
import { WelcomeSection } from '../section-welcome/WelcomeSection'
import type { DashboardOverviewState } from '../shared/types'

interface DashboardLayoutProps {
  /** Signed-in user's name for the greeting (null while loading / unknown). */
  userName: string | null
  overview: DashboardOverviewState
}

// Top-level dashboard composition: welcome header + the two-column schedule /
// sidebar grid. (The purple profile-action banner is hidden for now — it will
// be shown conditionally later.)
export function DashboardLayout({ userName, overview }: DashboardLayoutProps) {
  return (
    <div data-testid="dashboard-root" className="mx-4 mb-8 mt-4 md:mx-8">
      <div
        data-testid="dashboard-content"
        className="flex flex-col gap-6 rounded-2xl bg-white px-4 py-6 md:px-6"
      >
        <WelcomeSection name={userName} banners={overview.banners} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ScheduleSection
            schedule={overview.schedule}
            pendingTasks={overview.pendingTasks}
            isLoading={overview.isPending}
            isError={overview.isError}
          />
          <DashboardSidebar overview={overview} />
        </div>
      </div>
    </div>
  )
}
