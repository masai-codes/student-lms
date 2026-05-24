import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { submissions } from '@/db/schema'

function istNowSqlString(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 19).replace('T', ' ')
}

export async function updateSubmissionCompletionForUser(input: {
  userId: number
  submissionId: number
  completed: boolean
}): Promise<void> {
  const rows = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.id, input.submissionId),
        eq(submissions.userId, input.userId),
        isNull(submissions.deletedAt),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new Error('SUBMISSION_NOT_FOUND')
  }

  const now = istNowSqlString()

  await db
    .update(submissions)
    .set({
      completed: input.completed ? 1 : 0,
      status: input.completed ? 'submitted' : 'pending',
      completedAt: input.completed ? now : null,
      updatedAt: now,
    })
    .where(eq(submissions.id, input.submissionId))
}
