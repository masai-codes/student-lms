import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'

function normalizeCount(result: unknown): number {
  let rows: Array<Record<string, unknown>> = []
  if (Array.isArray(result)) {
    const first = result[0]
    rows = Array.isArray(first)
      ? (first as Array<Record<string, unknown>>)
      : (result as Array<Record<string, unknown>>)
  } else if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    rows = (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return Number(rows[0]?.total ?? 0)
}

export async function getAnnouncementUnreadCount(userId: number): Promise<number> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return 0

  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return 0

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')

  const result = await db.execute(sql`
    SELECT COUNT(*) AS total FROM (
      SELECT a.id
      FROM announcements a
      LEFT JOIN announcement_reads ar
        ON ar.announcement_id = a.id AND ar.user_id = ${userId}
      WHERE a.section_id IN (${sql.raw(sectionIdList)})
        AND a.deleted_at IS NULL
        AND a.track_read = 1
        AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))
        AND (ar.id IS NULL OR ar.is_unread = 1)

      UNION ALL

      SELECT m.id
      FROM messages m
      WHERE m.user_id = ${userId}
        AND m.message_id IS NULL
        AND m.deleted_at IS NULL
        AND m.read_at IS NULL
    ) combined
  `)

  return normalizeCount(result)
}
