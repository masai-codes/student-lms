import { db } from '@/db'
import { replies } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
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

  return { id: String(header.insertId) }
}
