import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'
import type { DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'

type RawRow = {
  id: number | string | bigint
  title: string
  schedule: string | null
  concludes: string | null
  subType: string | null
  moduleName: string | null
  optional: number | string
  batchId: number | string | bigint
  batchName: string
}

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

/**
 * Assignments that appear in the Pending Tasks tab.
 *
 * An assignment is pending when ALL of the following hold:
 *  1. It belongs to a section the user is actively enrolled in
 *     (section_user → sections → batches, iHub/Masai portal allowlist applied
 *      by getBatchIdsForEnrolledUser).
 *  2. Its deadline (concludes) has not yet passed — compared against server-
 *     side IST to avoid client-clock skew.
 *  3. The student has NOT started it: no submission row where
 *       started = 1  OR  data->>'$.assess_platform_link_clicked' IS NOT NULL
 *
 * Results are capped at 5, ordered soonest deadline first.
 */
export async function getDashboardPendingTasks(
  userId: number,
): Promise<Array<DashboardScheduleItem>> {
  // Step 1 + 3: resolve the user's allowed batch IDs (iHub vs Masai allowlist)
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return []

  // Step 2: resolve section IDs for those batches
  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return []

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')
  const showBatchName = batchIds.length > 1

  // Step 4: query assignments scoped to sections, deadline in IST, not started
  const result = await db.execute(sql`
    SELECT
      a.id,
      a.title,
      a.schedule,
      a.concludes,
      a.category  AS subType,
      a.module    AS moduleName,
      a.optional,
      b.id        AS batchId,
      b.name      AS batchName
    FROM assignments a
    INNER JOIN batches b ON b.id = a.batch_id
    WHERE a.section_id IN (${sql.raw(sectionIdList)})
      AND a.deleted_at IS NULL
      AND a.concludes > CONVERT_TZ(NOW(), '+00:00', '+05:30')
      AND NOT EXISTS (
        SELECT 1
        FROM submissions s
        WHERE s.assignment_id = a.id
          AND s.user_id       = ${userId}
          AND s.deleted_at    IS NULL
          AND (
            s.started = 1
            OR JSON_EXTRACT(s.data, '$.assess_platform_link_clicked') IS NOT NULL
          )
      )
    ORDER BY a.concludes ASC
    LIMIT 5
  `)

  return normalizeRows(result).map((row): DashboardScheduleItem => ({
    id: Number(row.id),
    learningType: 'assignment',
    title: String(row.title ?? ''),
    schedule: row.schedule ?? null,
    concludes: row.concludes ?? null,
    startDate: null,
    endDate: null,
    subType: row.subType ? String(row.subType) : null,
    lectureType: null,
    hasZoomLink: false,
    moduleName: row.moduleName ? String(row.moduleName) : null,
    optional: Number(row.optional) === 1 ? 1 : 0,
    batchName: showBatchName ? String(row.batchName ?? '') : null,
  }))
}
