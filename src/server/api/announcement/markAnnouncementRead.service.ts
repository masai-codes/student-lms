import { sql } from 'drizzle-orm'
import { db } from '@/db'

const NOW_IST = sql`CONVERT_TZ(NOW(), '+00:00', '+05:30')`

/**
 * Marks an announcement as read for the user.
 * Upserts into announcement_reads: read_at = NOW IST, is_unread = false.
 * Always writes regardless of track_read value.
 */
export async function markAnnouncementAsRead(
  userId: number,
  announcementId: number,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO announcement_reads (announcement_id, user_id, read_at, is_unread, created_at, updated_at)
    VALUES (${announcementId}, ${userId}, ${NOW_IST}, 0, ${NOW_IST}, ${NOW_IST})
    ON DUPLICATE KEY UPDATE
      read_at    = ${NOW_IST},
      is_unread  = 0,
      updated_at = ${NOW_IST}
  `)
}

/**
 * Marks a message (and its entire thread) as read for the user.
 * Updates read_at = NOW IST on all non-authored messages in the thread.
 */
export async function markMessageAsRead(
  userId: number,
  messageId: number,
): Promise<void> {
  await db.execute(sql`
    UPDATE messages
    SET read_at    = ${NOW_IST},
        updated_at = ${NOW_IST}
    WHERE (id = ${messageId} OR message_id = ${messageId})
      AND author_id  != ${userId}
      AND deleted_at IS NULL
  `)
}
