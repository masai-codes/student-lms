import { and, eq, isNull } from 'drizzle-orm'

import { ApiError } from '@/server/api/http/apiError'
import { db } from '@/db'
import { solutions, submissions } from '@/db/schema'

function istNowSqlString(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 19).replace('T', ' ')
}

export type SubmitSolutionInput = {
  userId: number
  solutionId: number
  submissionLink: string
}

/** Marks a solution submitted with the given link, verifying the user owns it. */
export async function submitSolutionForUser(
  input: SubmitSolutionInput,
): Promise<{ status: 'submitted'; submissionLink: string }> {
  const owned = await db
    .select({ id: solutions.id })
    .from(solutions)
    .innerJoin(submissions, eq(solutions.submissionId, submissions.id))
    .where(
      and(
        eq(solutions.id, input.solutionId),
        eq(submissions.userId, input.userId),
        isNull(solutions.deletedAt),
        isNull(submissions.deletedAt),
      ),
    )
    .limit(1)

  if (owned.length === 0) {
    throw new ApiError(404, 'SOLUTION_NOT_FOUND')
  }

  const now = istNowSqlString()

  await db
    .update(solutions)
    .set({
      submissionLink: input.submissionLink,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(solutions.id, input.solutionId))

  return { status: 'submitted', submissionLink: input.submissionLink }
}
