import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import EventHeroImage from './event/EventHeroImage'
import EventHosts from './event/EventHosts'
import EventInfoRows from './event/EventInfoRows'
import EventRatingCard from './event/EventRatingCard'
import EventRegisterCard from './event/EventRegisterCard'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { RichContent } from '@/components/event-card/rich-content'
import { ApiClientError } from '@/lib/api/apiClientError'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'

type EventDetailPageProps = {
  eventId: string
}

function BackToEventsLink() {
  return (
    <Link
      to="/masaiverse/events"
      search={(prev) => prev}
      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
    >
      <ArrowLeft size={16} />
      Back to events
    </Link>
  )
}

/** Category / weekly-connect / mode pills shown under the title. */
function EventPills({ event }: { event: MasaiverseV2EventDetail }) {
  const labels: Array<string> = []
  if (event.isWeeklyConnect) labels.push('Weekly Connect')
  if (event.category) labels.push(event.category)
  if (event.mode) labels.push(event.mode === 'online' ? 'Online' : 'In-person')
  if (labels.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full bg-masaiverse-orange/10 px-3 py-1 text-[12px] font-semibold capitalize text-masaiverse-orange"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

/**
 * Luma-style event registration page. The hero image sits beside the event's
 * title, host, when/where rows, and the registration card; the long-form
 * description follows below. Data is fetched live by `eventId`.
 */
export default function EventDetailPage({ eventId }: EventDetailPageProps) {
  const { data: event, isPending, error } = useQuery(
    masaiverseV2EventDetailQuery(eventId),
  )

  if (isPending) {
    return (
      <div>
        <BackToEventsLink />
        <div
          role="status"
          aria-label="Loading event"
          className="mt-4 h-72 animate-pulse rounded-[20px] bg-[#ECE7E2]"
        >
          <span className="sr-only">Loading event…</span>
        </div>
      </div>
    )
  }

  if (error) {
    const notFound = error instanceof ApiClientError && error.status === 404
    return (
      <div>
        <BackToEventsLink />
        <h2 className="mt-4 text-[20px] font-bold leading-7 text-[#111827]">
          {notFound ? 'Event not found' : 'Something went wrong'}
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
          {notFound
            ? `We couldn't find an event with id "${eventId}".`
            : "We couldn't load this event. Please try again."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToEventsLink />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 md:sticky md:top-4 md:self-start">
          <EventHeroImage event={event} />
          <EventHosts hosts={event.hostedBy} />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            {event.aboveTitle ? (
              <p className="text-[12px] font-semibold uppercase tracking-wide text-masaiverse-orange">
                {event.aboveTitle}
              </p>
            ) : null}
            <h1 className="mt-1 text-[28px] font-extrabold leading-9 text-[#111827] sm:text-[32px]">
              {event.title}
            </h1>
            {event.belowTitle ? (
              <p className="mt-1.5 text-[15px] leading-6 text-[#6B7280]">
                {event.belowTitle}
              </p>
            ) : null}
            {event.clubName ? (
              <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
                Hosted by{' '}
                <span className="font-semibold text-[#111827]">
                  {event.clubName}
                </span>
              </p>
            ) : null}
            <EventPills event={event} />
          </div>

          <EventInfoRows event={event} />
          <EventRegisterCard event={event} />
          <EventRatingCard event={event} />

          {event.description ? (
            <section>
              <h2 className="text-[16px] font-bold leading-6 text-[#111827]">
                About this event
              </h2>
              {/* Description may contain markdown / raw HTML tags — render it
                  richly (sanitized) instead of as plain text. */}
              <RichContent
                value={event.description}
                className="mt-2 text-[14px] leading-6 text-[#4B5563]"
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
