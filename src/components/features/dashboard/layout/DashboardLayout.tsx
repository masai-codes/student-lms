import { BatchStartBanners } from '../section-banner/BatchStartBanners'
import { BatchTransferPaymentBanners } from '../section-banner/BatchTransferPaymentBanners'
import { FeePaymentBanners } from '../section-banner/FeePaymentBanners'
import { OnboardingStepsBanner } from '../section-banner/OnboardingStepsBanner'
import { buildOnboardingBanners } from '../section-banner/onboardingBanners'
import { ScheduleSection } from '../section-schedule/ScheduleSection'
import { DashboardSidebar } from '../section-sidebar/DashboardSidebar'
import { WelcomeSection } from '../section-welcome/WelcomeSection'
import type { DashboardOverviewState } from '../shared/types'
import type { T0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'
import { useServerTime } from '@/hooks/useServerTime'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  /** Signed-in user's name for the greeting (null while loading / unknown). */
  userName: string | null
  overview: DashboardOverviewState
  /** T0 onboarding status (null while loading / non-T0); drives the purple banner. */
  t0Flow: T0FlowStatus | null
  /** Reopen the guided tour for a course on the tab that still has work. */
  onResumeOnboarding: (batchId: number, tab: 'lms' | 'program') => void
}

// Top-level dashboard composition: an optional purple onboarding banner (T0
// learners with pending guided-tour steps) sitting flush above the welcome
// header + the two-column schedule / sidebar grid.
export function DashboardLayout({
  userName,
  overview,
  t0Flow,
  onResumeOnboarding,
}: DashboardLayoutProps) {
  const onboardingBanners = buildOnboardingBanners(t0Flow)
  const showOnboardingBanner = onboardingBanners.length > 0

  // "Today" for the schedule strip comes from the server so the visible date
  // can't be shifted by changing the device clock. The user's own timezone is
  // still respected because `buildScheduleWeek` reads the Date with local
  // (machine-timezone) getters — we only take the *instant* from the server.
  const { now } = useServerTime()

  return (
    <div data-testid="dashboard-root" className="mb-8 mt-4 container mx-auto">
      {overview.feePaymentBanners.length > 0 ? (
        <div className="mb-4">
          <FeePaymentBanners banners={overview.feePaymentBanners} />
        </div>
      ) : null}
      {overview.batchTransferPaymentBanners.length > 0 ? (
        <div className="mb-4">
          <BatchTransferPaymentBanners
            banners={overview.batchTransferPaymentBanners}
          />
        </div>
      ) : null}
      {overview.batchStartBanners.length > 0 ? (
        <div className="mb-4">
          <BatchStartBanners banners={overview.batchStartBanners} />
        </div>
      ) : null}
      {showOnboardingBanner ? (
        <OnboardingStepsBanner
          banners={onboardingBanners}
          onResume={onResumeOnboarding}
        />
      ) : null}
      <div
        data-testid="dashboard-content"
        className={cn(
          'relative flex flex-col gap-4 overflow-hidden',
          // Square top so it meets the banner seamlessly when one is shown.
          showOnboardingBanner && 'rounded-t-none',
        )}
      >
        <div className="animate-dash-rise relative">
          <WelcomeSection
            name={userName}
            banners={overview.banners}
            isLoading={overview.isPending}
          />
        </div>

        <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="animate-dash-rise min-w-0 [--dash-delay:0.08s]">
            <ScheduleSection
              schedule={overview.schedule}
              pendingTasks={overview.pendingTasks}
              isLoading={overview.isPending}
              isError={overview.isError}
              now={now.toDate()}
            />
          </div>
          <div className="animate-dash-rise min-w-0 [--dash-delay:0.16s]">
            <DashboardSidebar overview={overview} />
          </div>
        </div>
      </div>
    </div>
  )
}
