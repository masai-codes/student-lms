/**
 * Shared helpers for discussion moderation (banning posts and replies).
 *
 * Posts carry their own `is_banned` column, but replies do not — to avoid adding
 * a column to the `replies` table, the ids of an admin-banned reply are stored on
 * the parent post under `posts.meta.bannedReplyIds`.
 */

/** The `posts.meta` key holding the ids of replies banned on that post. */
export const BANNED_REPLY_IDS_META_KEY = 'bannedReplyIds'

/**
 * Reads the banned reply ids out of a post's `meta` JSON, tolerating a missing
 * key, a non-array value, or stray non-numeric entries. Always returns a clean
 * array of finite numbers.
 */
export function readBannedReplyIds(meta: unknown): Array<number> {
  const value = (meta as Record<string, unknown> | null | undefined)?.[
    BANNED_REPLY_IDS_META_KEY
  ]
  if (!Array.isArray(value)) return []
  return value.map((id) => Number(id)).filter((id) => Number.isFinite(id))
}

/**
 * Returns the next `bannedReplyIds` array after banning/unbanning `replyId`,
 * keeping the list de-duplicated. Returns the same logical set (order aside)
 * when the change is a no-op.
 */
export function nextBannedReplyIds(
  current: Array<number>,
  replyId: number,
  banned: boolean,
): Array<number> {
  const set = new Set(current)
  if (banned) set.add(replyId)
  else set.delete(replyId)
  return Array.from(set)
}
