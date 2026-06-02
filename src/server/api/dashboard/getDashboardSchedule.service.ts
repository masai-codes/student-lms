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
 * An event is included if its start_date OR end_date falls within the window
 * (mirrors the block-plan-events/all-events API logic from experience-api).
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

  // Rolling 7-day window: CURDATE() … CURDATE() + 6 days
  // An event qualifies when its start_date OR end_date falls in the window.
  const result = await db.execute(sql`
    SELECT
      l.id,
      CASE WHEN l.type = 'reading' THEN 'resource' ELSE 'lecture' END AS learningType,
      l.title,
      l.schedule,
      l.concludes,
      DATE_FORMAT(l.start_date, '%Y-%m-%d') AS startDate,
      DATE_FORMAT(l.end_date,   '%Y-%m-%d') AS endDate,
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
        l.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR l.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
      )

    UNION ALL

    SELECT
      a.id,
      'assignment'        AS learningType,
      a.title,
      a.schedule,
      a.concludes,
      DATE_FORMAT(a.start_date, '%Y-%m-%d') AS startDate,
      DATE_FORMAT(a.end_date,   '%Y-%m-%d') AS endDate,
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
        a.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR a.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
      )

    UNION ALL

    SELECT
      q.id,
      'quiz'              AS learningType,
      q.title,
      q.schedule,
      q.concludes,
      DATE_FORMAT(q.start_date, '%Y-%m-%d') AS startDate,
      DATE_FORMAT(q.end_date,   '%Y-%m-%d') AS endDate,
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
        q.start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        OR q.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
      )

    ORDER BY startDate ASC, schedule ASC, id ASC
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
