import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'

/**
 * Records that a member opened a club's detail page by stamping
 * `club_members.meta.lastVisitedAt` (ISO timestamp) for the (user, club) pair.
 *
 * Only members are tracked — when the user has no membership row the call is a
 * no-op, so non-members never write anything. Sibling meta keys are preserved
 * by reading the current blob and merging the timestamp back in.
 *
 * Returns `true` when a visit was recorded, `false` when skipped (invalid id or
 * not a member).
 */
export async function recordClubVisit(
  userId: number,
  clubId: number,
  now: Date = new Date(),
): Promise<boolean> {
  if (!Number.isFinite(clubId)) return false

  const rows = await db
    .select({ id: clubMembers.id, meta: clubMembers.meta })
    .from(clubMembers)
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)))
    .limit(1)

  const membership = rows.at(0)
  if (!membership) return false

  const meta = (membership.meta ?? {}) as Record<string, unknown>

  await db
    .update(clubMembers)
    .set({ meta: { ...meta, lastVisitedAt: now.toISOString() } })
    .where(eq(clubMembers.id, membership.id))

  return true
}
