import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

/**
 * Number of learners in the community — i.e. users who have opened Masaiverse
 * at least once, tracked by `users.meta.isMasaiverseVisitedOnce === true`.
 */
export async function getCommunityLearnerCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`cast(count(*) as unsigned)` })
    .from(users)
    .where(
      sql`JSON_EXTRACT(${users.meta}, '$.isMasaiverseVisitedOnce') = true`,
    )

  return rows.at(0)?.count ?? 0
}
