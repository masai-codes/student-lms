import type { EventType } from '@/server/masaiverse/fetchEvents'
import { EventCard } from '@/components/event-card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { mapEventToCardProps } from '@/components/features/masaiverse/MasaiverseSections/cardDataMappers'

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
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          {eventsList.slice(0, 2).map((event) => {
            const isEnrolled = enrolledEventIds.includes(event.id)
            const eventCardProps = mapEventToCardProps(event)
            const eventEndTime = event.endTime
              ? new Date(event.endTime).getTime()
              : Number.POSITIVE_INFINITY
            const isPastEvent =
              Number.isFinite(eventEndTime) && eventEndTime < Date.now()
            const isOfflineEvent = event.mode === 'offline'
            const enrolledRedirectLink = isOfflineEvent
              ? event.locationMapLink
              : event.eventLink
            const enrolledCtaText = isOfflineEvent
              ? 'View Location'
              : 'Open Link'

            return (
              <EventCard
                key={event.id}
                {...eventCardProps}
                isActive={!isPastEvent && eventCardProps.isActive}
                cardCtaText="View Details"
                drawerCtaText={
                  isPastEvent
                    ? 'View Details'
                    : isEnrolled
                      ? enrolledRedirectLink
                        ? enrolledCtaText
                        : 'Enrolled'
                      : 'Enroll'
                }
                hideDrawerCta={isPastEvent}
                onCtaClick={
                  isPastEvent
                    ? undefined
                    : isEnrolled
                      ? enrolledRedirectLink
                        ? () => {
                            window.open(
                              enrolledRedirectLink,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }
                        : undefined
                      : joiningEventId
                        ? undefined
                        : () => {
                            onEventEnroll(event.id)
                          }
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HomeEventsPreview
