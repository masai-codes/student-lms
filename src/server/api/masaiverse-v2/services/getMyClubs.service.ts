import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers, clubs } from '@/db/schema'

export interface MasaiverseV2SidebarClub {
  id: string
  name: string
  /** `clubs.meta.cardImageLink` (falls back to `clubs.image`); null when none. */
  imageUrl: string | null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Clubs the given user has joined, used to render the persistent sidebar
 * "My Clubs" list. Ordered by when they joined (earliest first) so the list is
 * stable across navigations.
 */
export async function getMyClubs(
  userId: number,
): Promise<Array<MasaiverseV2SidebarClub>> {
  const rows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      image: clubs.image,
      meta: clubs.meta,
    })
    .from(clubMembers)
    .innerJoin(clubs, eq(clubs.id, clubMembers.clubId))
    .where(eq(clubMembers.userId, userId))
    .orderBy(asc(clubMembers.joinedAt))

  return rows.map((club) => ({
    id: String(club.id),
    name: club.name,
    imageUrl: toStringOrNull(club.meta?.cardImageLink) ?? toStringOrNull(club.image),
  }))
}
