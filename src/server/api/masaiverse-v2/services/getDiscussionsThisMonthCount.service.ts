import { and, count, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { posts, replies } from '@/db/schema'
import { getCurrentMonthRangeIst, toMysqlUtc } from '@/lib/dateRanges'

/**
 * Community discussion activity in the current IST month. A "discussion" counts
 * both top-level posts and replies, since each is a contribution to the thread,
 * across both club and club-less (non-club) discussions. Month boundaries come
 * from {@link getCurrentMonthRangeIst} (1st → next month's 1st, IST).
 */
export async function getDiscussionsThisMonthCount(now: Date): Promise<number> {
  const { start, end } = getCurrentMonthRangeIst(now)
  const startUtc = toMysqlUtc(start)
  const endUtc = toMysqlUtc(end)

  const [postRows, replyRows] = await Promise.all([
    db
      .select({ count: count() })
      .from(posts)
      .where(and(gte(posts.createdAt, startUtc), lt(posts.createdAt, endUtc))),
    db
      .select({ count: count() })
      .from(replies)
      .where(
        and(gte(replies.createdAt, startUtc), lt(replies.createdAt, endUtc)),
      ),
  ])

  return (postRows.at(0)?.count ?? 0) + (replyRows.at(0)?.count ?? 0)
}
