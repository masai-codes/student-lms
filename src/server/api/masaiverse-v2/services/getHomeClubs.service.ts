import { asc, count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers, clubs, users } from '@/db/schema'

/** How many member names we surface per club for the avatar stack. */
const SAMPLE_MEMBERS_PER_CLUB = 3

export interface MasaiverseV2HomeClub {
  id: string
  name: string
  /** `clubs.meta.cardImageLink` — club card image; null when none. */
  imageUrl: string | null
  /** `clubs.meta.belowTitleCardText` — short text shown below the title. */
  belowTitleCardText: string | null
  /** `clubs.meta.cardDescription` — longer blurb shown in the card body. */
  cardDescription: string | null
  /** Live count of rows in `club_members` for this club. */
  memberCount: number
  /** A few member display names, used to render the avatar stack. */
  sampleMemberNames: Array<string>
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Section 4 — all clubs with their live member count and a few member names
 * for the avatar stack. Newest clubs first.
 *
 * The member sample scans `club_members` joined to `users` and buckets the
 * first few names per club in memory (same full-scan cost as the existing
 * member-count query). If membership grows large this is the spot to switch to
 * a per-club windowed query.
 */
export async function getHomeClubs(): Promise<Array<MasaiverseV2HomeClub>> {
  const clubRows = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      meta: clubs.meta,
    })
    .from(clubs)
    .orderBy(desc(clubs.createdAt))

  if (clubRows.length === 0) return []

  const countRows = await db
    .select({ clubId: clubMembers.clubId, memberCount: count() })
    .from(clubMembers)
    .groupBy(clubMembers.clubId)
  const countByClub = new Map(
    countRows.map((row) => [row.clubId, row.memberCount]),
  )

  const memberRows = await db
    .select({ clubId: clubMembers.clubId, name: users.name })
    .from(clubMembers)
    .innerJoin(users, eq(users.id, clubMembers.userId))
    .orderBy(asc(clubMembers.clubId), asc(clubMembers.joinedAt))

  const namesByClub = new Map<number, Array<string>>()
  for (const row of memberRows) {
    const list = namesByClub.get(row.clubId) ?? []
    if (list.length < SAMPLE_MEMBERS_PER_CLUB) {
      list.push(row.name)
      namesByClub.set(row.clubId, list)
    }
  }

  return clubRows.map((club) => ({
    id: String(club.id),
    name: club.name,
    imageUrl: toStringOrNull(club.meta?.cardImageLink),
    belowTitleCardText: toStringOrNull(club.meta?.belowTitleCardText),
    cardDescription: toStringOrNull(club.meta?.cardDescription),
    memberCount: countByClub.get(club.id) ?? 0,
    sampleMemberNames: namesByClub.get(club.id) ?? [],
  }))
}
