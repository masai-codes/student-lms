import { and, desc, eq, sql } from 'drizzle-orm'

import type { SQL } from 'drizzle-orm'
import type { LearningPagination } from '@/server/learn/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { LearnListingConditionsInput } from '@/server/learn/utils/buildLearnListingConditions'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { db } from '@/db'
import { assignments, users } from '@/db/schema'
import { buildAssignmentListingConditions } from '@/server/learn/utils/buildLearnListingConditions'
import { calculateAssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { fetchLatestSubmissionByAssignment } from '@/server/learn/queries/fetchLatestSubmissionByAssignment'
import { resolveReleasedAssignmentScore } from '@/server/learn/utils/resolveReleasedAssignmentScore'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'
import { toMysqlUtc } from '@/server/learn/utils/buildLearnScheduleWindow'
import { IST_OFFSET_MS } from '@/server/learn/utils/learnListingConstants'

/**
 * Reverse-chronological ordering for assignments (latest first), mirroring the
 * lecture listing, with one pin on top: assignments that are currently IN
 * PROGRESS — released and still open (`schedule <= now < concludes`) — float to
 * the very top so students see what they can work on right now. Everything else
 * then sorts by `schedule` descending: later date first, and — because
 * `schedule` is a full timestamp — same-date items sort later-time first.
 *
 * Tie-break (identical schedule): type priority evaluation > assignment >
 * practice, then newest id.
 *
 * `now` is an IST wall-clock string (`now + 5:30`) so it compares directly
 * against the IST-stored `schedule` / `concludes` columns.
 */
function buildAssignmentListingOrderBy(nowMs: number): Array<SQL> {
  const wallNow = toMysqlUtc(nowMs + IST_OFFSET_MS)

  const inProgressFirst = sql`CASE
    WHEN ${assignments.schedule} <= ${wallNow}
      AND ${assignments.concludes} > ${wallNow} THEN 0
    ELSE 1
  END`

  const typeRank = sql`CASE ${assignments.type}
    WHEN 'evaluation' THEN 1
    WHEN 'assignment' THEN 2
    WHEN 'practice' THEN 3
    ELSE 4
  END`

  return [
    sql`${inProgressFirst} ASC`,
    desc(assignments.schedule),
    sql`${typeRank} ASC`,
    desc(assignments.id),
  ]
}

export interface AssignmentListingPage {
  rows: Array<LearningEntityRow>
  pagination: LearningPagination
  progressById: Map<number, AssignmentProgressStatus>
  /** Released, `showScores`-enabled scores (clamped to 10) keyed by assignment id. */
  scoreById: Map<number, number>
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
      scoreById: new Map(),
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
      showScores: assignments.showScores,
      settings: assignments.settings,
      hostName: users.name,
    })
    .from(assignments)
    .leftJoin(users, eq(assignments.userId, users.id))
    .where(and(...buildAssignmentListingConditions(input)))
    .orderBy(...buildAssignmentListingOrderBy(input.nowMs))

  const submissionByAssignment = await fetchLatestSubmissionByAssignment(
    input.userId,
    narrowedRows.map((row) => row.id),
  )

  const requestedStatuses = input.filters?.assignmentProgressStatuses
  const progressById = new Map<number, AssignmentProgressStatus>()
  const scoreById = new Map<number, number>()

  const matchedRows = narrowedRows.filter((row) => {
    const submission = submissionByAssignment.get(row.id) ?? null
    const progress = calculateAssignmentProgressStatus({
      schedule: row.schedule,
      concludes: row.concludes ?? null,
      nowMs: input.nowMs,
      submission,
    })
    progressById.set(row.id, progress)

    const releasedScore = resolveReleasedAssignmentScore({
      showScores: row.showScores === 1,
      submission,
    })
    if (releasedScore != null) {
      scoreById.set(row.id, releasedScore)
    }
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
  return { rows: pageRows, pagination, progressById, scoreById }
}
