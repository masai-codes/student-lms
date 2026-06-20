import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubs } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  LAST_EDITED_AT_META_KEY,
  LAST_EDITED_BY_META_KEY,
} from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

/** Plain `clubs` columns an admin may edit inline. */
const EDITABLE_COLUMNS = new Set(['name', 'image', 'domain'])
/** `clubs.meta` keys an admin may edit inline. */
const EDITABLE_META = new Set([
  'cardImageLink',
  'clubDetailBannerSubtitle',
  'belowTitleCardText',
  'clubDetailBannerTags',
  'description',
  'aboutCardDetails',
  'learningTenureDateText',
  'learningTenureData',
  'galleryImages',
  'confirmationModalText',
  'projectsBuild',
  'cardDescription',
  'detail_description',
  'isPublished',
])

export interface UpdateClubInput {
  clubId: number
  column?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/**
 * Applies an admin's inline edits to a club — any subset of whitelisted columns
 * and/or `meta` keys — and stamps `meta.lastEditedBy` / `lastEditedAt`. Rejects
 * non-admins with a 403. Unknown keys are ignored, not an error.
 */
export async function updateMasaiverseClub(
  userId: number,
  input: UpdateClubInput,
  now: Date = new Date(),
): Promise<{ success: true }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(input.clubId))
    throw new ApiError(400, 'INVALID_UPDATE_PAYLOAD')

  const rows = await db
    .select({ meta: clubs.meta })
    .from(clubs)
    .where(eq(clubs.id, input.clubId))
    .limit(1)
  const existing = rows.at(0)
  if (!existing) throw new ApiError(404, 'CLUB_NOT_FOUND')

  const setPayload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input.column ?? {})) {
    if (!EDITABLE_COLUMNS.has(key)) continue
    setPayload[key] = value
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

  await db.update(clubs).set(setPayload).where(eq(clubs.id, input.clubId))

  return { success: true }
}
