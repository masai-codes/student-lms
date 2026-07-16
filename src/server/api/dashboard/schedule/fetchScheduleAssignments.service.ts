import { and, asc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm'
import type { ScheduleEntityRow } from './scheduleTypes'
import { db } from '@/db'
import { assignments, batches, sections, users } from '@/db/schema'

/**
 * Assignments in the user's sections whose `start_date` OR `end_date` falls in
 * the `[start, end]` date window, excluding deleted rows. Same filter/shape as
 * {@link fetchScheduleLectures}, minus the lecture-only join fields (assignments
 * have no `module`/`zoom_link`). Ordered by `schedule` ascending.
 */
export async function fetchScheduleAssignments(
  sectionIds: Array<number>,
  start: string,
  end: string,
): Promise<Array<ScheduleEntityRow>> {
  if (sectionIds.length === 0) return []

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      category: assignments.category,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      concludes: assignments.concludes,
      sectionId: assignments.sectionId,
      week: assignments.week,
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
        or(
          and(
            gte(assignments.startDate, start),
            lte(assignments.startDate, end),
          ),
          and(gte(assignments.endDate, start), lte(assignments.endDate, end)),
        ),
      ),
    )
    .orderBy(asc(assignments.schedule))

  // Assignments have no `module`/`zoom_link` columns.
  return rows.map((row) => ({ ...row, module: null, zoomLink: null }))
}
