import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { CalendarEntityRow } from './calendarTypes'
import type { CalendarWindow } from './calendarWindow'
import { calendarOverlapClause } from './calendarOverlap'
import { withSectionLabel } from '@/server/api/dashboard/schedule/scheduleTypes'
import { db } from '@/db'
import { assignments, batches, sections, users } from '@/db/schema'

/**
 * Assignments in the given sections whose span overlaps the (padded) window,
 * excluding deleted rows. Same shape as {@link fetchCalendarLectures}, minus
 * the lecture-only join fields. Ordered by `schedule` ascending.
 */
export async function fetchCalendarAssignments(
  sectionIds: Array<number>,
  window: CalendarWindow,
): Promise<Array<CalendarEntityRow>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      concludes: assignments.concludes,
      sectionId: assignments.sectionId,
      hostName: users.name,
      sectionName: sections.name,
      batchName: batches.name,
      sectionSettings: sections.settings,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .innerJoin(sections, eq(assignments.sectionId, sections.id))
    .leftJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        inArray(assignments.sectionId, sectionIds),
        isNull(assignments.deletedAt),
        calendarOverlapClause(
          {
            startDate: assignments.startDate,
            endDate: assignments.endDate,
            schedule: assignments.schedule,
          },
          window,
        ),
      ),
    )
    .orderBy(asc(assignments.schedule))

  return withSectionLabel(rows).map((row) => ({
    ...row,
    zoomLink: null,
    isNewZoomRedirection: null,
    zoomDetails: null,
  }))
}
