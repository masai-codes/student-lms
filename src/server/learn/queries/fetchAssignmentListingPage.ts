import { and, desc, eq } from 'drizzle-orm'

import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { db } from '@/db'
import { assignments, users } from '@/db/schema'
import { buildAssignmentListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { fetchLatestSubmissionByAssignment } from '@/server/learn/queries/fetchLatestSubmissionByAssignment'
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
