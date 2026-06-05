import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'

/**
 * The club ids the given user has joined. Used to scope event listings to a
 * member's visibility: public (club-less) events plus the events of clubs they
 * actually belong to. Returns an empty array when the user is in no clubs.
 */
export async function getMemberClubIds(
  userId: number,
): Promise<Array<number>> {
  const rows = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
  return rows.map((row) => row.clubId)
}
