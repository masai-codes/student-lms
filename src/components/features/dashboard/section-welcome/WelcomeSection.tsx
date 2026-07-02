import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

interface WelcomeSectionProps {
  studentName: string
  banners: Array<DashboardBanner>
}

// Greeting header paired with the promotional banner carousel. Stacks on
// mobile and sits side-by-side on desktop.
export function WelcomeSection({ studentName, banners }: WelcomeSectionProps) {
  return (
    <div
      data-testid="dashboard-welcome-section"
      className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="shrink-0">
        <p className="text-2xl font-medium text-gray-500 md:text-3xl">Welcome</p>
        <h1
          data-testid="dashboard-welcome-name"
          className="text-3xl font-bold text-gray-900 md:text-4xl"
        >
          {studentName} <span aria-hidden="true">👋</span>
        </h1>
      </div>

      {banners.length > 0 && (
        <div className="w-full min-w-0 md:flex-1">
          <WelcomeBannerCarousel banners={banners} />
        </div>
      )}
    </div>
  )
}
