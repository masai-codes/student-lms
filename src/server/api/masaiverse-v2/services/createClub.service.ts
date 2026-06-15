import { db } from '@/db'
import { clubs } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  LAST_EDITED_AT_META_KEY,
  LAST_EDITED_BY_META_KEY,
  PUBLISHED_META_KEY,
} from '@/server/api/masaiverse-v2/services/publishVisibility'
import { toMysqlUtc } from '@/lib/dateRanges'

/**
 * Creates a brand-new club as an unpublished (draft) row owned by `userId`,
 * pre-filled with placeholder data the admin can edit later. Rejects non-admins
 * with a 403 — creating clubs is an admin-only capability.
 *
 * The draft is created with `meta.isPublished = false`, so it is visible only to
 * admins in admin mode until they publish it.
 */
export async function createMasaiverseClub(
  userId: number,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const state = await getAdminModeState(userId)
  if (!state.isAdmin) {
    throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  }

  const seed = now.getTime()
  const nowUtc = toMysqlUtc(now)
  const gallery = Array.from(
    { length: 4 },
    (_unused, index) => `https://picsum.photos/seed/club-${seed}-${index}/800/600`,
  )

  const meta = {
    description: 'Club description goes here. Edit this draft before publishing.',
    cardImageLink: `https://picsum.photos/seed/club-${seed}/600/400`,
    galleryImages: gallery,
    projectsBuild: 0,
    cardDescription: 'card description',
    aboutCardDetails: [
      { heading: 'Founded', value: '2026' },
      { heading: 'Focus', value: 'Learning in public' },
    ],
    belowTitleCardText: 'Below title',
    detail_description:
      'Tell members what this club is about. Edit this draft before publishing.',
    learningTenureData: [
      { tags: ['12 sessions'], text: 'Text 1', emoji: '⚡', heading: 'Heading 1' },
      { tags: ['2 sessions'], text: 'Text 2', emoji: '🌐', heading: 'Heading 2' },
    ],
    clubDetailBannerTags: ['tag1', 'tag2', 'tag3'],
    confirmationModalText:
      'By joining you agree to the club <b>code of conduct</b>.',
    learningTenureDateText: '20-26 June',
    [PUBLISHED_META_KEY]: false,
    [LAST_EDITED_BY_META_KEY]: userId,
    [LAST_EDITED_AT_META_KEY]: now.toISOString(),
  }

  const [header] = await db.insert(clubs).values({
    name: 'New Club (Draft)',
    domain: 'general',
    image: `https://picsum.photos/seed/club-${seed}/600/400`,
    meta,
    createdBy: userId,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  return { id: String(header.insertId) }
}
