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
  const [startIndex] = useState(() => nextRotatedBannerIndex(banners.map((b) => b.id)))
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
      if (index >= 0 && index < banners.length) rememberBannerId(banners[index].id)
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
      className="relative rounded-2xl bg-[#EBF3FE] px-12 py-5"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <BannerLink banner={banner} wasDragged={() => draggedRef.current} />
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
          <div className="mt-3 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                data-testid="dashboard-welcome-banner-dot"
                data-active={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`size-1.5 rounded-full transition-colors ${
                  i === selected ? 'bg-[#3F83F8]' : 'bg-[#3F83F8]/30'
                }`}
              />
            ))}
          </div>
        </>
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
    pushDashboardEvent(bannerClickEvent(banner.analyticsKey, banner.id))
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      draggable={false}
      data-testid="dashboard-welcome-banner-item"
      onClick={handleClick}
      className="flex items-center gap-4 no-underline"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
        <img src={banner.imageUrl ?? FALLBACK_ICON} alt="" className="size-7 object-contain" />
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
