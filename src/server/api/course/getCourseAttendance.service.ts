import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import { getSectionIdsForUserInBatch } from '@/server/batches/getSectionIdsForUserInBatch'

export interface CourseAttendanceGroup {
  label: string
  rules: string
  attendancePercentage: number
}

export interface CourseAttendanceData {
  groups: CourseAttendanceGroup[]
}

function normalizeRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as T[]
    return result as T[]
  }
  if (result && typeof result === 'object' && 'rows' in result) {
    return (result as { rows: T[] }).rows
  }
  return []
}

async function computeAttendanceForSections(
  userId: number,
  batchId: number,
  sectionIds: number[],
): Promise<number> {
  if (sectionIds.length === 0) return 0

  const idList = sectionIds.join(', ')

  const lectureRows = normalizeRows<{ id: number | string }>(
    await db.execute(sql`
      SELECT l.id
      FROM lectures l
      WHERE l.batch_id = ${batchId}
        AND l.section_id IN (${sql.raw(idList)})
        AND l.optional = 0
        AND l.deleted_at IS NULL
        AND EXISTS (SELECT 1 FROM meetings m WHERE m.lecture_id = l.id)
    `),
  )

  const total = lectureRows.length
  if (total === 0) return 0

  const lectureIdList = lectureRows
    .map((r) => Number(r.id))
    .filter(Number.isFinite)
    .join(', ')

  const attendanceRows = normalizeRows<{ attended: number | string }>(
    await db.execute(sql`
      SELECT SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS attended
      FROM student_attendances
      WHERE user_id = ${userId}
        AND batch_id = ${batchId}
        AND lecture_id IN (${sql.raw(lectureIdList)})
    `),
  )

  const attended = Number(attendanceRows[0]?.attended ?? 0)
  return Math.round((attended / total) * 10000) / 100
}

export async function getCourseAttendance(
  batchId: number,
  userId: number,
): Promise<CourseAttendanceData> {
  const [batchRow] = await db
    .select({ settings: batches.settings })
    .from(batches)
    .where(and(eq(batches.id, batchId), isNull(batches.deletedAt)))
    .limit(1)

  const settings = (batchRow?.settings ?? {}) as Record<string, unknown>
  const attendanceDetails = Array.isArray(settings.attendanceDetails)
    ? (settings.attendanceDetails as Array<Record<string, unknown>>)
    : []

  const userSectionIds = await getSectionIdsForUserInBatch(userId, batchId)

  if (attendanceDetails.length > 0) {
    const groups = await Promise.all(
      attendanceDetails.map(async (group) => {
        const label =
          typeof group.title === 'string' ? group.title : 'Attendance'
        const rules = typeof group.rules === 'string' ? group.rules : ''

        // Group may specify which section IDs to count
        const groupSectionIds: number[] = Array.isArray(group.sections)
          ? (group.sections as unknown[]).map(Number).filter(Number.isFinite)
          : userSectionIds

        // Intersect with user's enrolled sections
        const relevantIds = groupSectionIds.filter((id) =>
          userSectionIds.includes(id),
        )

        const attendancePercentage = await computeAttendanceForSections(
          userId,
          batchId,
          relevantIds.length > 0 ? relevantIds : userSectionIds,
        )

        return { label, rules, attendancePercentage }
      }),
    )
    return { groups }
  }

  // Fallback: single group for all enrolled sections
  const attendancePercentage = await computeAttendanceForSections(
    userId,
    batchId,
    userSectionIds,
  )
  return { groups: [{ label: 'Attendance', rules: '', attendancePercentage }] }
}
