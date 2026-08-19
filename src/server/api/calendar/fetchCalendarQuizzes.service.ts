import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { CalendarEntityRow } from './calendarTypes'
import type { CalendarWindow } from './calendarWindow'
import { calendarOverlapClause } from './calendarOverlap'
import { withSectionLabel } from '@/server/api/dashboard/schedule/scheduleTypes'
import { db } from '@/db'
import { batches, quizzes, sections, users } from '@/db/schema'

/**
 * Quizzes in the given sections whose span overlaps the (padded) window,
 * excluding deleted rows. Section-scoped only — batch-level quizzes with a
 * null `section_id` are not surfaced (parity with the old LMS calendar).
 * Ordered by `schedule` ascending.
 */
export async function fetchCalendarQuizzes(
  sectionIds: Array<number>,
  window: CalendarWindow,
): Promise<Array<CalendarEntityRow>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      type: quizzes.type,
      optional: quizzes.optional,
      schedule: quizzes.schedule,
      concludes: quizzes.concludes,
      sectionId: quizzes.sectionId,
      hostName: users.name,
      sectionName: sections.name,
      batchName: batches.name,
      sectionSettings: sections.settings,
    })
    .from(quizzes)
    .leftJoin(users, eq(quizzes.userId, users.id))
    .innerJoin(sections, eq(quizzes.sectionId, sections.id))
    .leftJoin(batches, eq(sections.batchId, batches.id))
    .where(
      and(
        inArray(quizzes.sectionId, sectionIds),
        isNull(quizzes.deletedAt),
        calendarOverlapClause(
          {
            startDate: quizzes.startDate,
            endDate: quizzes.endDate,
            schedule: quizzes.schedule,
          },
          window,
        ),
      ),
    )
    .orderBy(asc(quizzes.schedule))

  return withSectionLabel(rows).map((row) => ({
    ...row,
    zoomLink: null,
    isNewZoomRedirection: null,
    zoomDetails: null,
  }))
}
