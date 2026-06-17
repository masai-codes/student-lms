import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  LAST_EDITED_AT_META_KEY,
  LAST_EDITED_BY_META_KEY,
  PUBLISHED_META_KEY,
} from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

/**
 * Clones an existing event into a brand-new unpublished (draft) row owned by
 * `userId`. Every editable column and meta field is copied from the source, then
 * the draft is reset to `meta.isPublished = false` and re-stamped with the new
 * editor/owner — so the clone is visible only to admins in admin mode until they
 * publish it. The title gets a " (Copy)" suffix so admins can tell drafts apart.
 *
 * Rejects non-admins with a 403, and an unknown `eventId` with a 404.
 */
export async function cloneMasaiverseEvent(
  userId: number,
  eventId: number,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) {
    throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  }
  if (!Number.isFinite(eventId)) throw new ApiError(404, 'EVENT_NOT_FOUND')

  const rows = await db
    .select({
      clubId: events.clubId,
      title: events.title,
      description: events.description,
      category: events.category,
      mode: events.mode,
      locationTitle: events.locationTitle,
      locationMapLink: events.locationMapLink,
      eventLink: events.eventLink,
      imageLink: events.imageLink,
      platform: events.platform,
      startTime: events.startTime,
      endTime: events.endTime,
      meta: events.meta,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)
  const source = rows.at(0)
  if (!source) throw new ApiError(404, 'EVENT_NOT_FOUND')

  const nowUtc = toMysqlUtc(now)
  const meta = {
    ...(source.meta ?? {}),
    [PUBLISHED_META_KEY]: false,
    [LAST_EDITED_BY_META_KEY]: userId,
    [LAST_EDITED_AT_META_KEY]: now.toISOString(),
  }

  const [header] = await db.insert(events).values({
    clubId: source.clubId,
    title: `${source.title} (Copy)`,
    description: source.description,
    category: source.category,
    mode: source.mode,
    locationTitle: source.locationTitle,
    locationMapLink: source.locationMapLink,
    eventLink: source.eventLink,
    imageLink: source.imageLink,
    platform: source.platform,
    startTime: source.startTime,
    endTime: source.endTime,
    meta,
    createdBy: userId,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  return { id: String(header.insertId) }
}
