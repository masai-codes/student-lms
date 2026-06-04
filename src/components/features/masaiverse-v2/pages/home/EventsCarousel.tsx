import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import CarouselNavButtons from './CarouselNavButtons'
import EventCard from './EventCard'
import { EventCardSkeleton, repeat } from './skeletons'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'
import 'swiper/css'
import 'swiper/css/navigation'

type EventsCarouselProps = {
  events: Array<MasaiverseV2HomeEvent>
  isPending: boolean
  /** Accessible label for the loading state. */
  loadingLabel: string
  /** Copy shown when there are no events. */
  emptyMessage: string
  /** Unique nav-button class prefix so multiple carousels can coexist. */
  navKey?: string
}

/**
 * Shared events carousel — swiper of {@link EventCard}s, with loading skeletons
 * and an empty state. Used by the home "This Week" section and the club page's
 * upcoming/live section so the card layout lives in one place.
 */
export default function EventsCarousel({
  events,
  isPending,
  loadingLabel,
  emptyMessage,
  navKey = 'events',
}: EventsCarouselProps) {
  if (isPending) {
    return (
      <div
        role="status"
        aria-label={loadingLabel}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <span className="sr-only">{loadingLabel}…</span>
        {repeat(4, (key) => (
          <EventCardSkeleton key={key} />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return <p className="text-[14px] text-[#6B7280]">{emptyMessage}</p>
  }

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation]}
        navigation={{ prevEl: `.${navKey}-prev`, nextEl: `.${navKey}-next` }}
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
          prevClassName={`${navKey}-prev`}
          nextClassName={`${navKey}-next`}
          label="events"
        />
      ) : null}
    </div>
  )
}
