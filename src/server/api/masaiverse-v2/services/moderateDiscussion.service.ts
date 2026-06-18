import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { toMysqlUtc } from '@/lib/dateRanges'
import { ApiError } from '@/server/api/http/apiError'
import { getAdminModeState } from '@/server/api/masaiverse-v2/services/adminMode.service'
import {
  BANNED_REPLY_IDS_META_KEY,
  nextBannedReplyIds,
  readBannedReplyIds,
} from '@/server/api/masaiverse-v2/services/discussionModeration'

/** Result of a ban/unban action, echoing the new state back to the client. */
export type DiscussionBanState = {
  /** 'post' or 'reply'. */
  target: 'post' | 'reply'
  /** The post id, or the reply's parent post id. */
  postId: string
  /** The reply id (only set when `target === 'reply'`). */
  replyId: string | null
  /** The resulting banned state. */
  isBanned: boolean
}

/**
 * Bans or unbans a post. Admin-only (403 otherwise). A banned post stays in the
 * DB but is hidden from everyone except admins in admin mode; `banned_by` /
 * `banned_date` are stamped on ban and cleared on unban.
 */
export async function setPostBanned(
  adminUserId: number,
  postId: number,
  banned: boolean,
): Promise<DiscussionBanState> {
  const state = await getAdminModeState(adminUserId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(postId)) throw new ApiError(400, 'INVALID_POST_ID')

  const existing = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)
  if (existing.length === 0) throw new ApiError(404, 'POST_NOT_FOUND')

  await db
    .update(posts)
    .set({
      isBanned: banned ? 1 : 0,
      bannedBy: banned ? adminUserId : null,
      bannedDate: banned ? toMysqlUtc(new Date()) : null,
    })
    .where(eq(posts.id, postId))

  return {
    target: 'post',
    postId: String(postId),
    replyId: null,
    isBanned: banned,
  }
}

/**
 * Bans or unbans a reply. Admin-only (403 otherwise). Replies have no
 * `is_banned` column, so the banned reply ids are tracked on the parent post's
 * `meta.bannedReplyIds`; a banned reply stays in the DB but is hidden from
 * everyone except admins in admin mode.
 */
export async function setReplyBanned(
  adminUserId: number,
  postId: number,
  replyId: number,
  banned: boolean,
): Promise<DiscussionBanState> {
  const state = await getAdminModeState(adminUserId)
  if (!state.isAdmin) throw new ApiError(403, 'MASAIVERSE_ADMIN_FORBIDDEN')
  if (!Number.isFinite(postId)) throw new ApiError(400, 'INVALID_POST_ID')
  if (!Number.isFinite(replyId)) throw new ApiError(400, 'INVALID_REPLY_ID')

  const rows = await db
    .select({ meta: posts.meta })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)
  if (rows.length === 0) throw new ApiError(404, 'POST_NOT_FOUND')

  const meta = (rows[0].meta ?? {}) as Record<string, unknown>
  const updated = nextBannedReplyIds(readBannedReplyIds(meta), replyId, banned)

  await db
    .update(posts)
    .set({ meta: { ...meta, [BANNED_REPLY_IDS_META_KEY]: updated } })
    .where(eq(posts.id, postId))

  return {
    target: 'reply',
    postId: String(postId),
    replyId: String(replyId),
    isBanned: banned,
  }
}
