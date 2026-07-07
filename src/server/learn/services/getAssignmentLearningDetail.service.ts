import { and, desc, eq, isNull } from 'drizzle-orm'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

import { db } from '@/db'
import { assignments, submissions, users } from '@/db/schema'
import { DISCUSSION_ENTITY_ASSIGNMENT } from '@/server/new-discussions/discussionEntityTypes'
import { listDiscussionsWithThreadsForLearnEntity } from '@/server/new-discussions/services/listDiscussionsWithThreadsForLearnEntity'
import {
  fetchAssignmentProblemRows,
  fetchSolutionStatusesBySubmission,
} from '@/server/learn/queries/fetchAssignmentProblems'
import {
  buildAssignmentDetailPayload,
  isSupportedAssignmentDetailType,
} from '@/server/learn/utils/buildAssignmentDetailPayload'
import { buildAssignmentProblemListItems } from '@/server/learn/utils/buildAssignmentProblemListItems'
import { buildLearnDetailPresentation } from '@/server/learn/utils/buildLearnDetailPresentation'
import { getAssignmentAssociatedContent } from '@/server/learn/services/getAssignmentAssociatedContent.service'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { resolveLearnDetailBanRestriction } from '@/server/learn/utils/resolveLearnDetailBanRestriction'
import { getBatchIdForSection } from '@/server/batches/getBatchIdsForSections'
import { getUserBatchBans } from '@/server/users/batchBan'

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

  const [submissionRows, problemRows, discussions, associatedItems] =
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
    fetchAssignmentProblemRows(assignmentId),
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

  const submissionRow = submissionRows.length > 0 ? submissionRows[0] : null

  const solutionStatusByProblemId = new Map<number, string | null>()
  if (submissionRow != null && problemRows.length > 0) {
    const solutionRows = await fetchSolutionStatusesBySubmission(submissionRow.id)
    for (const solution of solutionRows) {
      solutionStatusByProblemId.set(solution.problemId, solution.status)
    }
  }
  const problems = buildAssignmentProblemListItems(
    problemRows,
    solutionStatusByProblemId,
  )

  const core = buildLearnDetailPresentation(row)

  const payload = buildAssignmentDetailPayload(
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
    problems,
  )

  const [bans, sectionBatchId] = await Promise.all([
    getUserBatchBans(userId),
    getBatchIdForSection(row.sectionId),
  ])
  const isPractice = row.type.trim().toLowerCase() === 'practice'
  const banRestriction = resolveLearnDetailBanRestriction({
    contentBatchId: sectionBatchId ?? row.batchId,
    schedule: row.schedule,
    bans,
    agreementRestrictionKind: isPractice ? 'practice' : null,
  })

  if (banRestriction?.kind === 'practice') {
    // Agreement ban: strip the practice attempt so it can't be started; the
    // frontend renders a ban notice in the footer's place.
    return {
      ...payload,
      banRestriction,
      footer: { ...payload.footer, visible: false, actions: [] },
    }
  }

  return { ...payload, banRestriction }
}
