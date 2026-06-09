import { sql } from 'drizzle-orm'
import { db } from '@/db'

const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

/**
 * Marks an announcement as unread for the user.
 * Skipped entirely if announcements.track_read = false.
 * Upserts into announcement_reads: is_unread = true, read_at = NULL.
 */
export async function markAnnouncementAsUnread(
  userId: number,
  announcementId: number,
): Promise<{ skipped: boolean }> {
  // Respect track_read guard
  const result = await db.execute(sql`
    SELECT track_read FROM announcements WHERE id = ${announcementId} AND deleted_at IS NULL LIMIT 1
  `)

  const rows = Array.isArray(result)
    ? (Array.isArray(result[0]) ? result[0] : result) as Array<Record<string, unknown>>
    : (result as { rows: Array<Record<string, unknown>> }).rows ?? []

  const trackRead = rows[0]?.track_read
  if (!trackRead || Number(trackRead) === 0) return { skipped: true }

  await db.execute(sql`
    INSERT INTO announcement_reads (announcement_id, user_id, read_at, is_unread, created_at, updated_at)
    VALUES (${announcementId}, ${userId}, NULL, 1, ${NOW_IST}, ${NOW_IST})
    ON DUPLICATE KEY UPDATE
      is_unread  = 1,
      read_at    = NULL,
      updated_at = ${NOW_IST}
  `)

  return { skipped: false }
}

/**
 * Marks a message thread as unread.
 * Sets read_at = NULL and meta.markAsUnread = true for all messages in the thread.
 */
export async function markMessageAsUnread(
  _userId: number,
  messageId: number,
): Promise<void> {
  await db.execute(sql`
    UPDATE messages
    SET read_at    = NULL,
        meta       = JSON_SET(COALESCE(meta, '{}'), '$.markAsUnread', TRUE),
        updated_at = ${NOW_IST}
    WHERE (id = ${messageId} OR message_id = ${messageId})
      AND deleted_at IS NULL
  `)
}
