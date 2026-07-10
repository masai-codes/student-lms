import { formatGreetingName } from '../shared/greeting'
import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

interface WelcomeSectionProps {
  /** The signed-in user's name, or null while loading / unknown. */
  name: string | null
  banners: Array<DashboardBanner>
}

// Greeting header paired with the promotional banner carousel. Stacks on
// mobile and sits side-by-side on desktop. Falls back to "Welcome!" when the
// name is unknown.
export function WelcomeSection({ name, banners }: WelcomeSectionProps) {
  return (
    <div
      data-testid="dashboard-welcome-section"
      className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
    >
      {/* The greeting is shown in the mobile sticky header (AppMobileHeader)
          below the `lg` breakpoint, so only render it inline on desktop to
          avoid duplication. */}
      <div className="hidden shrink-0 lg:block">
        {name ? (
          <>
            <p className="text-2xl font-medium text-gray-500 md:text-3xl">Welcome</p>
            <h1
              data-testid="dashboard-welcome-name"
              title={name}
              className="text-3xl font-bold text-gray-900 md:text-4xl"
            >
              {formatGreetingName(name)} <span aria-hidden="true">👋</span>
            </h1>
          </>
        ) : (
          <h1
            data-testid="dashboard-welcome-name"
            className="text-3xl font-bold text-gray-900 md:text-4xl"
          >
            Welcome! <span aria-hidden="true">👋</span>
          </h1>
        )}
      </div>

      {banners.length > 0 && (
        <div className="w-full min-w-0 md:flex-1">
          <WelcomeBannerCarousel banners={banners} />
        </div>
      )}
    </div>
  )
}
