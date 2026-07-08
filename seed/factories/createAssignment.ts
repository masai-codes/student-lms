import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { assignments } from '@/db/schema'

import { formatMysqlDate, formatMysqlDatetime, offsetFromNow } from '../utils/time'

type AssignmentInsert = typeof assignments.$inferInsert
type AssignmentSelect = typeof assignments.$inferSelect

export type CreateAssignmentOverrides = Partial<Omit<AssignmentInsert, 'id'>>

export async function createAssignment(
  overrides: CreateAssignmentOverrides = {},
): Promise<AssignmentSelect> {
  const { userId, batchId, sectionId } = overrides
  if (userId == null || batchId == null || sectionId == null) {
    throw new Error('createAssignment requires userId, batchId, and sectionId')
  }

  const schedule = overrides.schedule ?? formatMysqlDatetime(offsetFromNow({ minutesFromNow: 60 }))
  const startDate = overrides.startDate ?? formatMysqlDate(offsetFromNow({ daysAgo: 0 }))

  const values: AssignmentInsert = {
    title: 'Practice Assignment',
    category: 'course',
    type: 'assignment',
    optional: 0,
    week: 1,
    day: 1,
    schedule,
    concludes: formatMysqlDatetime(offsetFromNow({ daysAgo: -3 })),
    startDate,
    endDate: startDate,
    ...overrides,
    userId,
    batchId,
    sectionId,
  }

  const [result] = await db.insert(assignments).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load assignment after insert (id=${id})`)
  }

  return row
}
