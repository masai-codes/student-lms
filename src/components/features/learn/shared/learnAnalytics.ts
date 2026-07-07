// Learn (listing + detail) GTM click events. Thin wrapper over the shared
// `pushGtmEvent` helper. Every learn event name starts with `l_learn_` and, for
// entity-scoped interactions, embeds the DB row id as `_id_<id>` so triggers can
// distinguish which lecture/assignment/resource/etc. was interacted with. Extra
// identifying context is passed as params.

import { type GtmEventParams, pushGtmEvent } from '@/utils/gtm'
import type { LearnContentType } from './types'

export function pushLearnEvent(event: string, params: GtmEventParams = {}): void {
  pushGtmEvent(event, params)
}

/**
 * GTM event for clicking a learn content card (or any entity-scoped action).
 * Produces names like `l_learn_lecture_card_click_id_42`.
 */
export function learnEntityEvent(type: LearnContentType, action: string, id: number): string {
  return `l_learn_${type}_${action}_id_${id}`
}
