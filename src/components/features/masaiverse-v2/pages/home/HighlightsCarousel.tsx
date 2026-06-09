import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import HighlightCard from './HighlightCard'
import { HighlightCardSkeleton, repeat } from './skeletons'
import type { MasaiverseV2HomeHighlight } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'
import 'swiper/css'
import 'swiper/css/navigation'

/** Left-edge accent palette; cycled per card so adjacent recaps differ. */
const HIGHLIGHT_ACCENT_COLORS = [
  'var(--color-masaiverse-orange)',
  '#2E7D46',
  '#6D28D9',
  '#2563EB',
  '#D97706',
  '#DB2777',
]

type HighlightsCarouselProps = {
  highlights: Array<MasaiverseV2HomeHighlight>
  isPending: boolean
  /** Accessible label for the loading state. */
  loadingLabel: string
  /** Copy shown when there are no highlights. */
  emptyMessage: string
  /** Unique nav-button class prefix so multiple carousels can coexist. */
  navKey?: string
}

/**
 * Shared past-events carousel — swiper of {@link HighlightCard}s with cycling
 * accents, loading skeletons, and an empty state. Used by the home "Past
 * Events" section and the club page's past-events section.
 */
export default function HighlightsCarousel({
  highlights,
  isPending,
  loadingLabel,
  emptyMessage,
  navKey = 'highlights',
}: HighlightsCarouselProps) {
  if (isPending) {
    return (
      <div
        role="status"
        aria-label={loadingLabel}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <span className="sr-only">{loadingLabel}…</span>
        {repeat(2, (key) => (
          <HighlightCardSkeleton key={key} />
        ))}
      </div>
    )
  }

  if (highlights.length === 0) {
    return <p className="text-[14px] text-[#6B7280]">{emptyMessage}</p>
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        navigation={{ prevEl: `.${navKey}-prev`, nextEl: `.${navKey}-next` }}
        spaceBetween={16}
        slidesPerView={1.05}
        breakpoints={{ 640: { slidesPerView: 1.5 }, 1024: { slidesPerView: 2 } }}
        className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
      >
        {highlights.map((highlight, index) => (
          <SwiperSlide key={highlight.id} className="!h-auto">
            <HighlightCard
              highlight={highlight}
              accentColor={
                HIGHLIGHT_ACCENT_COLORS[index % HIGHLIGHT_ACCENT_COLORS.length]
              }
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {highlights.length > 1 ? (
        <CarouselNavButtons
          prevClassName={`${navKey}-prev`}
          nextClassName={`${navKey}-next`}
          label="highlights"
          trackingId={navKey}
        />
      ) : null}
    </div>
  )
}
