import { db } from '@/db'
import { replies } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { awardReplyPoints } from '@/server/api/masaiverse-v2/services/awardLeaderboardPoints.service'
import { toMysqlUtc } from '@/lib/dateRanges'

const REPLY_MAX = 5000

/** Adds a reply to a post on behalf of the user. */
export async function createDiscussionReply(
  userId: number,
  postId: number,
  content: string,
): Promise<{ id: string }> {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new ApiError(400, 'INVALID_POST_ID')
  }
  const text = content.trim()
  if (!text) {
    throw new ApiError(400, 'REPLY_CONTENT_REQUIRED')
  }
  if (text.length > REPLY_MAX) {
    throw new ApiError(400, 'REPLY_CONTENT_TOO_LONG')
  }

  const nowUtc = toMysqlUtc(new Date())
  const [header] = await db.insert(replies).values({
    postId,
    userId,
    content: text,
    createdAt: nowUtc,
    updatedAt: nowUtc,
  })

  // Awards `reply_given` to the replier and `reply_received` to the post author
  // (club inferred from the post). Self-replies skip the "received" award.
  await awardReplyPoints({
    replierId: userId,
    postId,
    replyId: Number(header.insertId),
  })

  return { id: String(header.insertId) }
}
