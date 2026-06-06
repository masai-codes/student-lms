import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

/**
 * Marks `users.meta.isMasaiverseVisitedOnce` as true the first time a user
 * opens any Masaiverse page.
 *
 * Reads the current `meta` blob and merges the flag back in so sibling keys are
 * preserved. The early returns keep it idempotent — once the flag is set (or
 * the user is missing) repeat visits skip the write entirely.
 */
export async function markMasaiverseVisited(userId: number): Promise<void> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existing = rows.at(0)
  if (!existing) return

  const meta = (existing.meta ?? {}) as Record<string, unknown>
  if (meta.isMasaiverseVisitedOnce === true) return

  await db
    .update(users)
    .set({ meta: { ...meta, isMasaiverseVisitedOnce: true } })
    .where(eq(users.id, userId))
}
