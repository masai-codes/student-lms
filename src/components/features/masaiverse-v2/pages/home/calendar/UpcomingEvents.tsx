import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'
import { getEventCardDisplay } from '@/lib/masaiverseEventCard'
import { masaiverseV2HomeQuery } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../../tracking'

/**
 * The calendar drawer's "Upcoming events" list. Uses the same source as the
 * home page's "Live & Upcoming" section, so the listing stays in lockstep:
 * public events plus the events of the clubs the member has joined.
 */
export default function UpcomingEvents() {
  const { data, isPending } = useQuery(masaiverseV2HomeQuery())
  const events = data?.events ?? []

  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        Upcoming events
      </p>
      {isPending ? (
        <div
          role="status"
          aria-label="Loading upcoming events"
          className="flex flex-col gap-3"
        >
          <span className="sr-only">Loading upcoming events…</span>
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-10 animate-pulse rounded-[8px] bg-[#ECE7E2]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-[12px] text-[#9CA3AF]">
          No live or upcoming events right now.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <UpcomingEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function UpcomingEventRow({ event }: { event: MasaiverseV2HomeEvent }) {
  const display = getEventCardDisplay(event, new Date())

  return (
    <Link
      to="/masaiverse/event/$eventId"
      params={{ eventId: event.id }}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.eventCardClick, {
          event_id: event.id,
          source: 'calendar_upcoming',
        })
      }
      className="flex gap-3 rounded-[8px] -mx-1 px-1 py-1 transition-colors hover:bg-masaiverse-orange/10"
    >
      <div className="flex w-7 shrink-0 flex-col items-center leading-none">
        <span className="text-[16px] font-bold text-[#111827]">
          {display.dateDay || '—'}
        </span>
        <span className="text-[10px] font-semibold text-[#9CA3AF]">
          {display.dateMonth}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-5 text-[#111827]">
          {event.title}
        </p>
        {event.belowTitle ? (
          <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
            {event.belowTitle}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
