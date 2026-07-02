import { useEffect, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  bannerClickEvent,
  pushDashboardEvent,
} from '../shared/dashboardAnalytics'
import {
  nextRotatedBannerIndex,
  rememberBannerId,
} from '../shared/bannerRotation'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

interface WelcomeBannerCarouselProps {
  banners: Array<DashboardBanner>
}

const FALLBACK_ICON = '/DashboardBannerFallback.svg'
const CHANGEMAKERS_ROUTE = '/changemakers-circle'

// Light-blue promo carousel beside the welcome greeting. Rotates the starting
// banner one step per page load (localStorage); arrows are bounded (no
// wraparound); dots mark the current banner. Controls appear only with >1
// banner. The card is a link; arrows/dots sit outside it.
export function WelcomeBannerCarousel({ banners }: WelcomeBannerCarouselProps) {
  const [index, setIndex] = useState(() =>
    nextRotatedBannerIndex(banners.map((b) => b.id)),
  )

  const safeIndex = Math.min(index, Math.max(banners.length - 1, 0))
  const banner = banners[safeIndex]
  const currentId = banners.length > 0 ? banner.id : null

  // Persist the shown banner id so the next page load advances one past it.
  useEffect(() => {
    if (currentId !== null) rememberBannerId(currentId)
  }, [currentId])

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      data-testid="dashboard-welcome-banner-carousel"
      className="relative rounded-2xl bg-[#EBF3FE] px-12 py-5"
    >
      <BannerLink banner={banner} />

      {hasMultiple && (
        <>
          <ArrowButton
            direction="prev"
            disabled={safeIndex === 0}
            onClick={() => setIndex(safeIndex - 1)}
          />
          <ArrowButton
            direction="next"
            disabled={safeIndex === banners.length - 1}
            onClick={() => setIndex(safeIndex + 1)}
          />
          <div className="mt-3 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <span
                key={b.id}
                data-testid="dashboard-welcome-banner-dot"
                data-active={i === safeIndex}
                className={`size-1.5 rounded-full ${
                  i === safeIndex ? 'bg-[#3F83F8]' : 'bg-[#3F83F8]/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BannerLink({ banner }: { banner: DashboardBanner }) {
  const { href, external } = resolveBannerHref(banner.ctaUrl)

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      data-testid="dashboard-welcome-banner-item"
      onClick={() => pushDashboardEvent(bannerClickEvent(banner.analyticsKey, banner.id))}
      className="flex items-center gap-4 no-underline"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
        <img
          src={banner.imageUrl ?? FALLBACK_ICON}
          alt=""
          className="size-7 object-contain"
        />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-gray-900 md:text-base">
          {banner.title}
        </h3>
        {banner.description && (
          <p className="mt-0.5 hidden truncate text-xs text-gray-600 md:block md:text-sm">
            {banner.description}
          </p>
        )}
      </div>
    </a>
  )
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      aria-label={isPrev ? 'Previous banner' : 'Next banner'}
      data-testid={`dashboard-welcome-banner-${direction}`}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-5 flex size-8 items-center justify-center rounded-full bg-white/70 text-gray-500 shadow-sm transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 ${
        isPrev ? 'left-2' : 'right-2'
      }`}
    >
      {isPrev ? <CaretLeft size={16} weight="bold" /> : <CaretRight size={16} weight="bold" />}
    </button>
  )
}

/** `/…` → internal same-tab; full URL → new tab; none → Changemakers Circle. */
function resolveBannerHref(ctaUrl: string | null): { href: string; external: boolean } {
  if (!ctaUrl) return { href: CHANGEMAKERS_ROUTE, external: false }
  if (ctaUrl.startsWith('/')) return { href: ctaUrl, external: false }
  return { href: ctaUrl, external: true }
}
