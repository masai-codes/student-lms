import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getBatchIdsForSections } from '@/server/batches/getBatchIdsForSections'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'
import { getPausedCutoff } from '@/server/restrictions/enrollmentRestrictionScope'
import { getUserBatchRestrictions } from '@/server/restrictions/getUserBatchRestrictions'

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

  // Cancelled batches are already excluded (batchIds omit them). Exclude paused
  // batches' announcements scheduled after their cutoff.
  const restrictions = await getUserBatchRestrictions(userId)
  let pausedClause: SQL = sql``
  if (restrictions.size > 0) {
    const sectionToBatch = await getBatchIdsForSections(sectionIds.map(Number))
    const pausedGroups = new Map<number, Array<number>>()
    for (const [sid, batchId] of sectionToBatch) {
      if (getPausedCutoff(restrictions, batchId) != null) {
        const arr = pausedGroups.get(batchId) ?? []
        arr.push(sid)
        pausedGroups.set(batchId, arr)
      }
    }
    for (const [batchId, secs] of pausedGroups) {
      const cutoff = getPausedCutoff(restrictions, batchId)
      if (cutoff == null) continue
      pausedClause = sql`${pausedClause} AND NOT (a.section_id IN (${sql.raw(secs.join(', '))}) AND a.schedule > ${cutoff})`
    }
  }

  const result = await db.execute(sql`
    SELECT COUNT(*) AS total FROM (
      SELECT a.id
      FROM announcements a
      LEFT JOIN announcement_reads ar
        ON ar.announcement_id = a.id AND ar.user_id = ${userId}
      WHERE a.section_id IN (${sql.raw(sectionIdList)})
        AND a.deleted_at IS NULL
        AND a.track_read = 1
        AND (a.schedule IS NULL OR a.schedule <= CONVERT_TZ(NOW(), '+00:00', '+05:30'))${pausedClause}
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
