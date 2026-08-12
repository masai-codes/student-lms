import { pushGtmEvent } from '@/utils/gtm'
import type { GtmEventParams } from '@/utils/gtm'

/** Every profile-surface event name starts here, so GTM can trigger on the prefix. */
const PROFILE_EVENT_PREFIX = 'l_profile_'

/**
 * Fires a profile GA/GTM event. Call synchronously at click time, before any
 * navigation or await.
 *
 * @param action kebab/snake action suffix, e.g. `tab_click` or `session_revoke`.
 */
export function pushProfileEvent(
  action: string,
  params: GtmEventParams = {},
): void {
  pushGtmEvent(`${PROFILE_EVENT_PREFIX}${action}`, params)
}

/**
 * Event for a click that targets a specific DB row — the id goes in the *name*
 * (`..._id_<id>`) as well as the params, so dashboards can segment per entity.
 */
export function pushProfileEntityEvent(
  action: string,
  entityType: string,
  id: number | string,
  params: GtmEventParams = {},
): void {
  pushProfileEvent(`${entityType}_${action}_id_${id}`, {
    entity_type: entityType,
    entity_id: id,
    ...params,
  })
}
