import { and, asc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import type { ScheduleEntityRow } from './scheduleTypes'
import { db } from '@/db'
import { batches, lectures, sections, users } from '@/db/schema'

/**
 * Lectures in the user's sections whose `start_date` OR `end_date` falls in the
 * `[start, end]` date window, excluding deleted rows. Joins `sections → batches`
 * for the course label and selects `sections.settings` for the web-view flag.
 * Ordered by `schedule` ascending.
 */
export async function fetchScheduleLectures(
  sectionIds: Array<number>,
  start: string,
  end: string,
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
        or(
          and(gte(lectures.startDate, start), lte(lectures.startDate, end)),
          and(gte(lectures.endDate, start), lte(lectures.endDate, end)),
        ),
      ),
    )
    .orderBy(asc(lectures.schedule))
}
