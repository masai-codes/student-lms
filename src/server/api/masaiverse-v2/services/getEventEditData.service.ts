import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubs, events } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

export interface MasaiverseV2EventEditData {
  id: string
  columns: {
    title: string
    description: string | null
    category: string | null
    mode: string | null
    /** Hosting club id (as a string), or null for a community-wide event. */
    clubId: string | null
    locationTitle: string | null
    locationMapLink: string | null
    eventLink: string | null
    imageLink: string | null
    platform: string | null
    /** UTC ISO so the client can show/edit it in IST. */
    startTime: string | null
    endTime: string | null
  }
  /** Raw `events.meta` so the edit drawer can seed every editable field. */
  meta: Record<string, unknown>
  /** All clubs (id + name), so the drawer can offer a host-club picker. */
  clubs: Array<{ id: string; name: string }>
}

function toUtcIso(value: string | null): string | null {
  return parseMasaiverseEventDbTimestamp(value)?.toISOString() ?? null
}

/**
 * Returns an event's raw editable data (columns + full `meta`) for the admin
 * edit drawer. Admin-only — exposes raw meta the public detail payload omits.
 */
export async function getEventEditData(
  userId: number,
  eventId: number,
): Promise<MasaiverseV2EventEditData> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(eventId)) throw new ApiError(404, 'EVENT_NOT_FOUND')

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      category: events.category,
      mode: events.mode,
      clubId: events.clubId,
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
  const row = rows.at(0)
  if (!row) throw new ApiError(404, 'EVENT_NOT_FOUND')

  const clubRows = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .orderBy(asc(clubs.name))

  return {
    id: String(row.id),
    columns: {
      title: row.title,
      description: row.description ?? null,
      category: row.category ?? null,
      mode: row.mode ?? null,
      clubId: row.clubId != null ? String(row.clubId) : null,
      locationTitle: row.locationTitle ?? null,
      locationMapLink: row.locationMapLink ?? null,
      eventLink: row.eventLink ?? null,
      imageLink: row.imageLink ?? null,
      platform: row.platform ?? null,
      startTime: toUtcIso(row.startTime),
      endTime: toUtcIso(row.endTime),
    },
    meta: (row.meta ?? {}) as Record<string, unknown>,
    clubs: clubRows.map((club) => ({ id: String(club.id), name: club.name })),
  }
}
