import { Link } from '@tanstack/react-router'
import { MONTH_NAMES } from './calendarUtils'
import type { CalendarEvent } from './calendarUtils'
import { formatIstDateTime } from '@/lib/masaiverseEventCard'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../../tracking'

type CalendarDayEventsProps = {
  /** Selected day key (YYYY-MM-DD); null when no day is selected. */
  dateKey: string | null
  /** Events that fall on the selected day, in start-time order. */
  events: Array<CalendarEvent>
}

/** A friendly "Mon 5 June" heading from a YYYY-MM-DD key (no timezone math). */
function formatDayHeading(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  return `${weekday} ${day} ${MONTH_NAMES[month - 1]}`
}

/**
 * The events on the day the user clicked in the calendar. Renders nothing until
 * a day is selected; once selected it shows that day's events (public + the
 * member's clubs) or a gentle empty line.
 */
export default function CalendarDayEvents({
  dateKey,
  events,
}: CalendarDayEventsProps) {
  if (!dateKey) return null

  return (
    <div className="rounded-[12px] bg-[#FBF9F8] p-3">
      <p className="mb-2 text-[12px] font-bold text-[#111827]">
        {formatDayHeading(dateKey)}
      </p>
      {events.length === 0 ? (
        <p className="text-[12px] text-[#9CA3AF]">No events on this day.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                to="/masaiverse/event/$eventId"
                params={{ eventId: event.id }}
                search={(prev) => prev}
                onClick={() =>
                  trackMasaiverse(MASAIVERSE_EVENTS.eventCardClick, {
                    event_id: event.id,
                    source: 'calendar_day',
                  })
                }
                className="flex flex-col gap-0.5 rounded-[8px] -mx-1 px-1 py-0.5 transition-colors hover:bg-masaiverse-orange/10"
              >
                <span className="text-[13px] font-semibold leading-4 text-[#111827]">
                  {event.title}
                </span>
                <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6B7280]">
                  {formatIstDateTime(event.startTime) ?? 'Time TBA'}
                  {event.clubName ? (
                    <span className="rounded-full bg-masaiverse-orange/15 px-1.5 py-0.5 font-semibold text-masaiverse-orange">
                      {event.clubName}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
