import { and, eq, isNull, ne } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import type { LectureAssociatedListItem } from '@/server/learn/lectureAssociatedTypes'
import {
  isAssignmentLinkedToLecture,
  readAssociatedLectureId,
} from '@/server/learn/utils/parseLectureDataJson'
import { formatSqlDate } from '@/utils/generics'

function formatScheduleLabel(schedule: string | null): string | null {
  if (schedule == null || schedule.trim() === '') return null
  return formatSqlDate(schedule)
}

function readAssociatedLectureIdFromRow(data: unknown): number | null {
  return readAssociatedLectureId(data)
}

export async function getLectureAssociatedContent(input: {
  lectureId: number
  sectionId: number | null
  lectureData: unknown
}): Promise<Array<LectureAssociatedListItem>> {
  const items: Array<LectureAssociatedListItem> = []

  const forwardId = readAssociatedLectureIdFromRow(input.lectureData)
  if (forwardId != null && forwardId !== input.lectureId) {
    const linked = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        schedule: lectures.schedule,
      })
      .from(lectures)
      .where(and(eq(lectures.id, forwardId), isNull(lectures.deletedAt)))
      .limit(1)

    const row = linked[0]
    if (row) {
      items.push({
        id: row.id,
        kind: 'lecture',
        title: row.title,
        meta: formatScheduleLabel(row.schedule),
      })
    }
  }

  if (input.sectionId != null) {
    const sectionLectures = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        schedule: lectures.schedule,
        data: lectures.data,
      })
      .from(lectures)
      .where(
        and(
          eq(lectures.sectionId, input.sectionId),
          isNull(lectures.deletedAt),
          ne(lectures.id, input.lectureId),
        ),
      )

    for (const row of sectionLectures) {
      const pointsHere = readAssociatedLectureIdFromRow(row.data)
      if (pointsHere !== input.lectureId) continue
      items.push({
        id: row.id,
        kind: 'lecture',
        title: row.title,
        meta: formatScheduleLabel(row.schedule),
      })
    }

    const sectionAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        schedule: assignments.schedule,
        data: assignments.data,
      })
      .from(assignments)
      .where(
        and(eq(assignments.sectionId, input.sectionId), isNull(assignments.deletedAt)),
      )

    for (const row of sectionAssignments) {
      if (!isAssignmentLinkedToLecture(row.data, input.lectureId)) continue
      items.push({
        id: row.id,
        kind: 'assignment',
        title: row.title,
        meta: formatScheduleLabel(row.schedule),
      })
    }
  }

  const seen = new Set<string>()
  return items.filter(item => {
    const key = `${item.kind}-${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

