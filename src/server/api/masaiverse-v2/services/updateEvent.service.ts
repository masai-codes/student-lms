import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  LAST_EDITED_AT_META_KEY,
  LAST_EDITED_BY_META_KEY,
} from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

/** Plain `events` columns an admin may edit inline. */
const EDITABLE_COLUMNS = new Set([
  'title',
  'description',
  'category',
  'mode',
  'locationTitle',
  'locationMapLink',
  'eventLink',
  'imageLink',
  'platform',
  'startTime',
  'endTime',
])
/** Columns whose value is an ISO timestamp to be stored as MySQL UTC. */
const DATE_COLUMNS = new Set(['startTime', 'endTime'])
/** `events.meta` keys an admin may edit inline. */
const EDITABLE_META = new Set([
  'aboveTitle',
  'belowTitle',
  'isWeeklyConnect',
  'isPublished',
  'confirmationModalText',
  'eventSummary',
  'event_detail_description',
  'pastEventEmojiValue',
  'hostedBy',
])

export interface UpdateEventInput {
  eventId: number
  /** Partial set of plain-column updates (whitelisted server-side). */
  column?: Record<string, unknown>
  /** Partial set of `meta` updates (whitelisted, merged into existing meta). */
  meta?: Record<string, unknown>
}

/** Coerces an ISO date string to a MySQL UTC timestamp, or null when blank/invalid. */
function toDbTimestamp(value: unknown): string | null {
  if (value == null || value === '') return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : toMysqlUtc(date)
}

/**
 * Applies an admin's inline edits to an event — any subset of whitelisted
 * columns and/or `meta` keys — and stamps `meta.lastEditedBy` / `lastEditedAt`.
 * Rejects non-admins with a 403. Unknown keys are ignored, not an error.
 */
export async function updateMasaiverseEvent(
  userId: number,
  input: UpdateEventInput,
  now: Date = new Date(),
): Promise<{ success: true }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(input.eventId)) throw new ApiError(400, 'INVALID_UPDATE_PAYLOAD')

  const rows = await db
    .select({ meta: events.meta })
    .from(events)
    .where(eq(events.id, input.eventId))
    .limit(1)
  const existing = rows.at(0)
  if (!existing) throw new ApiError(404, 'EVENT_NOT_FOUND')

  const setPayload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input.column ?? {})) {
    if (!EDITABLE_COLUMNS.has(key)) continue
    setPayload[key] = DATE_COLUMNS.has(key) ? toDbTimestamp(value) : value
  }

  const meta = { ...((existing.meta ?? {}) as Record<string, unknown>) }
  for (const [key, value] of Object.entries(input.meta ?? {})) {
    if (!EDITABLE_META.has(key)) continue
    meta[key] = value
  }
  meta[LAST_EDITED_BY_META_KEY] = userId
  meta[LAST_EDITED_AT_META_KEY] = now.toISOString()

  setPayload.meta = meta
  setPayload.updatedAt = toMysqlUtc(now)

  await db
    .update(events)
    .set(setPayload)
    .where(eq(events.id, input.eventId))

  return { success: true }
}
