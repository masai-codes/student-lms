import dayjs from 'dayjs'
import type { CalendarEventDto } from '@/server/api/calendar/calendarTypes'

/**
 * The event object handed to react-big-calendar. `start`/`end` are absolute
 * instants (the DTO strings carry an explicit +05:30 offset), so the grid
 * places them in the viewer's local timezone — the old LMS rendered the grid
 * timezone-naively and disagreed with its own modals for non-IST users.
 */
export interface MyCalendarEvent {
  /** Unique across sources — `<type>-<id>`. */
  key: string
  title: string
  start: Date
  end: Date
  /** Assignments span long windows; render them in the all-day lane. */
  allDay: boolean
  resource: CalendarEventDto
}

export function mapCalendarEvents(
  events: Array<CalendarEventDto>,
): Array<MyCalendarEvent> {
  const mapped: Array<MyCalendarEvent> = []
  for (const dto of events) {
    const start = dayjs(dto.schedule)
    const end = dayjs(dto.effectiveEnd)
    if (!start.isValid() || !end.isValid()) continue
    mapped.push({
      key: `${dto.type}-${dto.id}`,
      title: dto.title,
      start: start.toDate(),
      end: end.toDate(),
      allDay: dto.type === 'assignment',
      resource: dto,
    })
  }
  return mapped
}

/** Events overlapping a local day — used by tests and the "+N more" popover. */
export function eventsOnDay(
  events: Array<MyCalendarEvent>,
  day: string,
): Array<MyCalendarEvent> {
  const dayStart = dayjs(day).startOf('day')
  const dayEnd = dayStart.endOf('day')
  return events.filter(
    (event) =>
      dayjs(event.start).isBefore(dayEnd) && dayjs(event.end).isAfter(dayStart),
  )
}
