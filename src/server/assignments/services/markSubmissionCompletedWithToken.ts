import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { submissions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

/**
 * Mark an assignment submission complete via an Assessment Platform return
 * token — native port of experience-api's `updateSubmissionWithToken`.
 *
 * When the Assess Platform redirects the learner back to the LMS after a test,
 * it appends the token embedded in the generated assess link. We only flip
 * `mark_as_completed` when that token matches the one stored on the learner's
 * own submission, so the completion cannot be forged from another URL.
 */
export async function markSubmissionCompletedWithToken(input: {
  userId: number
  assignmentId: number
  token: string
}): Promise<{ markAsCompleted: boolean }> {
  const token = input.token?.trim()
  if (!token) {
    throw new ApiError(400, 'TOKEN_REQUIRED')
  }

  const rows = await db
    .select({
      id: submissions.id,
      data: submissions.data,
      markAsCompleted: submissions.markAsCompleted,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.assignmentId, input.assignmentId),
        eq(submissions.userId, input.userId),
        isNull(submissions.deletedAt),
      ),
    )
    .limit(1)

  const submission = rows[0]
  if (!submission) {
    throw new ApiError(404, 'SUBMISSION_NOT_FOUND')
  }

  // Idempotent: already completed via token — nothing to do.
  if (submission.markAsCompleted === 1) {
    return { markAsCompleted: true }
  }

  const link = submission.data?.assess_platform_link
  if (typeof link !== 'string' || link.trim() === '') {
    throw new ApiError(400, 'ASSESS_PLATFORM_LINK_NOT_FOUND')
  }

  const urlToken = link.split('token=')[1]
  if (urlToken !== token) {
    throw new ApiError(403, 'INVALID_TOKEN')
  }

  await db
    .update(submissions)
    .set({ markAsCompleted: 1, updatedAt: getIstNowSqlDatetime() })
    .where(eq(submissions.id, submission.id))

  return { markAsCompleted: true }
}
