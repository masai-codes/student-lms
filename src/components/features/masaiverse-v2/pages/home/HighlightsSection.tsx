import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import HighlightCard from './HighlightCard'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import 'swiper/css'
import 'swiper/css/navigation'

export default function HighlightsSection() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const highlights = data?.highlights ?? []

  return (
    <section>
      <SectionHeader title="Last Week's Highlights" subtitle="recap & replays" />
      {isPending ? (
        <p className="text-[14px] text-[#6B7280]">Loading highlights…</p>
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
            {highlights.map((highlight) => (
              <SwiperSlide key={highlight.id} className="!h-auto">
                <HighlightCard highlight={highlight} />
              </SwiperSlide>
            ))}
          </Swiper>

          {highlights.length > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Previous highlights"
                className="highlights-prev flex size-9 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-[#EF8833] disabled:opacity-40"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Next highlights"
                className="highlights-next flex size-9 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-[#EF8833] disabled:opacity-40"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
