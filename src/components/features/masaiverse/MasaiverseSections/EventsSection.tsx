import { useEffect, useMemo, useState } from 'react'
import type { EventType } from '@/server/masaiverse/fetchEvents'
import { EventCard } from '@/components/event-card'
import { MasaiTabs } from '@/components/masai-tabs'
import { fetchAllEvents } from '@/server/masaiverse/fetchEvents'
import { fetchMyEventEnrollments } from '@/server/masaiverse/fetchMyEventEnrollments'
import { joinEvent } from '@/server/masaiverse/joinEvent'
import { mapEventToCardProps } from '@/components/features/masaiverse/MasaiverseSections/cardDataMappers'
import {
  MASAIVERSE_DRAWER_SCROLL_BODY_PADDING,
  MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET,
  MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET,
} from '@/constants/masaiverseDrawerUi'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type EventCategoryTab = 'all' | NonNullable<EventType['category']>

const formatCategoryLabel = (category: EventCategoryTab) =>
  category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()

const EventsSection = () => {
  const [eventsList, setEventsList] = useState<Array<EventType>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<EventCategoryTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [enrolledEventIds, setEnrolledEventIds] = useState<Array<string>>([])
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  useEffect(() => {
    let isMounted = true

    const getEvents = async () => {
      try {
        const trimmedQuery = debouncedSearchQuery.trim()
        const [events, eventEnrollments] = await Promise.all([
          fetchAllEvents({
            data: {
              searchQuery: trimmedQuery.length > 0 ? trimmedQuery : undefined,
            },
          }),
          fetchMyEventEnrollments(),
        ])
        if (isMounted) {
          setEventsList(events)
          setEnrolledEventIds(eventEnrollments)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getEvents()

    return () => {
      isMounted = false
    }
  }, [debouncedSearchQuery])

  const categoryTabs = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(eventsList.map((event) => event.category).filter(Boolean)),
    ) as Array<Exclude<EventType['category'], null>>

    return ['all', ...uniqueCategories] as Array<EventCategoryTab>
  }, [eventsList])

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return eventsList
    return eventsList.filter((event) => event.category === activeCategory)
  }, [activeCategory, eventsList])

  const handleEventEnroll = async (eventId: string) => {
    if (joiningEventId || enrolledEventIds.includes(eventId)) {
      return
    }

    setJoiningEventId(eventId)
    try {
      await joinEvent({ data: { eventId } })
      setEnrolledEventIds((prev) =>
        prev.includes(eventId) ? prev : [...prev, eventId],
      )
    } finally {
      setJoiningEventId(null)
    }
  }

  return (
    <section className="min-h-[max(400px,calc(100dvh-11rem))] min-w-0 flex-1 rounded-[16px] border border-[#E5E7EB] bg-[#fff] px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-[24px] font-semibold text-[#111827]">Events</h1>
        <div className="relative h-10 w-full md:w-[282px]">
          <Search className="pointer-events-none absolute left-[11px] top-1/2 size-5 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
            className="h-full rounded-[8px] border border-[#E5E7EB] bg-white pl-[39px] text-[14px] leading-5 text-[#111827] placeholder:text-[#9CA3AF]"
            aria-label="Search events by name"
          />
        </div>
      </div>

      <div className="mt-6 h-[1px] bg-[#E5E7EB]" aria-hidden />

      <div className="mt-6 flex justify-center">
        <MasaiTabs
          ariaLabel="Event categories"
          items={categoryTabs.map((category) => ({
            value: category,
            label: formatCategoryLabel(category),
          }))}
          value={activeCategory}
          onValueChange={(value) =>
            setActiveCategory(value as EventCategoryTab)
          }
        />
      </div>

      <div className="mt-6 h-[1px] bg-[#E5E7EB]" aria-hidden />

      {isLoading ? (
        <p className="mt-4 text-sm text-[#6B7280]">Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280]">
          {searchQuery.trim().length > 0
            ? 'No events found matching your search.'
            : 'No events found for this category.'}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
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
              <div
                key={event.id}
                className="min-w-0 w-full [&>div]:!max-w-none"
              >
                <EventCard
                {...eventCardProps}
                isActive={!isPastEvent && eventCardProps.isActive}
                drawerBottomInsetClassName={MASAIVERSE_MOBILE_TAB_DRAWER_CONTENT_INSET}
                drawerBodyClassName={MASAIVERSE_DRAWER_SCROLL_BODY_PADDING}
                drawerPinFooter
                drawerFooterClassName={MASAIVERSE_MOBILE_TAB_DRAWER_FOOTER_INSET}
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
                            void handleEventEnroll(event.id)
                          }
                }
              />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default EventsSection
