import type {
  CalendarBatchesResponse,
  CalendarEventsResponse,
} from '@/server/api/calendar/calendarTypes'
import { CALENDAR_API } from '@/lib/api/calendarPaths'
import { fetchJson } from '@/lib/api/fetchJson'

export interface FetchCalendarEventsInput {
  /** Inclusive visible-range bounds, `YYYY-MM-DD` in the viewer's local days. */
  start: string
  end: string
  /** Narrow to one enrolled batch; omit for all. */
  batchId?: number
}

export async function fetchCalendarEvents(
  input: FetchCalendarEventsInput,
): Promise<CalendarEventsResponse> {
  const params = new URLSearchParams({ start: input.start, end: input.end })
  if (input.batchId != null) params.set('batchId', String(input.batchId))
  return fetchJson<CalendarEventsResponse>(
    `${CALENDAR_API.events}?${params.toString()}`,
  )
}

export async function fetchCalendarBatches(): Promise<CalendarBatchesResponse> {
  return fetchJson<CalendarBatchesResponse>(CALENDAR_API.batches)
}

/** Mints (or returns) the personal ICS feed URL for calendar subscriptions. */
export async function fetchCalendarSubscriptionLink(): Promise<{
  calendarUrl: string
}> {
  return fetchJson<{ calendarUrl: string }>(CALENDAR_API.subscriptionLink)
}
