import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import type { DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'

type RawScheduleRow = {
  id: number | string | bigint
  learningType: string
  title: string
  schedule: string | null
  concludes: string | null
  subType: string | null
  moduleName: string | null
  optional: number | string
  batchId: number | string | bigint
  batchName: string
}

function normalizeRows(result: unknown): Array<RawScheduleRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawScheduleRow>
    return result as Array<RawScheduleRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<RawScheduleRow> }).rows
  }
  return []
}

function toLearningType(raw: string): DashboardScheduleItem['learningType'] {
  if (raw === 'resource' || raw === 'assignment') return raw
  return 'lecture'
}

/**
 * Fetches the current week's schedule (Mon–Sun) for all batches the user
 * is enrolled in. Combines lectures and assignments, ordered by schedule ASC.
 *
 * Batch name is included on each card only when the user belongs to more
 * than one batch (matches the design: single-batch students don't see it).
 */
export async function getDashboardSchedule(
  userId: number,
): Promise<Array<DashboardScheduleItem>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  if (batchIds.length === 0) return []

  // batchIds are numbers from our own DB — safe to inline
  const batchIdList = batchIds.map(Number).filter(Number.isFinite).join(', ')
  const showBatchName = batchIds.length > 1

  const result = await db.execute(sql`
    SELECT
      l.id,
      CASE WHEN l.type = 'reading' THEN 'resource' ELSE 'lecture' END AS learningType,
      l.title,
      l.schedule,
      l.concludes,
      l.category AS subType,
      l.module   AS moduleName,
      l.optional,
      b.id       AS batchId,
      b.name     AS batchName
    FROM lectures l
    INNER JOIN batches b ON b.id = l.batch_id
    WHERE l.batch_id IN (${sql.raw(batchIdList)})
      AND l.deleted_at IS NULL
      AND DATE(l.schedule) BETWEEN
            DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)

    UNION ALL

    SELECT
      a.id,
      'assignment' AS learningType,
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
    WHERE a.batch_id IN (${sql.raw(batchIdList)})
      AND a.deleted_at IS NULL
      AND DATE(a.schedule) BETWEEN
            DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)

    ORDER BY schedule ASC, id ASC
  `)

  return normalizeRows(result).map((row): DashboardScheduleItem => ({
    id: Number(row.id),
    learningType: toLearningType(row.learningType),
    title: String(row.title ?? ''),
    schedule: row.schedule ?? null,
    concludes: row.concludes ?? null,
    subType: row.subType ? String(row.subType) : null,
    moduleName: row.moduleName ? String(row.moduleName) : null,
    optional: Number(row.optional) === 1 ? 1 : 0,
    batchName: showBatchName ? String(row.batchName ?? '') : null,
  }))
}
