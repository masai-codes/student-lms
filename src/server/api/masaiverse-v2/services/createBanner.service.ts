import { db } from '@/db'
import { masaiverseBanners } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import { PUBLISHED_META_KEY } from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

/**
 * Creates a placeholder home banner as an unpublished draft owned by `userId`.
 * Admin-only (403 otherwise). The draft starts with `meta.isPublished = false`,
 * so it is visible only to admins in admin mode until they publish it.
 */
export async function createMasaiverseBanner(
  userId: number,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')

  const nowUtc = toMysqlUtc(now)
  const [header] = await db.insert(masaiverseBanners).values({
    title: 'New banner',
    description:
      'Banner description goes here. Edit this draft before publishing.',
    ctaText: '',
    ctaUrl: '',
    meta: { [PUBLISHED_META_KEY]: false },
    createdBy: userId,
    lastEditedBy: userId,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  return { id: String(header.insertId) }
}
