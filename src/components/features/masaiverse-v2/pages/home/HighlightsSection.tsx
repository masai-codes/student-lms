import { useQuery } from '@tanstack/react-query'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import HighlightCard from './HighlightCard'
import SectionHeader from './SectionHeader'
import { HighlightCardSkeleton, repeat } from './skeletons'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
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

export default function HighlightsSection() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const highlights = data?.highlights ?? []

  return (
    <section>
      <SectionHeader title="Last Week's Highlights" subtitle="recap & replays" />
      {isPending ? (
        <div
          role="status"
          aria-label="Loading highlights"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <span className="sr-only">Loading highlights…</span>
          {repeat(2, (key) => (
            <HighlightCardSkeleton key={key} />
          ))}
        </div>
      ) : highlights.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">
          No highlights from last week.
        </p>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: '.highlights-prev',
              nextEl: '.highlights-next',
            }}
            spaceBetween={16}
            slidesPerView={1.05}
            breakpoints={{
              640: { slidesPerView: 1.5 },
              1024: { slidesPerView: 2 },
            }}
            className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
          >
            {highlights.map((highlight, index) => (
              <SwiperSlide key={highlight.id} className="!h-auto">
                <HighlightCard
                  highlight={highlight}
                  accentColor={
                    HIGHLIGHT_ACCENT_COLORS[
                      index % HIGHLIGHT_ACCENT_COLORS.length
                    ]
                  }
                />
              </SwiperSlide>
            ))}
          </Swiper>

          {highlights.length > 1 ? (
            <CarouselNavButtons
              prevClassName="highlights-prev"
              nextClassName="highlights-next"
              label="highlights"
            />
          ) : null}
        </div>
      )}
    </section>
  )
}
