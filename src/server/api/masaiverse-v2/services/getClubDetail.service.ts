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
  /** `clubs.meta.description` — the "About the Club" paragraph. */
  aboutDescription: string | null
  /**
   * `clubs.meta.aboutCardDetails` — labelled facts (Founded, Tenure, …) shown
   * in the About card grid. Entries missing a heading or value are dropped.
   */
  aboutDetails: Array<ClubAboutDetail>
  /** `clubs.meta.learningTenureDateText` — the week label, e.g. "20-26 June". */
  learningTenureDateText: string | null
  /**
   * `clubs.meta.learningTenureData` — the learning-tenure cards (emoji, heading,
   * text, tags). Entries without a heading are dropped.
   */
  learningTenure: Array<ClubLearningTenureItem>
  /** `clubs.meta.galleryImages` — club photo URLs (non-empty strings). */
  galleryImages: Array<string>
  /** Live count of rows in `club_members` for this club. */
  memberCount: number
  /** Whether the requesting user is a member of this club. */
  isJoined: boolean
}

export interface ClubAboutDetail {
  heading: string
  value: string
}

export interface ClubLearningTenureItem {
  emoji: string | null
  heading: string
  text: string | null
  tags: Array<string>
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
 * Coerces `meta.aboutCardDetails` into `{ heading, value }` rows, dropping any
 * entry that isn't an object with both a non-empty heading and value.
 */
function toAboutDetails(value: unknown): Array<ClubAboutDetail> {
  if (!Array.isArray(value)) return []
  return value
    .map((entry): ClubAboutDetail | null => {
      if (typeof entry !== 'object' || entry === null) return null
      const heading = toStringOrNull((entry as Record<string, unknown>).heading)
      const detail = toStringOrNull((entry as Record<string, unknown>).value)
      return heading && detail ? { heading, value: detail } : null
    })
    .filter((entry): entry is ClubAboutDetail => entry !== null)
}

/**
 * Coerces `meta.learningTenureData` into learning-tenure cards, dropping any
 * entry that isn't an object with a non-empty heading. Emoji/text fall back to
 * null and tags to a clean string list.
 */
function toLearningTenure(value: unknown): Array<ClubLearningTenureItem> {
  if (!Array.isArray(value)) return []
  return value
    .map((entry): ClubLearningTenureItem | null => {
      if (typeof entry !== 'object' || entry === null) return null
      const record = entry as Record<string, unknown>
      const heading = toStringOrNull(record.heading)
      if (!heading) return null
      return {
        emoji: toStringOrNull(record.emoji),
        heading,
        text: toStringOrNull(record.text),
        tags: toStringList(record.tags),
      }
    })
    .filter((entry): entry is ClubLearningTenureItem => entry !== null)
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
    aboutDescription: toStringOrNull(club.meta?.description),
    aboutDetails: toAboutDetails(club.meta?.aboutCardDetails),
    learningTenureDateText: toStringOrNull(club.meta?.learningTenureDateText),
    learningTenure: toLearningTenure(club.meta?.learningTenureData),
    galleryImages: toStringList(club.meta?.galleryImages),
    memberCount,
    isJoined: membership.length > 0,
  }
}
