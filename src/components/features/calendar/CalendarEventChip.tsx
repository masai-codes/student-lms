import dayjs from 'dayjs'
import type { MyCalendarEvent } from '@/lib/calendar/calendarEventMapping'

/**
 * Custom react-big-calendar event renderer — the wrapper `.rbc-event` carries
 * the per-type token classes (via `eventPropGetter`); this fills in the
 * content with a stable test id, which RBC's own DOM can't carry.
 */
export function CalendarEventChip({ event }: { event: MyCalendarEvent }) {
  const timeLabel = event.allDay ? null : dayjs(event.start).format('h:mm A')
  return (
    <span
      data-testid="my-calendar-event-chip"
      data-event-key={event.key}
      className="flex min-w-0 items-baseline gap-1 text-xs leading-tight"
      title={event.title}
    >
      {timeLabel ? (
        <span className="shrink-0 font-medium opacity-80">{timeLabel}</span>
      ) : null}
      <span className="truncate font-medium">{event.title}</span>
    </span>
  )
}
