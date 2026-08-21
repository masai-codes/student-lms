// "My Programs" listing GTM click events. Thin wrapper over the shared
// `pushGtmEvent` helper. Every event name starts with `l_my_courses_` and,
// for program-scoped interactions, embeds the batch id as `_id_<batchId>`
// so triggers can tell which program was interacted with.

import { type GtmEventParams, pushGtmEvent } from '@/utils/gtm'

export function pushMyCoursesEvent(
  event: string,
  params: GtmEventParams = {},
): void {
  pushGtmEvent(event, { source: 'my-courses', ...params })
}

/** e.g. `l_my_courses_card_click_id_42`. */
export function myCoursesEntityEvent(action: string, batchId: number): string {
  return `l_my_courses_${action}_id_${batchId}`
}
