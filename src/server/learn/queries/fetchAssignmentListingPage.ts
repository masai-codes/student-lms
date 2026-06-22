import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import type {
  AssignmentProgressStatus,
  AssignmentSubmissionProgress,
} from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { db } from '@/db'
import { assignments, submissions, users } from '@/db/schema'
import { buildAssignmentListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

export interface AssignmentListingPage {
  rows: Array<LearningEntityRow>
  pagination: LearningPagination
  progressById: Map<number, AssignmentProgressStatus>
}

export interface FetchAssignmentListingPageInput extends LearnListingConditionsInput {
  page: number
  pageSize: number
  nowMs: number
}

/** Latest submission flags per assignment for this user (first row wins — newest by createdAt). */
async function fetchLatestSubmissionByAssignment(
  userId: number,
  assignmentIds: Array<number>,
): Promise<Map<number, AssignmentSubmissionProgress>> {
  if (assignmentIds.length === 0) return new Map()

  const rows = await db
    .select({
      assignmentId: submissions.assignmentId,
      completed: submissions.completed,
      status: submissions.status,
      markAsCompleted: submissions.markAsCompleted,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        isNull(submissions.deletedAt),
        inArray(submissions.assignmentId, assignmentIds),
      ),
    )
    .orderBy(desc(submissions.createdAt))

  const byAssignment = new Map<number, AssignmentSubmissionProgress>()
  for (const row of rows) {
    if (!byAssignment.has(row.assignmentId)) {
      byAssignment.set(row.assignmentId, {
        completed: row.completed === 1,
        status: row.status ?? null,
        markAsCompleted: row.markAsCompleted === 1,
      })
    }
  }
  return byAssignment
}

/**
 * Assignments listing page. Non-progress filters are applied in SQL; progress status
 * is computed in app code (it is derived from time + submission state, not stored),
 * then progress filtering and pagination are applied to the narrowed set.
 */
export async function fetchAssignmentListingPage(
  input: FetchAssignmentListingPageInput,
): Promise<AssignmentListingPage> {
  if (input.sectionIds.length === 0) {
    return {
      rows: [],
      pagination: resolveListingPagination(0, input.page, input.pageSize),
      progressById: new Map(),
    }
  }

  const narrowedRows = await db
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
      hostName: users.name,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(...buildAssignmentListingConditions(input)))
    .orderBy(desc(assignments.id))

  const submissionByAssignment = await fetchLatestSubmissionByAssignment(
    input.userId,
    narrowedRows.map((row) => row.id),
  )

  const requestedStatuses = input.filters?.assignmentProgressStatuses
  const progressById = new Map<number, AssignmentProgressStatus>()

  const matchedRows = narrowedRows.filter((row) => {
    const progress = calculateAssignmentProgressStatus({
      schedule: row.schedule,
      concludes: row.concludes ?? null,
      nowMs: input.nowMs,
      submission: submissionByAssignment.get(row.id) ?? null,
    })
    progressById.set(row.id, progress)
    return (
      requestedStatuses == null ||
      requestedStatuses.length === 0 ||
      requestedStatuses.includes(progress)
    )
  })

  const pagination = resolveListingPagination(
    matchedRows.length,
    input.page,
    input.pageSize,
  )
  const offset = (pagination.page - 1) * input.pageSize
  const pageRows = matchedRows.slice(offset, offset + input.pageSize)
  return { rows: pageRows, pagination, progressById }
}
