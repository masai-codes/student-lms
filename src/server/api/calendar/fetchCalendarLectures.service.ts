import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { CalendarEntityRow } from './calendarTypes'
import type { CalendarWindow } from './calendarWindow'
import { calendarOverlapClause } from './calendarOverlap'
import { withSectionLabel } from '@/server/api/dashboard/schedule/scheduleTypes'
import { db } from '@/db'
import { batches, lectures, sections, users } from '@/db/schema'

/**
 * Lectures in the given sections whose span overlaps the (padded) window,
 * excluding deleted rows. Joins `sections → batches` for labels and the host
 * user for the instructor name. Ordered by `schedule` ascending.
 */
export async function fetchCalendarLectures(
  sectionIds: Array<number>,
  window: CalendarWindow,
): Promise<Array<CalendarEntityRow>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      type: lectures.type,
      optional: lectures.optional,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      sectionId: lectures.sectionId,
      hostName: users.name,
      sectionName: sections.name,
      batchName: batches.name,
      sectionSettings: sections.settings,
      zoomLink: lectures.zoomLink,
      isNewZoomRedirection: lectures.isNewZoomRedirection,
      zoomDetails: lectures.zoomDetails,
    })
    .from(lectures)
    .leftJoin(users, eq(lectures.hostId, users.id))
    .innerJoin(sections, eq(lectures.sectionId, sections.id))
    .leftJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        inArray(lectures.sectionId, sectionIds),
        isNull(lectures.deletedAt),
        calendarOverlapClause(
          {
            startDate: lectures.startDate,
            endDate: lectures.endDate,
            schedule: lectures.schedule,
          },
          window,
        ),
      ),
    )
    .orderBy(asc(lectures.schedule))

  return withSectionLabel(rows)
}
