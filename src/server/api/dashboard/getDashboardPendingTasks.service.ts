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

type RawLectureCatchUpRow = {
  id: number | string | bigint
  title: string
  schedule: string | null
  concludes: string | null
  catchUpDeadline: string | null
  lectureType: string | null
  moduleName: string | null
  optional: number | string
  batchId: number | string | bigint
  batchName: string
}

function normalizeLectureCatchUpRows(result: unknown): Array<RawLectureCatchUpRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawLectureCatchUpRow>
    return result as Array<RawLectureCatchUpRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<RawLectureCatchUpRow> }).rows
  }
  return []
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
 * Pending Tasks tab items — assignments + mandatory lecture catch-ups.
 *
 * ASSIGNMENTS — pending when:
 *  1. Belongs to a section the user is actively enrolled in.
 *  2. Deadline (concludes) has not yet passed (IST).
 *  3. Student has NOT started it (no submission with started=1 or assess link clicked).
 *
 * LECTURE CATCH-UPS — pending when:
 *  1. Belongs to a section the user is actively enrolled in.
 *  2. Lecture is mandatory (optional = 0).
 *  3. Student is absent (student_attendances.status = 0).
 *  4. Catch-up window is still open:
 *       lectures.concludes < NOW() IST   (lecture already ended)
 *       AND DATE_ADD(lectures.concludes, INTERVAL catch_up_days DAY) > NOW() IST
 *
 * Both lists are merged, sorted by deadline ASC, capped at 5 total.
 */
export async function getDashboardPendingTasks(
  userId: number,
): Promise<Array<DashboardScheduleItem>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return []

  const sectionIds = await getSectionIdsForUserInBatches(userId, batchIds)
  if (sectionIds.length === 0) return []

  const sectionIdList = sectionIds.map(Number).filter(Number.isFinite).join(', ')
  const showBatchName = batchIds.length > 1

  // ── Assignments ────────────────────────────────────────────────────────────
  const assignmentResult = await db.execute(sql`
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
        SELECT 1 FROM submissions s
        WHERE s.assignment_id = a.id
          AND s.user_id       = ${userId}
          AND s.deleted_at    IS NULL
          AND (
            s.started = 1
            OR JSON_EXTRACT(s.data, '$.assess_platform_link_clicked') IS NOT NULL
          )
      )
    ORDER BY a.concludes ASC
  `)

  const assignments: Array<DashboardScheduleItem> = normalizeRows(assignmentResult).map(
    (row): DashboardScheduleItem => ({
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
    })
  )

  // ── Mandatory lecture catch-ups ────────────────────────────────────────────
  const lectureResult = await db.execute(sql`
    SELECT
      l.id,
      l.title,
      l.schedule,
      l.concludes,
      DATE_ADD(l.concludes, INTERVAL sa.catch_up_days DAY) AS catchUpDeadline,
      l.type    AS lectureType,
      l.module  AS moduleName,
      l.optional,
      b.id      AS batchId,
      b.name    AS batchName
    FROM lectures l
    INNER JOIN student_attendances sa ON sa.lecture_id = l.id
                                     AND sa.user_id    = ${userId}
    INNER JOIN batches b ON b.id = l.batch_id
    WHERE l.section_id IN (${sql.raw(sectionIdList)})
      AND l.deleted_at  IS NULL
      AND l.optional    = 0
      AND sa.status     = 0
      AND sa.catch_up_days IS NOT NULL
      AND l.concludes   < CONVERT_TZ(NOW(), '+00:00', '+05:30')
      AND DATE_ADD(l.concludes, INTERVAL sa.catch_up_days DAY) > CONVERT_TZ(NOW(), '+00:00', '+05:30')
    ORDER BY catchUpDeadline ASC
  `)

  const lectureCatchUps: Array<DashboardScheduleItem> = normalizeLectureCatchUpRows(lectureResult).map(
    (row): DashboardScheduleItem => ({
      id: Number(row.id),
      learningType: 'lecture',
      title: String(row.title ?? ''),
      schedule: row.schedule ?? null,
      // concludes = catch-up deadline so the UI can show the correct urgency
      concludes: row.catchUpDeadline ?? null,
      startDate: null,
      endDate: null,
      subType: null,
      lectureType: row.lectureType ? String(row.lectureType) : null,
      hasZoomLink: false,
      moduleName: row.moduleName ? String(row.moduleName) : null,
      optional: 0,
      batchName: showBatchName ? String(row.batchName ?? '') : null,
    })
  )

  // ── Merge, sort by deadline ASC, cap at 5 ─────────────────────────────────
  return [...assignments, ...lectureCatchUps]
    .sort((a, b) => {
      if (!a.concludes && !b.concludes) return 0
      if (!a.concludes) return 1
      if (!b.concludes) return -1
      return a.concludes.localeCompare(b.concludes)
    })
    .slice(0, 5)
}
