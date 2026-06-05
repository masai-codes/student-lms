import { and, count, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { posts, replies } from '@/db/schema'
import { getCurrentWeekRangeIst, toMysqlUtc } from '@/lib/dateRanges'

/**
 * Community discussion activity in the current IST week. A "discussion" counts
 * both top-level posts and replies, since each is a contribution to the thread.
 * Week boundaries come from {@link getCurrentWeekRangeIst} (Mon → next Mon, IST).
 */
export async function getDiscussionsThisWeekCount(now: Date): Promise<number> {
  const { start, end } = getCurrentWeekRangeIst(now)
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
