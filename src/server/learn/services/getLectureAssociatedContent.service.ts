import { and, eq, isNull, ne } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, lectures } from '@/db/schema'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import { dedupeLearnAssociatedItems } from '@/server/learn/utils/dedupeLearnAssociatedItems'
import {
  isAssignmentLinkedToLecture,
  readAssociatedLectureId,
} from '@/server/learn/utils/parseLectureDataJson'
import { resolveLearnAssociatedKindFromLectureType } from '@/server/learn/utils/resolveLearnAssociatedKind'
import { formatSqlDate } from '@/utils/generics'

function formatScheduleLabel(schedule: string | null): string | null {
  if (schedule == null || schedule.trim() === '') return null
  return formatSqlDate(schedule)
}

function toLectureItem(row: {
  id: number
  title: string
  schedule: string | null
  type: string
}): LearnAssociatedListItem {
  return {
    id: row.id,
    kind: resolveLearnAssociatedKindFromLectureType(row.type),
    title: row.title,
    meta: formatScheduleLabel(row.schedule),
  }
}

export async function getLectureAssociatedContent(input: {
  lectureId: number
  sectionId: number | null
  lectureData: unknown
}): Promise<Array<LearnAssociatedListItem>> {
  const items: Array<LearnAssociatedListItem> = []

  const forwardId = readAssociatedLectureId(input.lectureData)
  if (forwardId != null && forwardId !== input.lectureId) {
    const linked = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        schedule: lectures.schedule,
        type: lectures.type,
      })
      .from(lectures)
      .where(and(eq(lectures.id, forwardId), isNull(lectures.deletedAt)))
      .limit(1)

    const row = linked[0]
    if (row) items.push(toLectureItem(row))
  }

  if (input.sectionId != null) {
    const sectionLectures = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        schedule: lectures.schedule,
        type: lectures.type,
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
      const pointsHere = readAssociatedLectureId(row.data)
      if (pointsHere !== input.lectureId) continue
      items.push(toLectureItem(row))
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

  return dedupeLearnAssociatedItems(items)
}
