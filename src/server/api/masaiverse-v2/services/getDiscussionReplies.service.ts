import { and, asc, count, eq, inArray } from 'drizzle-orm'
import type { DiscussionVote } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { readBannedReplyIds } from '@/server/api/masaiverse-v2/services/discussionModeration'
import { db } from '@/db'
import { posts, replies, users, votes } from '@/db/schema'
import { parseMasaiverseEventDbTimestamp } from '@/lib/eventTimestamps'

export interface MasaiverseV2Reply {
  id: string
  authorName: string
  content: string
  /** Number of upvotes on the reply. */
  upvotes: number
  /** The signed-in user's vote on this reply, or null. */
  myVote: DiscussionVote | null
  /**
   * Whether an admin has banned this reply (tracked in `posts.meta`). Only ever
   * `true` for admins viewing in admin mode — banned replies are filtered out
   * for everyone else.
   */
  isBanned: boolean
  /** UTC ISO so the client can render relative time in IST. */
  createdAt: string | null
}

/**
 * Replies for a post, oldest first, with upvote counts and the user's vote.
 * Banned replies (ids tracked in `posts.meta.bannedReplyIds`) are filtered out
 * unless `canSeeBanned` is set (admins in admin mode), in which case they are
 * returned flagged as `isBanned` so the UI can mark them.
 */
export async function getDiscussionReplies(
  postId: number,
  userId: number,
  canSeeBanned = false,
): Promise<Array<MasaiverseV2Reply>> {
  const postRows = await db
    .select({ meta: posts.meta })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)
  const bannedReplyIds = new Set(readBannedReplyIds(postRows.at(0)?.meta))

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

  // Hide banned replies from students (and admins outside admin mode); admins in
  // admin mode keep them so they can review/unban.
  const visibleRows = canSeeBanned
    ? rows
    : rows.filter((row) => !bannedReplyIds.has(row.id))

  if (visibleRows.length === 0) return []

  const replyIds = visibleRows.map((row) => row.id)

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

  return visibleRows.map((row) => ({
    id: String(row.id),
    authorName: row.authorName,
    content: row.content ?? '',
    upvotes: upvotesByReply.get(row.id) ?? 0,
    myVote: myVoteByReply.get(row.id) ?? null,
    isBanned: bannedReplyIds.has(row.id),
    createdAt:
      parseMasaiverseEventDbTimestamp(row.createdAt)?.toISOString() ?? null,
  }))
}
