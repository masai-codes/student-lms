import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  bannerClickEvent,
  masaiLivePromoClickEvent,
  pushDashboardEvent,
} from '../shared/dashboardAnalytics'
import { rememberBannerId } from '../shared/bannerRotation'
import { MASAI_LIVE_PROMO } from './masaiLivePromo'
import type { EmblaCarouselType } from 'embla-carousel'
import type { DashboardBanner } from '@/server/api/dashboard/banners/getWelcomeBanners.service'

interface WelcomeBannerCarouselProps {
  banners: Array<DashboardBanner>
}

const FALLBACK_ICON =
  'https://masai-website-images.s3.ap-south-1.amazonaws.com/Group_f647b8c854.svg'
const CHANGEMAKERS_ROUTE = '/changemakers-circle'

// Light-blue promo carousel beside the welcome greeting. Uses embla for smooth
// mouse/touch drag-to-swipe. Arrows are bounded (no wraparound); dots mark the
// current banner. The hardcoded Masai Live promo is pinned as the always-first
// slide, so the carousel opens on it; the DB-driven banners follow. Controls
// appear only with >1 slide. Each card is a link; a drag is not treated as a
// click.
export function WelcomeBannerCarousel({ banners }: WelcomeBannerCarouselProps) {
  // Slide 0 is the fixed Masai Live promo; slides 1..n are the DB banners.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: 0 })

  const [selected, setSelected] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  // True when the pointer moved (dragged) since the last pointer-down, so the
  // trailing click after a swipe doesn't navigate.
  const draggedRef = useRef(false)

  const onSelect = useCallback(
    (api: EmblaCarouselType) => {
      const index = api.selectedScrollSnap()
      setSelected(index)
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
      // Index 0 is the promo (no DB id); 1..n map to banners[0..n-1].
      if (index >= 1 && index - 1 < banners.length)
        rememberBannerId(banners[index - 1].id)
    },
    [banners],
  )

  useEffect(() => {
    if (!emblaApi) return
    const markDragStart = () => {
      draggedRef.current = false
    }
    const markDragged = () => {
      draggedRef.current = true
    }
    onSelect(emblaApi)
    emblaApi
      .on('select', onSelect)
      .on('reInit', onSelect)
      .on('pointerDown', markDragStart)
      .on('scroll', markDragged)
    return () => {
      emblaApi
        .off('select', onSelect)
        .off('reInit', onSelect)
        .off('pointerDown', markDragStart)
        .off('scroll', markDragged)
    }
  }, [emblaApi, onSelect])

  const wasDragged = () => draggedRef.current
  // Total slides = the pinned promo + the DB banners. Controls show only when
  // there is more than the promo to page through.
  const slideCount = banners.length + 1
  const hasMultiple = slideCount > 1

  return (
    <div data-testid="dashboard-welcome-banner-carousel" className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          <div className="min-w-0 flex-[0_0_100%]">
            <MasaiLivePromoCard wasDragged={wasDragged} />
          </div>
          {banners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <BannerCard banner={banner} wasDragged={wasDragged} />
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <>
          <ArrowButton
            direction="prev"
            disabled={!canScrollPrev}
            onClick={() => emblaApi?.scrollPrev()}
          />
          <ArrowButton
            direction="next"
            disabled={!canScrollNext}
            onClick={() => emblaApi?.scrollNext()}
          />
        </>
      )}

      {/* Dots are absolutely positioned in the card's bottom padding rather
          than in normal flow, so they don't add to the card's height. */}
      {hasMultiple && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              data-testid="dashboard-welcome-banner-dot"
              data-active={i === selected}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                i === selected
                  ? 'w-5 bg-[#3F83F8]'
                  : 'w-1.5 bg-[#3F83F8]/30 hover:bg-[#3F83F8]/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// The DB-driven banner card: the original light-blue gradient chrome wrapping a
// compact avatar + title + description link.
function BannerCard({
  banner,
  wasDragged,
}: {
  banner: DashboardBanner
  wasDragged: () => boolean
}) {
  const { href, external } = resolveBannerHref(banner.ctaUrl)

  const handleClick = (event: React.MouseEvent) => {
    // A drag ends in a click the browser still fires — swallow it so a swipe
    // never navigates.
    if (wasDragged()) {
      event.preventDefault()
      return
    }
    pushDashboardEvent(bannerClickEvent(banner.analyticsKey, banner.id), {
      banner_id: banner.id,
      analytics_key: banner.analyticsKey,
      title: banner.title,
    })
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      draggable={false}
      data-testid="dashboard-welcome-banner-item"
      onClick={handleClick}
      className="dash-sheen group flex h-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#EBF3FE] via-[#EEF0FE] to-[#F3EDFE] px-12 py-5 no-underline ring-1 ring-inset ring-[#4F6BED]/10 transition-shadow duration-300 hover:shadow-[0_10px_28px_-10px_rgb(79_107_237_/_0.28)] dark:bg-none dark:bg-surface-muted"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface shadow-sm ring-1 ring-[#4F6BED]/10 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6">
        <img
          src={banner.imageUrl ?? FALLBACK_ICON}
          alt=""
          className="size-7 object-contain"
        />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-foreground md:text-base">
          {banner.title}
        </h3>
        {banner.description && (
          <p className="mt-0.5 hidden truncate text-xs text-foreground-muted md:block md:text-sm">
            {banner.description}
          </p>
        )}
      </div>
    </a>
  )
}

// The hardcoded Masai Live promo card: its own pink chrome, a rounded image on
// the left, the "This Month On masai live." eyebrow, headline + subtitle, and a
// red "Join for Free" pill on the right.
function MasaiLivePromoCard({ wasDragged }: { wasDragged: () => boolean }) {
  const { href, external } = resolveBannerHref(MASAI_LIVE_PROMO.ctaUrl)

  const handleClick = (event: React.MouseEvent) => {
    if (wasDragged()) {
      event.preventDefault()
      return
    }
    pushDashboardEvent(masaiLivePromoClickEvent(MASAI_LIVE_PROMO.analyticsKey), {
      analytics_key: MASAI_LIVE_PROMO.analyticsKey,
      title: MASAI_LIVE_PROMO.title,
    })
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      draggable={false}
      data-testid="dashboard-masai-live-promo"
      onClick={handleClick}
      className="dash-sheen group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl px-12 py-4 no-underline shadow-[0_6px_20px_-10px_rgb(225_29_72_/_0.25)] ring-1 ring-inset ring-[#E11D48]/15 transition-shadow duration-300 hover:shadow-[0_12px_30px_-10px_rgb(225_29_72_/_0.32)]"
    >
      {/* Base pink wash. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FCE9EC] via-[#FDF3F3] to-[#FBE7E9] dark:bg-none dark:bg-surface-muted"
      />
      {/* Soft red glow fading in from the right, matching the design. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(120%_130%_at_100%_50%,rgb(225_29_72_/_0.20),transparent_65%)] dark:hidden"
      />
      <img
        src={MASAI_LIVE_PROMO.imageUrl}
        alt=""
        className="relative z-10 size-14 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:scale-105"
      />
      <div className="relative z-10 min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
          {MASAI_LIVE_PROMO.label}
          <span className="text-sm font-extrabold normal-case tracking-normal text-foreground">
            {MASAI_LIVE_PROMO.brand}
          </span>
          <span className="text-sm font-semibold italic normal-case tracking-normal text-[#E11D48]">
            {MASAI_LIVE_PROMO.brandAccent}
          </span>
        </p>
        <h3 className="truncate text-base font-bold text-foreground md:text-lg">
          {MASAI_LIVE_PROMO.title}
        </h3>
        <p className="truncate text-xs text-foreground-muted md:text-sm">
          {MASAI_LIVE_PROMO.subtitle}
        </p>
      </div>
      <span className="relative z-10 ml-auto hidden shrink-0 items-center gap-2 rounded-full bg-[#E11D48] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-4px_rgb(225_29_72_/_0.5)] transition-transform duration-200 group-hover:scale-105 sm:flex">
        {MASAI_LIVE_PROMO.ctaText}
        <ArrowRight size={16} weight="bold" />
      </span>
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
  // `top-1/2` + `-translate-y-1/2` centres the arrow on the card; the horizontal
  // translate straddles the arrow on the card's side border.
  return (
    <button
      type="button"
      aria-label={isPrev ? 'Previous banner' : 'Next banner'}
      data-testid={`dashboard-welcome-banner-${direction}`}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface/70 text-foreground-muted shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-surface hover:text-[#3F83F8] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:text-foreground-muted ${
        isPrev ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
      }`}
    >
      {isPrev ? (
        <CaretLeft size={16} weight="bold" />
      ) : (
        <CaretRight size={16} weight="bold" />
      )}
    </button>
  )
}

/** `/…` → internal same-tab; full URL → new tab; none → Changemakers Circle. */
function resolveBannerHref(ctaUrl: string | null): {
  href: string
  external: boolean
} {
  if (!ctaUrl) return { href: CHANGEMAKERS_ROUTE, external: false }
  if (ctaUrl.startsWith('/')) return { href: ctaUrl, external: false }
  return { href: ctaUrl, external: true }
}
