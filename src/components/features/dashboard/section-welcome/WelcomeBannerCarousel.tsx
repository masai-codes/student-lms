import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import {
  bannerClickEvent,
  pushDashboardEvent,
} from '../shared/dashboardAnalytics'
import {
  nextRotatedBannerIndex,
  rememberBannerId,
} from '../shared/bannerRotation'
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
// current banner. Controls appear only with >1 banner. The starting banner
// rotates one step per page load (localStorage). The card is a link; a drag is
// not treated as a click.
export function WelcomeBannerCarousel({ banners }: WelcomeBannerCarouselProps) {
  const [startIndex] = useState(() =>
    nextRotatedBannerIndex(banners.map((b) => b.id)),
  )
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex })

  const [selected, setSelected] = useState(startIndex)
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
      if (index >= 0 && index < banners.length)
        rememberBannerId(banners[index].id)
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

  if (banners.length === 0) return null

  const hasMultiple = banners.length > 1

  return (
    <div
      data-testid="dashboard-welcome-banner-carousel"
      className="dash-sheen relative rounded-2xl bg-gradient-to-r from-[#EBF3FE] via-[#EEF0FE] to-[#F3EDFE] px-12 py-5 ring-1 ring-inset ring-[#4F6BED]/10 transition-shadow duration-300 hover:shadow-[0_10px_28px_-10px_rgb(79_107_237_/_0.28)] dark:bg-none dark:bg-surface-muted"
    >
      {/* Arrows are anchored to this wrapper (the banner row) rather than the
          card, so they stay vertically centred on the content instead of being
          pulled off-centre by the dots row below. They reach out into the
          card's px-12 gutters. */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {banners.map((banner) => (
              <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
                <BannerLink
                  banner={banner}
                  wasDragged={() => draggedRef.current}
                />
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
      </div>

      {/* Dots are absolutely positioned in the card's bottom padding rather
          than in normal flow, so they don't add to the card's height. That
          keeps the card's height equal to the banner content, letting the
          side-by-side greeting stay vertically centred on the content instead
          of being pulled down by a taller card. */}
      {hasMultiple && (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
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

function BannerLink({
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
      className="group flex items-center gap-4 no-underline"
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
  // `top-1/2` + `-translate-y-1/2` centres the arrow on the banner row; the
  // negative inset pushes it out into the card's px-12 gutter (48px), leaving
  // the same 8px gap from the card edge as before.
  return (
    <button
      type="button"
      aria-label={isPrev ? 'Previous banner' : 'Next banner'}
      data-testid={`dashboard-welcome-banner-${direction}`}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface/70 text-foreground-muted shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-surface hover:text-[#3F83F8] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:text-foreground-muted ${
        isPrev ? '-left-10' : '-right-10'
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
