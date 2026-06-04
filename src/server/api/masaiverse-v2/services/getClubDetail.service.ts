import { and, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers, clubs } from '@/db/schema'

export interface MasaiverseV2ClubDetail {
  id: string
  name: string
  /** `clubs.meta.cardImageLink` (falls back to `clubs.image`); null when none. */
  imageUrl: string | null
  /**
   * Banner subtitle shown under the title —
   * `clubs.meta.clubDetailBannerSubtitle`, falling back to
   * `clubs.meta.belowTitleCardText`. Null when neither is set.
   */
  bannerSubtitle: string | null
  /** `clubs.meta.clubDetailBannerTags` — arbitrary pills shown in the banner. */
  bannerTags: Array<string>
  /** Live count of rows in `club_members` for this club. */
  memberCount: number
  /** Whether the requesting user is a member of this club. */
  isJoined: boolean
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Coerces `meta.clubDetailBannerTags` into a clean list of non-empty strings. */
function toStringList(value: unknown): Array<string> {
  if (!Array.isArray(value)) return []
  return value
    .map((tag) => toStringOrNull(tag))
    .filter((tag): tag is string => tag !== null)
}

/**
 * Full detail for a single club's page. Returns `null` when no club matches the
 * id so the route can render a "not found" state. `memberCount` and `isJoined`
 * are derived live from `club_members`.
 */
export async function getClubDetail(
  clubId: number,
  userId: number,
): Promise<MasaiverseV2ClubDetail | null> {
  if (!Number.isFinite(clubId)) return null

  const club = (
    await db
      .select({
        id: clubs.id,
        name: clubs.name,
        image: clubs.image,
        meta: clubs.meta,
      })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1)
  ).at(0)

  if (!club) return null

  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(clubMembers)
    .where(eq(clubMembers.clubId, clubId))

  const membership = await db
    .select({ id: clubMembers.id })
    .from(clubMembers)
    .where(
      and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)),
    )
    .limit(1)

  return {
    id: String(club.id),
    name: club.name,
    imageUrl:
      toStringOrNull(club.meta?.cardImageLink) ?? toStringOrNull(club.image),
    bannerSubtitle:
      toStringOrNull(club.meta?.clubDetailBannerSubtitle) ??
      toStringOrNull(club.meta?.belowTitleCardText),
    bannerTags: toStringList(club.meta?.clubDetailBannerTags),
    memberCount,
    isJoined: membership.length > 0,
  }
}
