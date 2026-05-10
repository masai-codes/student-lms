import { and, eq, isNull } from 'drizzle-orm'

import type { LearnHubDetailPayload } from '@/server/learn/types'

import { db } from '@/db'
import { assignments, users } from '@/db/schema'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export async function getAssignmentLearningDetailForUser(
  userId: number,
  assignmentId: number
): Promise<LearnHubDetailPayload> {
  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      category: assignments.category,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      week: assignments.week,
      module: assignments.module,
      batchId: assignments.batchId,
      sectionId: assignments.sectionId,
      hostName: users.name,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]

  const allowed = await ensureUserCanAccessLearnHubEntity(userId, row.batchId, row.sectionId)

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  return buildLearnDetailPresentation(row)
}
