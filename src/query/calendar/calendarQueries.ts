import type { FetchCalendarEventsInput } from '@/lib/api/calendar/calendarApi'
import {
  fetchCalendarBatches,
  fetchCalendarEvents,
} from '@/lib/api/calendar/calendarApi'

export const CALENDAR_KEYS = {
  all: ['calendar'] as const,
  events: (input: FetchCalendarEventsInput) =>
    ['calendar', 'events', input.start, input.end, input.batchId ?? null] as const,
  batches: ['calendar', 'batches'] as const,
}

/** Merged lecture/assignment/quiz events for the visible range. */
export const calendarEventsQuery = (input: FetchCalendarEventsInput) => ({
  queryKey: CALENDAR_KEYS.events(input),
  queryFn: () => fetchCalendarEvents(input),
  staleTime: 30 * 1000,
})

/** Enrolled batches for the filter dropdown — changes rarely, cache longer. */
export const calendarBatchesQuery = () => ({
  queryKey: CALENDAR_KEYS.batches,
  queryFn: fetchCalendarBatches,
  staleTime: 5 * 60 * 1000,
})
