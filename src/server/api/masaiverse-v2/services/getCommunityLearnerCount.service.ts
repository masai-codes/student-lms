import { countDistinct } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'

/**
 * Number of distinct learners in the community — i.e. unique users who are a
 * member of at least one club. A learner in several clubs is counted once.
 */
export async function getCommunityLearnerCount(): Promise<number> {
  const rows = await db
    .select({ count: countDistinct(clubMembers.userId) })
    .from(clubMembers)

  return rows.at(0)?.count ?? 0
}
