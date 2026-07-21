import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, sectionUser, submissions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

/**
 * Start (create) an assignment submission for a user — natively (no
 * experience-api call). Port of experience-api's REST `createSubmission`:
 * reject duplicates, require the assignment to exist, and enforce section
 * enrollment before inserting a `pending`/`started` row.
 */
export async function createAssignmentSubmission(input: {
  assignmentId: number
  userId: number
}): Promise<{ id: number }> {
  const { assignmentId, userId } = input

  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    throw new ApiError(400, 'INVALID_ASSIGNMENT_ID')
  }

  // One submission per (user, assignment) — mirrors experience-api's 409.
  const existing = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.assignmentId, assignmentId),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    throw new ApiError(409, 'SUBMISSION_ALREADY_EXISTS')
  }

  const assignmentRows = await db
    .select({ sectionId: assignments.sectionId })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1)

  const assignment = assignmentRows[0]
  if (!assignment) {
    throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND')
  }

  if (assignment.sectionId != null) {
    const enrollment = await db
      .select({ id: sectionUser.id })
      .from(sectionUser)
      .where(
        and(
          eq(sectionUser.sectionId, assignment.sectionId),
          eq(sectionUser.userId, userId),
          isNull(sectionUser.deletedAt),
        ),
      )
      .limit(1)

    if (enrollment.length === 0) {
      throw new ApiError(403, 'USER_NOT_ENROLLED_IN_SECTION')
    }
  }

  const nowIst = getIstNowSqlDatetime()
  const [header] = await db.insert(submissions).values({
    userId,
    assignmentId,
    started: 1,
    completed: 0,
    status: 'pending',
    score: 0,
    oldScore: 0,
    startedAt: nowIst,
    createdAt: nowIst,
    updatedAt: nowIst,
  })

  const id = Number(header.insertId)
  if (!id) {
    throw new ApiError(500, 'SUBMISSION_CREATE_FAILED')
  }

  return { id }
}
