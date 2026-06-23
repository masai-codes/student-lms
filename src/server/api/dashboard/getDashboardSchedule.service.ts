import { sql } from 'drizzle-orm'
import type { DashboardScheduleItem } from '@/server/dashboard/getDashboardScheduleData'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getSectionIdsForUserInBatches } from '@/server/batches/getSectionIdsForUserInBatch'

type RawRow = {
  id: number | string | bigint
  learningType: string
  title: string
  schedule: string | null
  concludes: string | null
  startDate: string | null
  endDate: string | null
  subType: string | null
  moduleName: string | null
  optional: number | string
  batchId: number | string | bigint
  batchName: string
  lectureType: string | null
  zoomLink: string | null
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
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

function toLearningType(raw: string): DashboardScheduleItem['learningType'] {
  if (raw === 'resource') return 'resource'
  if (raw === 'assignment') return 'assignment'
  if (raw === 'quiz') return 'quiz'
  return 'lecture'
}

/**
 * Fetches the rolling 7-day schedule (today → today + 6) for all sections
 * the user is actively enrolled in.
 *
 * Combines lectures, assignments, and quizzes — each scoped by section_id.
 * An event is included when ANY of these hold:
 *   - schedule (IST date) falls within the window
 *   - concludes (IST date) falls within the window
 *   - event spans the ENTIRE window (schedule < today AND concludes > today+6)
 *     — these spanning items are excluded from My Schedule display and surfaced
 *       in the Pending Tasks tab instead (handled client-side by extractSpanningItems).
 *
 * Batch name is included on each card only when the user belongs to more
 * than one batch.
 */
export async function getDashboardSchedule(
  userId: number,
): Promise<Array<DashboardScheduleItem>> {
  // Resolve allowed batch IDs (iHub vs Masai portal allowlist)
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return []

  // Resolve section IDs for those batches
  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return []

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')
  const showBatchName = batchIds.length > 1

  // Rolling 7-day window: CURDATE() … CURDATE() + 6 days (all times in IST)
  // An event qualifies when its schedule OR concludes (IST date) falls in the window.
  const result = await db.execute(sql`
    SELECT
      l.id,
      CASE WHEN l.type = 'reading' THEN 'resource' ELSE 'lecture' END AS learningType,
      l.title,
      l.schedule,
      l.concludes,
      DATE(CONVERT_TZ(l.schedule,  '+00:00', '+05:30')) AS startDate,
      DATE(CONVERT_TZ(l.concludes, '+00:00', '+05:30')) AS endDate,
      l.category          AS subType,
      l.module            AS moduleName,
      l.optional,
      b.id                AS batchId,
      b.name              AS batchName,
      l.type              AS lectureType,
      l.zoom_link         AS zoomLink
    FROM lectures l
    INNER JOIN batches b ON b.id = l.batch_id
    WHERE l.section_id IN (${sql.raw(sectionIdList)})
      AND l.deleted_at IS NULL
      AND (
        DATE(CONVERT_TZ(l.schedule,  '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR DATE(CONVERT_TZ(l.concludes, '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR (DATE(CONVERT_TZ(l.schedule,  '+00:00', '+05:30')) < CURDATE() AND DATE(CONVERT_TZ(l.concludes, '+00:00', '+05:30')) > DATE_ADD(CURDATE(), INTERVAL 6 DAY))
      )

    UNION ALL

    SELECT
      a.id,
      'assignment'        AS learningType,
      a.title,
      a.schedule,
      a.concludes,
      DATE(CONVERT_TZ(a.schedule,  '+00:00', '+05:30')) AS startDate,
      DATE(CONVERT_TZ(a.concludes, '+00:00', '+05:30')) AS endDate,
      a.category          AS subType,
      a.module            AS moduleName,
      a.optional,
      b.id                AS batchId,
      b.name              AS batchName,
      NULL                AS lectureType,
      NULL                AS zoomLink
    FROM assignments a
    INNER JOIN batches b ON b.id = a.batch_id
    WHERE a.section_id IN (${sql.raw(sectionIdList)})
      AND a.deleted_at IS NULL
      AND (
        DATE(CONVERT_TZ(a.schedule,  '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR DATE(CONVERT_TZ(a.concludes, '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR (DATE(CONVERT_TZ(a.schedule,  '+00:00', '+05:30')) < CURDATE() AND DATE(CONVERT_TZ(a.concludes, '+00:00', '+05:30')) > DATE_ADD(CURDATE(), INTERVAL 6 DAY))
      )

    UNION ALL

    SELECT
      q.id,
      'quiz'              AS learningType,
      q.title,
      q.schedule,
      q.concludes,
      DATE(CONVERT_TZ(q.schedule,  '+00:00', '+05:30')) AS startDate,
      DATE(CONVERT_TZ(q.concludes, '+00:00', '+05:30')) AS endDate,
      q.category          AS subType,
      NULL                AS moduleName,
      q.optional,
      b.id                AS batchId,
      b.name              AS batchName,
      NULL                AS lectureType,
      NULL                AS zoomLink
    FROM quizzes q
    INNER JOIN batches b ON b.id = q.batch_id
    WHERE q.section_id IN (${sql.raw(sectionIdList)})
      AND q.deleted_at IS NULL
      AND (
        DATE(CONVERT_TZ(q.schedule,  '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR DATE(CONVERT_TZ(q.concludes, '+00:00', '+05:30')) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR (DATE(CONVERT_TZ(q.schedule,  '+00:00', '+05:30')) < CURDATE() AND DATE(CONVERT_TZ(q.concludes, '+00:00', '+05:30')) > DATE_ADD(CURDATE(), INTERVAL 6 DAY))
      )

    ORDER BY schedule ASC, id ASC
  `)

  return normalizeRows(result).map((row): DashboardScheduleItem => ({
    id: Number(row.id),
    learningType: toLearningType(row.learningType),
    title: String(row.title),
    schedule: row.schedule ?? null,
    concludes: row.concludes ?? null,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    subType: row.subType ? String(row.subType) : null,
    moduleName: row.moduleName ? String(row.moduleName) : null,
    optional: Number(row.optional) === 1 ? 1 : 0,
    batchName: showBatchName ? String(row.batchName) : null,
    lectureType: row.lectureType ? String(row.lectureType) : null,
    hasZoomLink: Boolean(row.zoomLink && String(row.zoomLink).trim().length > 0),
  }))
}
