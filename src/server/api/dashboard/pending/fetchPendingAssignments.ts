import { and, asc, eq, gt, inArray, isNull, lte } from 'drizzle-orm'
import type { ScheduleEntityRow } from '../schedule/scheduleTypes'
import { withSectionLabel } from '../schedule/scheduleTypes'
import { db } from '@/db'
import { assignments, batches, sections, users } from '@/db/schema'

/**
 * Open assignments in the user's sections that are within their active window —
 * already started (`schedule <= istNow`) and deadline not yet passed
 * (`concludes > istNow`) — and not deleted. Ordered by `concludes` ascending
 * (soonest deadline first). "Has the user begun it" filtering happens in the
 * orchestrator against submission state.
 */
export async function fetchPendingAssignments(
  sectionIds: Array<number>,
  istNow: string,
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
      module: assignments.module,
      settings: assignments.settings,
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
        lte(assignments.schedule, istNow),
        gt(assignments.concludes, istNow),
      ),
    )
    .orderBy(asc(assignments.concludes))

  // Assignments have no `zoom_link` column.
  return withSectionLabel(rows.map((row) => ({ ...row, zoomLink: null })))
}
