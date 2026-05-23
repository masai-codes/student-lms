import { and, eq, isNull } from 'drizzle-orm'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

import { db } from '@/db'
import { assignments, users } from '@/db/schema'
import { DISCUSSION_ENTITY_ASSIGNMENT } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsForLearnEntity'
import {
  buildAssignmentDetailPayload,
  isSupportedAssignmentDetailType,
} from '@/server/learn/utils/buildAssignmentDetailPayload'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export async function getAssignmentLearningDetailForUser(
  userId: number,
  assignmentId: number,
): Promise<AssignmentDetailPayload> {
  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      category: assignments.category,
      type: assignments.type,
      optional: assignments.optional,
      schedule: assignments.schedule,
      concludes: assignments.concludes,
      week: assignments.week,
      module: assignments.module,
      batchId: assignments.batchId,
      sectionId: assignments.sectionId,
      hostName: users.name,
      hostAvatarUrl: users.profilePhotoPath,
      instructions: assignments.instructions,
      enforceDeadline: assignments.enforceDeadline,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const row = rows[0]

  if (!isSupportedAssignmentDetailType(row.type)) {
    throw new Error('ASSIGNMENT_DETAIL_UNSUPPORTED_TYPE')
  }

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    row.batchId,
    row.sectionId,
  )

  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const core = buildLearnDetailPresentation(row)
  const discussions = await listDiscussionsForLearnEntity(
    userId,
    DISCUSSION_ENTITY_ASSIGNMENT,
    assignmentId,
  )

  return buildAssignmentDetailPayload(
    { ...core, discussions },
    {
      type: row.type,
      schedule: row.schedule,
      concludes: row.concludes,
      hostAvatarUrl: row.hostAvatarUrl,
      instructions: row.instructions,
      enforceDeadline: row.enforceDeadline,
    },
    Date.now(),
  )
}
