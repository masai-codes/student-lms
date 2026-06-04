import { and, asc, count, eq, inArray } from 'drizzle-orm'
import type { DiscussionVote } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { db } from '@/db'
import { replies, users, votes } from '@/db/schema'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

export interface MasaiverseV2Reply {
  id: string
  authorName: string
  content: string
  /** Number of upvotes on the reply. */
  upvotes: number
  /** The signed-in user's vote on this reply, or null. */
  myVote: DiscussionVote | null
  /** UTC ISO so the client can render relative time in IST. */
  createdAt: string | null
}

/** Replies for a post, oldest first, with upvote counts and the user's vote. */
export async function getDiscussionReplies(
  postId: number,
  userId: number,
): Promise<Array<MasaiverseV2Reply>> {
  const rows = await db
    .select({
      id: replies.id,
      content: replies.content,
      createdAt: replies.createdAt,
      authorName: users.name,
    })
    .from(replies)
    .innerJoin(users, eq(users.id, replies.userId))
    .where(eq(replies.postId, postId))
    .orderBy(asc(replies.createdAt))

  if (rows.length === 0) return []

  const replyIds = rows.map((row) => row.id)

  const upvoteRows = await db
    .select({ replyId: votes.replyId, total: count() })
    .from(votes)
    .where(and(inArray(votes.replyId, replyIds), eq(votes.vote, 'upvote')))
    .groupBy(votes.replyId)
  const upvotesByReply = new Map(
    upvoteRows.map((row) => [row.replyId, row.total]),
  )

  const myVoteRows = await db
    .select({ replyId: votes.replyId, vote: votes.vote })
    .from(votes)
    .where(and(eq(votes.userId, userId), inArray(votes.replyId, replyIds)))
  const myVoteByReply = new Map(
    myVoteRows.map((row) => [row.replyId, row.vote]),
  )

  return rows.map((row) => ({
    id: String(row.id),
    authorName: row.authorName,
    content: row.content ?? '',
    upvotes: upvotesByReply.get(row.id) ?? 0,
    myVote: myVoteByReply.get(row.id) ?? null,
    createdAt: parseMasaiverseEventDbTimestamp(row.createdAt)?.toISOString() ?? null,
  }))
}
