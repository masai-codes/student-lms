import { eq } from 'drizzle-orm'
import { getBannedContentCutoff } from './bannedContent'
import { db } from '@/db'
import { users } from '@/db/schema'

/**
 * Loads a user's status and resolves their banned-content cutoff in one step.
 * Returns `null` when the user is not banned (or has no valid ban time),
 * meaning "no cutoff — show everything". Reusable across any feature that gates
 * content for banned users.
 */
export async function getBannedContentCutoffForUser(
  userId: number,
): Promise<Date | null> {
  const [user] = await db
    .select({ status: users.status, statusTime: users.statusTime })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return getBannedContentCutoff(user)
}
