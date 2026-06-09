import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'

function extractCount(result: unknown): number {
  let row: unknown
  if (Array.isArray(result)) {
    row = Array.isArray(result[0]) ? result[0][0] : result[0]
  } else if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    row = (result as { rows: Array<unknown> }).rows[0]
  }
  if (row && typeof row === 'object' && 'count' in row) {
    return Number((row as Record<string, unknown>).count) || 0
  }
  return 0
}

export async function getDashboardPendingTasksCount(userId: number): Promise<number> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return 0

  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return 0

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')

  const [assignmentResult, lectureResult] = await Promise.all([
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM assignments a
      WHERE a.section_id IN (${sql.raw(sectionIdList)})
        AND a.deleted_at IS NULL
        AND a.concludes > CONVERT_TZ(NOW(), '+00:00', '+05:30')
        AND NOT EXISTS (
          SELECT 1 FROM submissions s
          WHERE s.assignment_id = a.id
            AND s.user_id       = ${userId}
            AND s.deleted_at    IS NULL
            AND (
              s.started = 1
              OR JSON_EXTRACT(s.data, '$.assess_platform_link_clicked') IS NOT NULL
            )
        )
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM lectures l
      INNER JOIN student_attendances sa ON sa.lecture_id = l.id
                                       AND sa.user_id    = ${userId}
      WHERE l.section_id IN (${sql.raw(sectionIdList)})
        AND l.deleted_at     IS NULL
        AND l.optional       = 0
        AND sa.status        = 0
        AND sa.catch_up_days IS NOT NULL
        AND l.concludes      < CONVERT_TZ(NOW(), '+00:00', '+05:30')
        AND DATE_ADD(l.concludes, INTERVAL sa.catch_up_days DAY) > CONVERT_TZ(NOW(), '+00:00', '+05:30')
    `),
  ])

  return extractCount(assignmentResult) + extractCount(lectureResult)
}
