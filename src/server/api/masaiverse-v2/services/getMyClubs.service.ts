import { and, asc, desc, eq } from 'drizzle-orm'
import { publishedClubCondition } from './publishVisibility'
import { db } from '@/db'
import { clubMembers, clubs } from '@/db/schema'

export interface MasaiverseV2SidebarClub {
  id: string
  name: string
  /** `clubs.meta.cardImageLink` (falls back to `clubs.image`); null when none. */
  imageUrl: string | null
}

type ClubRow = {
  id: number
  name: string
  image: string | null
  meta: Record<string, unknown> | null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toSidebarClub(club: ClubRow): MasaiverseV2SidebarClub {
  return {
    id: String(club.id),
    name: club.name,
    imageUrl:
      toStringOrNull(club.meta?.cardImageLink) ?? toStringOrNull(club.image),
  }
}

/**
 * The clubs shown in the sidebar "My Clubs" list (and used to build the
 * discussions / leaderboard club tabs).
 *
 * Normally these are the clubs the given user has joined, earliest first. In
 * admin mode (`canSeeUnpublished`) it is instead a full view of *every* club
 * (published or draft), newest first, so the admin can navigate to and inspect
 * any club without joining it.
 */
export async function getMyClubs(
  userId: number,
  canSeeUnpublished = false,
): Promise<Array<MasaiverseV2SidebarClub>> {
  if (canSeeUnpublished) {
    const allClubs = await db
      .select({
        id: clubs.id,
        name: clubs.name,
        image: clubs.image,
        meta: clubs.meta,
      })
      .from(clubs)
      .orderBy(desc(clubs.createdAt))
    return allClubs.map(toSidebarClub)
  }

  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      image: clubs.image,
      meta: clubs.meta,
    })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(and(eq(clubMembers.userId, userId), publishedClubCondition(canSeeUnpublished)))
    .orderBy(asc(clubMembers.joinedAt))

  return rows.map(toSidebarClub)
}
