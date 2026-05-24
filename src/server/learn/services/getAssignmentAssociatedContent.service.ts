import { and, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { lectures } from '@/db/schema'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'
import { getLectureAssociatedContent } from '@/server/learn/services/getLectureAssociatedContent.service'
import { dedupeLearnAssociatedItems } from '@/server/learn/utils/dedupeLearnAssociatedItems'
import { readAssociatedLectureIds } from '@/server/learn/utils/parseLectureDataJson'
import { resolveLearnAssociatedKindFromLectureType } from '@/server/learn/utils/resolveLearnAssociatedKind'
import { formatSqlDate } from '@/utils/generics'

function formatScheduleLabel(schedule: string | null): string | null {
  if (schedule == null || schedule.trim() === '') return null
  return formatSqlDate(schedule)
}

export async function getAssignmentAssociatedContent(input: {
  assignmentId: number
  sectionId: number | null
  assignmentData: unknown
}): Promise<Array<LearnAssociatedListItem>> {
  const lectureIds = readAssociatedLectureIds(input.assignmentData)
  if (lectureIds.length === 0) return []

  const linkedLectures = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      schedule: lectures.schedule,
      type: lectures.type,
      data: lectures.data,
    })
    .from(lectures)
    .where(and(inArray(lectures.id, lectureIds), isNull(lectures.deletedAt)))

  const items: Array<LearnAssociatedListItem> = []

  for (const row of linkedLectures) {
    items.push({
      id: row.id,
      kind: resolveLearnAssociatedKindFromLectureType(row.type),
      title: row.title,
      meta: formatScheduleLabel(row.schedule),
    })

    const lectureAssociated = await getLectureAssociatedContent({
      lectureId: row.id,
      sectionId: input.sectionId,
      lectureData: row.data,
    })
    items.push(...lectureAssociated)
  }

  return dedupeLearnAssociatedItems(items, {
    kind: 'assignment',
    id: input.assignmentId,
  })
}
