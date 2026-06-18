import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { masaiverseBanners } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'

/** Permanently removes a banner. Admin-only (403 otherwise). */
export async function deleteMasaiverseBanner(
  userId: number,
  bannerId: number,
): Promise<{ success: true }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(bannerId))
    throw new ApiError(400, 'INVALID_UPDATE_PAYLOAD')

  await db.delete(masaiverseBanners).where(eq(masaiverseBanners.id, bannerId))
  return { success: true }
}
