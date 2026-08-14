// Calendar GTM click events. Thin wrapper over the shared `pushGtmEvent`
// helper. Every calendar event name is prefixed `l_calendar_` so triggers can
// be scoped to this surface, and relevant DB row ids are embedded in the event
// name (`_id_<id>`) with extra context passed as params.

import { type GtmEventParams, pushGtmEvent } from '@/utils/gtm'

export function pushCalendarEvent(
  event: string,
  params: GtmEventParams = {},
): void {
  pushGtmEvent(event, params)
}

/** e.g. `l_calendar_lecture_event_click_id_42`. */
export function calendarEntityEvent(
  type: string,
  action: string,
  id: number,
): string {
  return `l_calendar_${type}_${action}_id_${id}`
}
