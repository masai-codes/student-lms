import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { masaiverseBanners } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import { toMysqlUtc } from '@/lib/dateRanges'

const EDITABLE_COLUMNS = new Set([
  'title',
  'description',
  'ctaText',
  'ctaUrl',
  'startDate',
  'endDate',
])
const DATE_COLUMNS = new Set(['startDate', 'endDate'])
/** Only `isPublished` lives in a banner's `meta` for now. */
const EDITABLE_META = new Set(['isPublished'])

export interface UpdateBannerInput {
  bannerId: number
  column?: Record<string, unknown>
  meta?: Record<string, unknown>
}

function toDbTimestamp(value: unknown): string | null {
  if (value == null || value === '') return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : toMysqlUtc(date)
}

/**
 * Applies an admin's edits to a banner — whitelisted columns and/or `meta` keys
 * — and stamps the `last_edited_by` column + `updated_at`. Admin-only (403).
 */
export async function updateMasaiverseBanner(
  userId: number,
  input: UpdateBannerInput,
  now: Date = new Date(),
): Promise<{ success: true }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(input.bannerId)) throw new ApiError(400, 'INVALID_UPDATE_PAYLOAD')

  const rows = await db
    .select({ meta: masaiverseBanners.meta })
    .from(masaiverseBanners)
    .where(eq(masaiverseBanners.id, input.bannerId))
    .limit(1)
  const existing = rows.at(0)
  if (!existing) throw new ApiError(404, 'BANNER_NOT_FOUND')

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

  setPayload.meta = meta
  setPayload.lastEditedBy = userId
  setPayload.updatedAt = toMysqlUtc(now)

  await db
    .update(masaiverseBanners)
    .set(setPayload)
    .where(eq(masaiverseBanners.id, input.bannerId))

  return { success: true }
}
