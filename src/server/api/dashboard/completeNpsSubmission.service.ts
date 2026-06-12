import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { npsQuestionResponses, npsQuestions, npsSubmissions } from '@/db/schema'

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function completeNpsSubmission(
  submissionId: number,
  userId: number,
): Promise<void> {
  const [submission] = await db
    .select({ id: npsSubmissions.id, npsFormId: npsSubmissions.npsFormId, isLocked: npsSubmissions.isLocked, status: npsSubmissions.status })
    .from(npsSubmissions)
    .where(
      and(
        eq(npsSubmissions.id, submissionId),
        eq(npsSubmissions.userId, userId),
        isNull(npsSubmissions.deletedAt),
      ),
    )
    .limit(1)

  if (!submission) throw new Error('NPS_SUBMISSION_NOT_FOUND')
  if (submission.isLocked || submission.status === 'SUBMITTED') throw new Error('NPS_SUBMISSION_ALREADY_SUBMITTED')

  // Validate all required questions have responses
  const requiredQuestions = await db
    .select({ id: npsQuestions.id })
    .from(npsQuestions)
    .where(
      and(
        eq(npsQuestions.npsFormId, submission.npsFormId),
        eq(npsQuestions.isRequired, 1),
        isNull(npsQuestions.deletedAt),
      ),
    )

  if (requiredQuestions.length > 0) {
    const answeredResponses = await db
      .select({ npsQuestionId: npsQuestionResponses.npsQuestionId })
      .from(npsQuestionResponses)
      .where(eq(npsQuestionResponses.npsSubmissionId, submissionId))

    const answeredIds = new Set(answeredResponses.map((r) => r.npsQuestionId))
    const missing = requiredQuestions.filter((q) => !answeredIds.has(q.id))

    if (missing.length > 0) {
      throw new Error(`NPS_REQUIRED_QUESTIONS_MISSING:${missing.map((q) => q.id).join(',')}`)
    }
  }

  const now = nowMysql()

  await db
    .update(npsSubmissions)
    .set({ status: 'SUBMITTED', isLocked: 1, completedAt: now, updatedAt: now })
    .where(eq(npsSubmissions.id, submissionId))
}
