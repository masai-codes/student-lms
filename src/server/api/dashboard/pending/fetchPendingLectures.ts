import { and, asc, eq, inArray, isNull, lt, ne, notInArray } from 'drizzle-orm'
import type { ScheduleEntityRow } from '../schedule/scheduleTypes'
import { db } from '@/db'
import { batches, lectures, sections, users } from '@/db/schema'

/** Lecture types that never appear as catch-up pending tasks. */
const EXCLUDED_LECTURE_TYPES = ['resource', 'scrum']

/**
 * Mandatory, non-resource/non-scrum lectures in the user's sections that have
 * already concluded (`concludes < istNow`) and are not deleted. Catch-up
 * eligibility (attendance window still open) is decided in the orchestrator via
 * the attendance summary. Ordered by `concludes` ascending.
 */
export async function fetchPendingLectures(
  sectionIds: Array<number>,
  istNow: string,
): Promise<Array<ScheduleEntityRow>> {
  if (sectionIds.length === 0) return []

  return db
    .select({
      id: lectures.id,
      title: lectures.title,
      category: lectures.category,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      sectionId: lectures.sectionId,
      week: lectures.week,
      module: lectures.module,
      hostName: users.name,
      zoomLink: lectures.zoomLink,
      isNewZoomRedirection: lectures.isNewZoomRedirection,
      sectionName: sections.name,
      batchName: batches.name,
      sectionSettings: sections.settings,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .innerJoin(sections, eq(lectures.sectionId, sections.id))
    .leftJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        inArray(lectures.sectionId, sectionIds),
        isNull(lectures.deletedAt),
        lt(lectures.concludes, istNow),
        ne(lectures.optional, 1),
        notInArray(lectures.type, EXCLUDED_LECTURE_TYPES),
      ),
    )
    .orderBy(asc(lectures.concludes))
}
