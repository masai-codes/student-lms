import { and, count, desc, eq, isNull } from 'drizzle-orm'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

import { db } from '@/db'
import { assignmentProblem, assignments, submissions, users } from '@/db/schema'
import { DISCUSSION_ENTITY_ASSIGNMENT } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsWithThreadsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity'
import {
  buildAssignmentDetailPayload,
  isSupportedAssignmentDetailType,
} from '@/server/learn/utils/buildAssignmentDetailPayload'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { getAssignmentAssociatedContent } from '@/server/learn/services/getAssignmentAssociatedContent.service'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export async function getAssignmentLearningDetailForUser(
  userId: number,
  assignmentId: number,
): Promise<AssignmentDetailPayload> {
  const nowMs = Date.now()

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
      platform: assignments.platform,
      showScores: assignments.showScores,
      showSubmission: assignments.showSubmission,
      settings: assignments.settings,
      data: assignments.data,
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

  const [submissionRows, problemCountRows, discussions, associatedItems] =
    await Promise.all([
    db
      .select({
        id: submissions.id,
        completed: submissions.completed,
        status: submissions.status,
        markAsCompleted: submissions.markAsCompleted,
        score: submissions.score,
        startedAt: submissions.startedAt,
        completedAt: submissions.completedAt,
        data: submissions.data,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.userId, userId),
          isNull(submissions.deletedAt),
        ),
      )
      .orderBy(desc(submissions.createdAt))
      .limit(1),
    db
      .select({ count: count() })
      .from(assignmentProblem)
      .where(eq(assignmentProblem.assignmentId, assignmentId)),
    listDiscussionsWithThreadsForLearnEntity(
      userId,
      DISCUSSION_ENTITY_ASSIGNMENT,
      assignmentId,
    ),
    getAssignmentAssociatedContent({
      assignmentId,
      sectionId: row.sectionId,
      assignmentData: row.data,
    }),
  ])

  const submissionRow = submissionRows[0] ?? null
  const problemCount = Number(problemCountRows[0]?.count ?? 0)

  const core = buildLearnDetailPresentation(row)

  return buildAssignmentDetailPayload(
    { ...core, discussions },
    {
      type: row.type,
      category: row.category,
      platform: row.platform,
      showScores: row.showScores,
      showSubmission: row.showSubmission,
      settings: row.settings,
      schedule: row.schedule,
      concludes: row.concludes,
      hostAvatarUrl: row.hostAvatarUrl,
      instructions: row.instructions,
      enforceDeadline: row.enforceDeadline,
    },
    nowMs,
    {
      problemCount,
      submission:
        submissionRow == null
          ? null
          : {
              id: submissionRow.id,
              completed: submissionRow.completed === 1,
              status: submissionRow.status,
              markAsCompleted:
                submissionRow.markAsCompleted == null
                  ? null
                  : submissionRow.markAsCompleted === 1,
              score: submissionRow.score,
              startedAt: submissionRow.startedAt,
              completedAt: submissionRow.completedAt,
              data: submissionRow.data ?? null,
            },
    },
    associatedItems,
  )
}
