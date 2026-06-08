import { and, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { ApiError } from '@/server/api/http/apiError'
import { clubMembers, clubs } from '@/db/schema'

export interface ClubMembershipState {
  isJoined: boolean
  memberCount: number
}

async function getMemberCount(clubId: number): Promise<number> {
  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(clubMembers)
    .where(eq(clubMembers.clubId, clubId))
  return memberCount
}

/**
 * Joins or leaves a club for the given user and returns the resulting
 * membership state plus the live member count. Joining is idempotent — a
 * duplicate insert is swallowed so repeated calls converge on "joined".
 */
export async function setClubMembership(
  userId: number,
  clubId: number,
  join: boolean,
  now: Date = new Date(),
): Promise<ClubMembershipState> {
  if (!Number.isFinite(clubId)) {
    throw new ApiError(400, 'INVALID_CLUB_ID')
  }

  const club = (
    await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1)
  ).at(0)
  if (!club) {
    throw new ApiError(404, 'CLUB_NOT_FOUND')
  }

  if (join) {
    // Stamp `lastVisitedAt` at join time so the new member is immediately
    // counted as "active" by the stats section — without it the count only
    // updates on the next page visit, which looks like a stale stat after
    // joining. The (user_id, club_id) unique index makes re-joining a no-op
    // that simply refreshes the timestamp.
    const meta = { lastVisitedAt: now.toISOString() }
    await db
      .insert(clubMembers)
      .values({ userId, clubId, meta })
      .onDuplicateKeyUpdate({ set: { meta } })
  } else {
    await db
      .delete(clubMembers)
      .where(
        and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)),
      )
  }

  return { isJoined: join, memberCount: await getMemberCount(clubId) }
}
