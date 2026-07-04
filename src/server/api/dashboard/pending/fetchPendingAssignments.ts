import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm'
import type { ScheduleEntityRow } from '../schedule/scheduleTypes'
import { db } from '@/db'
import { assignments, batches, sections, users } from '@/db/schema'

/**
 * Open assignments in the user's sections whose deadline hasn't passed
 * (`concludes > istNow`) and that are not deleted. Ordered by `concludes`
 * ascending (soonest deadline first). "Started/not-started" filtering happens
 * in the orchestrator against submission state.
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
        gt(assignments.concludes, istNow),
      ),
    )
    .orderBy(asc(assignments.concludes))

  return rows.map((row) => ({ ...row, module: null, zoomLink: null }))
}
