import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getDashboardAssignmentScore } from './getDashboardAssignmentScore.service'

export interface BatchAttendance {
  batchId: number
  attendancePercentage: number
  assignmentScore: number | null
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result as { rows: unknown }).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/**
 * Calculates overall attendance percentage + assignment score per enrolled batch.
 *
 * Attendance steps:
 * 1. Resolve enrolled section IDs (section_user, scoped to userId).
 * 2. Find valid countable lectures: non-optional, non-deleted, have a meeting.
 * 3. Denominator = count of valid lectures; numerator = present rows in student_attendances.
 * 4. Percentage = round((present / total) * 100, 2), or 0 if no lectures.
 *
 * Assignment score delegated to getDashboardAssignmentScore.service.ts.
 */
export async function getDashboardAttendance(userId: number): Promise<Array<BatchAttendance>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)
  if (batchIds.length === 0) return []

  const results: Array<BatchAttendance> = []

  for (const batchId of batchIds) {
    // Step 1: enrolled section IDs
    const sectionRows = normalizeRows<{ section_id: number | string }>(
      await db.execute(sql`
        SELECT section_id
        FROM section_user
        WHERE user_id = ${userId}
          AND deleted_at IS NULL
      `)
    )

    const sectionIds = sectionRows.map((r) => Number(r.section_id)).filter(Number.isFinite)
    if (sectionIds.length === 0) {
      results.push({ batchId, attendancePercentage: 0, assignmentScore: null })
      continue
    }

    const sectionIdList = sectionIds.join(', ')

    // Step 2: valid countable lecture IDs — this is the denominator
    const lectureRows = normalizeRows<{ id: number | string }>(
      await db.execute(sql`
        SELECT l.id
        FROM lectures l
        WHERE l.batch_id = ${batchId}
          AND l.section_id IN (${sql.raw(sectionIdList)})
          AND l.optional = 0
          AND l.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM meetings m WHERE m.lecture_id = l.id
          )
      `)
    )

    const lectureIds = lectureRows.map((r) => Number(r.id)).filter(Number.isFinite)
    const total = lectureIds.length
    if (total === 0) {
      results.push({ batchId, attendancePercentage: 0, assignmentScore: null })
      continue
    }

    const lectureIdList = lectureIds.join(', ')

    // Step 3: count present attendance rows for those lectures
    const attendanceRows = normalizeRows<{ attended: number | string }>(
      await db.execute(sql`
        SELECT SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS attended
        FROM student_attendances
        WHERE user_id    = ${userId}
          AND batch_id   = ${batchId}
          AND lecture_id IN (${sql.raw(lectureIdList)})
      `)
    )

    const attended = Number(attendanceRows[0]?.attended ?? 0)
    const attendancePercentage = Math.round((attended / total) * 10000) / 100

    // Step 4: assignment score (separate service)
    const assignmentScore = await getDashboardAssignmentScore(userId, batchId, sectionIds)

    results.push({ batchId, attendancePercentage, assignmentScore })
  }

  return results
}
