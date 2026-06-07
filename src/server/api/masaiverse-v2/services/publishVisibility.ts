import { sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { clubs, events, masaiverseBanners } from '@/db/schema'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'

/** `meta` key that marks an event/club as published (visible to students). */
export const PUBLISHED_META_KEY = 'isPublished'
/** `meta` key storing the user id of the last editor. */
export const LAST_EDITED_BY_META_KEY = 'lastEditedBy'
/** `meta` key storing the ISO timestamp of the last edit. */
export const LAST_EDITED_AT_META_KEY = 'lastEditedAt'

/**
 * Whether the given user may see *unpublished* (draft) events and clubs. True
 * only for an admin (DB role) who has admin mode toggled on. Everyone else —
 * students, and admins with admin mode off — sees published content only.
 */
export async function canSeeUnpublished(
  userId: number | null | undefined,
): Promise<boolean> {
  if (userId == null) return false
  const state = await getAdminModeState(userId)
  return state.isAdmin && state.enabled
}

/**
 * Visibility filter for `events.meta.isPublished`. Returns `undefined` (no
 * filter) when the viewer may see drafts; otherwise a condition that keeps a row
 * only when it is *explicitly* published (`isPublished === true`). A missing or
 * `false` flag counts as unpublished, so it is hidden from students and from
 * admins outside admin mode.
 */
export function publishedEventCondition(canSee: boolean): SQL | undefined {
  if (canSee) return undefined
  return sql`json_extract(${events.meta}, '$.${sql.raw(PUBLISHED_META_KEY)}') = true`
}

/** As {@link publishedEventCondition}, but for `clubs.meta.isPublished`. */
export function publishedClubCondition(canSee: boolean): SQL | undefined {
  if (canSee) return undefined
  return sql`json_extract(${clubs.meta}, '$.${sql.raw(PUBLISHED_META_KEY)}') = true`
}

/** As {@link publishedEventCondition}, but for `masaiverse_banners.meta.isPublished`. */
export function publishedBannerCondition(canSee: boolean): SQL | undefined {
  if (canSee) return undefined
  return sql`json_extract(${masaiverseBanners.meta}, '$.${sql.raw(PUBLISHED_META_KEY)}') = true`
}
