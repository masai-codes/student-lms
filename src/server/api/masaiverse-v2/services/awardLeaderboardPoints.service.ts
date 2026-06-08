import { and, eq, inArray } from 'drizzle-orm'
import { LEADERBOARD_POINTS, LeaderboardReason } from './leaderboardPoints'
import { db } from '@/db'
import { masaiverseLeaderboard, posts, replies } from '@/db/schema'

/** A single row to write to `masaiverse_leaderboard`. */
interface PointsAward {
  /** User who receives the points. */
  recipientId: number
  /** User whose action caused the points. */
  actorId: number
  reason: LeaderboardReason
  /** Set only when the post/event belongs to a club; null otherwise. */
  clubId: number | null
  postId?: number | null
  replyId?: number | null
}

/** Inserts the awards in one statement. A no-op for an empty list. */
async function insertAwards(awards: Array<PointsAward>): Promise<void> {
  if (awards.length === 0) return
  await db.insert(masaiverseLeaderboard).values(
    awards.map((award) => ({
      userId: award.recipientId,
      createdBy: award.actorId,
      reason: award.reason,
      points: LEADERBOARD_POINTS[award.reason],
      clubId: award.clubId,
      postId: award.postId ?? null,
      replyId: award.replyId ?? null,
    })),
  )
}

/** Author + club of a post, or null when it no longer exists. */
async function getPostContext(
  postId: number,
): Promise<{ authorId: number; clubId: number | null } | null> {
  const row = (
    await db
      .select({ authorId: posts.userId, clubId: posts.clubId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
  ).at(0)
  return row ? { authorId: row.authorId, clubId: row.clubId ?? null } : null
}

/** Awards post-creation points to the author. Club id rides along when set. */
export async function awardPostCreationPoints(input: {
  authorId: number
  postId: number
  clubId: number | null
}): Promise<void> {
  await insertAwards([
    {
      recipientId: input.authorId,
      actorId: input.authorId,
      reason: LeaderboardReason.POST_CREATION,
      clubId: input.clubId,
      postId: input.postId,
    },
  ])
}

/**
 * Awards points for a new reply: `reply_given` to the replier and (unless they
 * replied to their own post) `reply_received` to the post author. The club is
 * taken from the post the reply belongs to.
 */
export async function awardReplyPoints(input: {
  replierId: number
  postId: number
  replyId: number
}): Promise<void> {
  const post = await getPostContext(input.postId)
  if (!post) return

  const awards: Array<PointsAward> = [
    {
      recipientId: input.replierId,
      actorId: input.replierId,
      reason: LeaderboardReason.REPLY_GIVEN,
      clubId: post.clubId,
      postId: input.postId,
      replyId: input.replyId,
    },
  ]
  if (post.authorId !== input.replierId) {
    awards.push({
      recipientId: post.authorId,
      actorId: input.replierId,
      reason: LeaderboardReason.REPLY_RECEIVED,
      clubId: post.clubId,
      postId: input.postId,
      replyId: input.replyId,
    })
  }
  await insertAwards(awards)
}

export type VoteTarget = { postId: number } | { replyId: number }

/** The given/received reasons for an upvote on the given target type. */
function upvoteReasons(isReply: boolean): {
  given: LeaderboardReason
  received: LeaderboardReason
} {
  return isReply
    ? {
        given: LeaderboardReason.UPVOTE_GIVEN_ON_REPLY,
        received: LeaderboardReason.UPVOTE_RECEIVE_ON_REPLY,
      }
    : {
        given: LeaderboardReason.UPVOTE_GIVEN_ON_POST,
        received: LeaderboardReason.UPVOTE_RECEIVE_ON_POST,
      }
}

/** Resolves the upvoted target's owner and club for awarding. */
async function getVoteContext(
  target: VoteTarget,
): Promise<{
  ownerId: number
  clubId: number | null
  postId?: number
  replyId?: number
} | null> {
  if ('replyId' in target) {
    const reply = (
      await db
        .select({ ownerId: replies.userId, postId: replies.postId })
        .from(replies)
        .where(eq(replies.id, target.replyId))
        .limit(1)
    ).at(0)
    if (!reply) return null
    const post = await getPostContext(reply.postId)
    return {
      ownerId: reply.ownerId,
      clubId: post?.clubId ?? null,
      replyId: target.replyId,
    }
  }
  const post = await getPostContext(target.postId)
  if (!post) return null
  return { ownerId: post.authorId, clubId: post.clubId, postId: target.postId }
}

/**
 * Awards upvote points: `..._given` to the voter and (unless self-upvote)
 * `..._received` to the target owner.
 */
export async function awardUpvotePoints(input: {
  voterId: number
  target: VoteTarget
}): Promise<void> {
  const ctx = await getVoteContext(input.target)
  if (!ctx) return
  const { given, received } = upvoteReasons('replyId' in input.target)

  const awards: Array<PointsAward> = [
    {
      recipientId: input.voterId,
      actorId: input.voterId,
      reason: given,
      clubId: ctx.clubId,
      postId: ctx.postId ?? null,
      replyId: ctx.replyId ?? null,
    },
  ]
  if (ctx.ownerId !== input.voterId) {
    awards.push({
      recipientId: ctx.ownerId,
      actorId: input.voterId,
      reason: received,
      clubId: ctx.clubId,
      postId: ctx.postId ?? null,
      replyId: ctx.replyId ?? null,
    })
  }
  await insertAwards(awards)
}

/**
 * Removes the upvote points a voter earned/granted on a target, used when an
 * upvote is toggled off or switched to a downvote.
 */
export async function revokeUpvotePoints(input: {
  voterId: number
  target: VoteTarget
}): Promise<void> {
  const isReply = 'replyId' in input.target
  const { given, received } = upvoteReasons(isReply)
  const column = isReply
    ? masaiverseLeaderboard.replyId
    : masaiverseLeaderboard.postId
  const id =
    'replyId' in input.target ? input.target.replyId : input.target.postId

  await db
    .delete(masaiverseLeaderboard)
    .where(
      and(
        eq(masaiverseLeaderboard.createdBy, input.voterId),
        eq(column, id),
        inArray(masaiverseLeaderboard.reason, [given, received]),
      ),
    )
}
