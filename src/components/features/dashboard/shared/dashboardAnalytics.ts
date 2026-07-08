// Dashboard GTM click events. Thin wrapper over the shared `pushGtmEvent`
// helper. Every dashboard event name contains the word `dashboard` so triggers
// can be scoped to the dashboard surface, and relevant DB row ids are embedded
// in the event name (`_id_<id>`) with extra context passed as params.

import { type GtmEventParams, pushGtmEvent } from '@/utils/gtm'

export function pushDashboardEvent(event: string, params: GtmEventParams = {}): void {
  pushGtmEvent(event, params)
}

/** GTM event for a welcome-banner click: `l_dashboard_banner_carousel_<key>_id_<id>`. */
export function bannerClickEvent(analyticsKey: string, id: number): string {
  return `l_dashboard_banner_carousel_${analyticsKey}_id_${id}`
}
