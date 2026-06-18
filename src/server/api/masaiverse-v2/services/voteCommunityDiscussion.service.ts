import { and, count, eq } from 'drizzle-orm'
import type { MySqlColumn } from 'drizzle-orm/mysql-core'
import type { VoteTarget } from '@/server/api/masaiverse-v2/services/awardLeaderboardPoints.service'
import { db } from '@/db'
import { votes } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import {
  awardUpvotePoints,
  revokeUpvotePoints,
} from '@/server/api/masaiverse-v2/services/awardLeaderboardPoints.service'

export type VoteValue = 'upvote' | 'downvote'

export interface DiscussionVoteState {
  /** Upvote count after the change (downvotes are never surfaced). */
  upvotes: number
  /** The signed-in user's current vote, or null if none. */
  myVote: VoteValue | null
}

/**
 * Toggles the user's vote on a post or reply (Reddit-style):
 * - no existing vote → add it
 * - same vote again → remove it
 * - opposite vote → switch it
 *
 * `votes.vote_target` is a generated column, so it is intentionally omitted.
 */
async function applyVote(
  userId: number,
  target: { postId: number } | { replyId: number },
  vote: string,
): Promise<DiscussionVoteState> {
  if (vote !== 'upvote' && vote !== 'downvote') {
    throw new ApiError(400, 'INVALID_VOTE')
  }

  const isReply = 'replyId' in target
  const id = isReply ? target.replyId : target.postId
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, isReply ? 'INVALID_REPLY_ID' : 'INVALID_POST_ID')
  }
  const column: MySqlColumn = isReply ? votes.replyId : votes.postId

  const existing = await db
    .select({ id: votes.id, vote: votes.vote })
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(column, id)))
    .limit(1)
  const current = existing.at(0)

  const pointsTarget: VoteTarget = isReply ? { replyId: id } : { postId: id }

  let myVote: VoteValue | null
  if (!current) {
    await db
      .insert(votes)
      .values(
        isReply ? { userId, replyId: id, vote } : { userId, postId: id, vote },
      )
    myVote = vote
    // Only upvotes score; a fresh downvote awards nothing.
    if (vote === 'upvote') {
      await awardUpvotePoints({ voterId: userId, target: pointsTarget })
    }
  } else if (current.vote === vote) {
    await db.delete(votes).where(eq(votes.id, current.id))
    myVote = null
    // Toggling an upvote off takes its points back.
    if (vote === 'upvote') {
      await revokeUpvotePoints({ voterId: userId, target: pointsTarget })
    }
  } else {
    await db.update(votes).set({ vote }).where(eq(votes.id, current.id))
    myVote = vote
    // Switching down→up awards; up→down revokes the prior upvote's points.
    if (vote === 'upvote') {
      await awardUpvotePoints({ voterId: userId, target: pointsTarget })
    } else {
      await revokeUpvotePoints({ voterId: userId, target: pointsTarget })
    }
  }

  const upvoteRows = await db
    .select({ total: count() })
    .from(votes)
    .where(and(eq(column, id), eq(votes.vote, 'upvote')))

  return { upvotes: upvoteRows.at(0)?.total ?? 0, myVote }
}

/** Toggles the user's vote on a post. */
export function voteCommunityDiscussion(
  userId: number,
  postId: number,
  vote: string,
): Promise<DiscussionVoteState> {
  return applyVote(userId, { postId }, vote)
}

/** Toggles the user's vote on a reply. */
export function voteDiscussionReply(
  userId: number,
  replyId: number,
  vote: string,
): Promise<DiscussionVoteState> {
  return applyVote(userId, { replyId }, vote)
}
