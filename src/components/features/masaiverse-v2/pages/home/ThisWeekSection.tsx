import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import EventCard from './EventCard'
import SectionHeader from './SectionHeader'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import 'swiper/css'
import 'swiper/css/navigation'

type ThisWeekSectionProps = {
  onViewCalendar: () => void
}

export default function ThisWeekSection({
  onViewCalendar,
}: ThisWeekSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const events = data?.events ?? []

  return (
    <section>
      <SectionHeader
        title="This Week on MasaiVerse"
        subtitle={
          events.length
            ? `· ${events.length} event${events.length === 1 ? '' : 's'} live or upcoming`
            : undefined
        }
        action={
          <button
            type="button"
            onClick={onViewCalendar}
            className="text-[14px] font-medium text-[#EF8833] hover:underline"
          >
            View calendar →
          </button>
        }
      />
      {isPending ? (
        <p className="text-[14px] text-[#6B7280]">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">
          No live or upcoming events right now.
        </p>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: '.events-prev', nextEl: '.events-next' }}
            spaceBetween={16}
            slidesPerView={1.1}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="[&_.swiper-slide]:!h-auto [&_.swiper-wrapper]:items-stretch"
          >
            {events.map((event) => (
              <SwiperSlide key={event.id} className="!h-auto">
                <EventCard event={event} />
              </SwiperSlide>
            ))}
          </Swiper>

          {events.length > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Previous events"
                className="events-prev flex size-9 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-[#EF8833] disabled:opacity-40"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                aria-label="Next events"
                className="events-next flex size-9 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-[#EF8833] disabled:opacity-40"
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
