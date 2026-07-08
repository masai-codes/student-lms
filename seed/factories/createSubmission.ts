import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { submissions } from '@/db/schema'

type SubmissionInsert = typeof submissions.$inferInsert
type SubmissionSelect = typeof submissions.$inferSelect

export type CreateSubmissionOverrides = Partial<Omit<SubmissionInsert, 'id'>>

export async function createSubmission(
  overrides: CreateSubmissionOverrides = {},
): Promise<SubmissionSelect> {
  const { assignmentId, userId } = overrides
  if (assignmentId == null || userId == null) {
    throw new Error('createSubmission requires assignmentId and userId')
  }

  const values: SubmissionInsert = {
    score: 0,
    started: 0,
    completed: 0,
    ...overrides,
    assignmentId,
    userId,
  }

  const [result] = await db.insert(submissions).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load submission after insert (id=${id})`)
  }

  return row
}
