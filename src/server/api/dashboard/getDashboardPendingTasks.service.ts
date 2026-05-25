import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
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
 * Assignments that are:
 *  1. In a batch the user is enrolled in
 *  2. Not yet past their concludes deadline (concludes > NOW)
 *  3. Have no entry in the submissions table for this user
 *
 * Sorted by concludes ASC (soonest deadline first).
 */
export async function getDashboardPendingTasks(
  userId: number,
): Promise<Array<DashboardScheduleItem>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  if (batchIds.length === 0) return []

  const batchIdList = batchIds.map(Number).filter(Number.isFinite).join(', ')
  const showBatchName = batchIds.length > 1

  const result = await db.execute(sql`
    SELECT
      a.id,
      a.title,
      a.schedule,
      a.concludes,
      a.category AS subType,
      a.module   AS moduleName,
      a.optional,
      b.id       AS batchId,
      b.name     AS batchName
    FROM assignments a
    INNER JOIN batches b ON b.id = a.batch_id
    WHERE a.batch_id IN (${sql.raw(batchIdList)})
      AND a.concludes > NOW()
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM submissions s
        WHERE s.assignment_id = a.id
          AND s.user_id       = ${userId}
          AND s.deleted_at    IS NULL
      )
    ORDER BY a.concludes ASC
  `)

  return normalizeRows(result).map((row): DashboardScheduleItem => ({
    id: Number(row.id),
    learningType: 'assignment',
    title: String(row.title ?? ''),
    schedule: row.schedule ?? null,
    concludes: row.concludes ?? null,
    subType: row.subType ? String(row.subType) : null,
    moduleName: row.moduleName ? String(row.moduleName) : null,
    optional: Number(row.optional) === 1 ? 1 : 0,
    batchName: showBatchName ? String(row.batchName ?? '') : null,
  }))
}
