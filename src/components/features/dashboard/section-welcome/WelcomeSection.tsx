import { WelcomeBannerCarousel } from './WelcomeBannerCarousel'
import type { WelcomeBanner } from '../shared/types'

interface WelcomeSectionProps {
  studentName: string
  banners: Array<WelcomeBanner>
}

// Greeting header paired with the promotional banner carousel. Stacks on
// mobile and sits side-by-side on desktop.
export function WelcomeSection({ studentName, banners }: WelcomeSectionProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="shrink-0">
        <p className="text-2xl font-medium text-gray-500 md:text-3xl">Welcome</p>
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          {studentName} <span aria-hidden="true">👋</span>
        </h1>
      </div>

      <div className="w-full md:max-w-lg">
        <WelcomeBannerCarousel banners={banners} />
      </div>
    </div>
  )
}
