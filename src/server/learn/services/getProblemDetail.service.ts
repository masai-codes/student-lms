import { and, eq, isNull } from 'drizzle-orm'

import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import { db } from '@/db'
import { assignments } from '@/db/schema'
import {
  fetchAssignmentProblemDetailRow,
  fetchUserProblemSolution,
} from '@/server/learn/queries/fetchProblemDetail'
import { buildProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'

export async function getAssignmentProblemDetailForUser(
  userId: number,
  assignmentId: number,
  problemId: number,
): Promise<ProblemDetailPayload> {
  const assignmentRows = await db
    .select({
      title: assignments.title,
      batchId: assignments.batchId,
      sectionId: assignments.sectionId,
      settings: assignments.settings,
    })
    .from(assignments)
    .where(and(eq(assignments.id, assignmentId), isNull(assignments.deletedAt)))
    .limit(1)

  if (assignmentRows.length === 0) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const assignment = assignmentRows[0]

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    assignment.sectionId,
  )
  if (!allowed) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  const [problem, solution] = await Promise.all([
    fetchAssignmentProblemDetailRow(assignmentId, problemId),
    fetchUserProblemSolution(userId, assignmentId, problemId),
  ])

  if (problem == null) {
    throw new Error('LEARN_DETAIL_NOT_FOUND')
  }

  return buildProblemDetailPayload({
    assignmentId,
    assignmentTitle: assignment.title,
    settings: assignment.settings,
    problem,
    solution,
  })
}
