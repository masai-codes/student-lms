import { useQuery } from '@tanstack/react-query'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import EventCard from './EventCard'
import SectionHeader from './SectionHeader'
import { EventCardSkeleton, repeat } from './skeletons'
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
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            View calendar →
          </button>
        }
      />
      {isPending ? (
        <div
          role="status"
          aria-label="Loading events"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <span className="sr-only">Loading events…</span>
          {repeat(4, (key) => (
            <EventCardSkeleton key={key} />
          ))}
        </div>
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
            <CarouselNavButtons
              prevClassName="events-prev"
              nextClassName="events-next"
              label="events"
            />
          ) : null}
        </div>
      )}
    </section>
  )
}
