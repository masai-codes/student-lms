import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubs } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'

export interface MasaiverseV2ClubEditData {
  id: string
  name: string
  /** Raw `clubs.meta` so the edit drawer can seed every editable field. */
  meta: Record<string, unknown>
}

/**
 * Returns a club's raw editable data (name + full `meta`) for the admin edit
 * drawer. Admin-only — the raw meta isn't part of the public detail payload.
 */
export async function getClubEditData(
  userId: number,
  clubId: number,
): Promise<MasaiverseV2ClubEditData> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(clubId)) throw new ApiError(404, 'CLUB_NOT_FOUND')

  const rows = await db
    .select({ id: clubs.id, name: clubs.name, meta: clubs.meta })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1)
  const row = rows.at(0)
  if (!row) throw new ApiError(404, 'CLUB_NOT_FOUND')

  return {
    id: String(row.id),
    name: row.name,
    meta: (row.meta ?? {}) as Record<string, unknown>,
  }
}
