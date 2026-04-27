import type { EventType } from '@/server/masaiverse/fetchEvents'
import { eventDbTimestampToMs } from '@/lib/eventTimestamps'
import { EventCard } from '@/components/event-card'
import { Button } from '@/components/ui/button'
import {
  MASAIVERSE_DRAWER_SCROLL_BODY_PADDING,
  MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET,
  MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET,
  isMasaiverseApp,
} from '@/constants/masaiverseDrawerUi'
import { ChevronRight } from 'lucide-react'
import { mapEventToCardProps } from '@/components/features/masaiverse/MasaiverseSections/cardDataMappers'
import { Swiper, SwiperSlide } from 'swiper/react'

type HomeEventsPreviewProps = {
  isLoading: boolean
  eventsList: Array<EventType>
  enrolledEventIds: Array<string>
  joiningEventId: string | null
  onViewAll: () => void
  onEventEnroll: (eventId: string) => void
}

const HomeEventsPreview = ({
  isLoading,
  eventsList,
  enrolledEventIds,
  joiningEventId,
  onViewAll,
  onEventEnroll,
}: HomeEventsPreviewProps) => {
  const isApp = isMasaiverseApp()
  const previewEvents = eventsList.slice(0, 2)
  const isSinglePreviewEvent = previewEvents.length === 1

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-[#111827]">
          This Week on MasaiVerse
        </h2>
        {eventsList.length > 1 ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-[#EF8833] hover:text-[#EF8833] hover:no-underline"
            onClick={onViewAll}
          >
            View all
            <ChevronRight size={14} color="#EF8833" />
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-[#6B7280]">Loading events...</p>
      ) : eventsList.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280]">
          No events available right now.
        </p>
      ) : (
        <div className="relative mt-4 overflow-hidden">
          <Swiper
            spaceBetween={16}
            slidesPerView={isSinglePreviewEvent ? 1 : 1.5}
            breakpoints={{
              768: {
                slidesPerView: 2,
              },
            }}
            className="w-full px-2 [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:!h-auto"
          >
            {previewEvents.map((event) => {
              const eventId = String(event.id)
              const isEnrolled = enrolledEventIds.includes(eventId)
              const eventCardProps = mapEventToCardProps(event)
              const eventEndTime = eventDbTimestampToMs(event.endTime) ?? Number.POSITIVE_INFINITY
              const isPastEvent =
                Number.isFinite(eventEndTime) && eventEndTime < Date.now()
              const isEventActive = !isPastEvent && eventCardProps.isActive
              const isOfflineEvent = event.mode === 'offline'
              const ctaLink = isOfflineEvent ? event.locationMapLink : event.eventLink
              const shouldShowEnrollCta = isEventActive && !isEnrolled
              const shouldShowOpenLinkCta =
                isEventActive && isEnrolled && Boolean(ctaLink)
              const shouldHideDrawerCta = !(shouldShowEnrollCta || shouldShowOpenLinkCta)

              return (
                <SwiperSlide key={event.id} className="!flex !h-auto">
                  <div className="min-w-0 w-full [&>div]:!max-w-none">
                    <EventCard
                      {...eventCardProps}
                      isActive={isEventActive}
                      drawerBottomInsetClassName={MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET}
                      drawerBodyClassName={MASAIVERSE_DRAWER_SCROLL_BODY_PADDING}
                      drawerPinFooter
                      drawerFooterClassName={
                        isApp ? undefined : MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET
                      }
                      cardCtaText="View Details"
                      drawerCtaText={shouldShowOpenLinkCta ? 'Open Link' : 'Enroll'}
                      hideDrawerCta={shouldHideDrawerCta}
                      onCtaClick={
                        shouldShowOpenLinkCta
                          ? () => {
                              if (!ctaLink) return
                              window.open(
                                ctaLink,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                          : shouldShowEnrollCta && !joiningEventId
                            ? () => {
                                onEventEnroll(eventId)
                              }
                            : undefined
                      }
                    />
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      )}
    </div>
  )
}

export default HomeEventsPreview
