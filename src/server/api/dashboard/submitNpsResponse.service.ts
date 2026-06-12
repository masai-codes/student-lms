import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { npsQuestionResponses, npsQuestions, npsSubmissions } from '@/db/schema'

function nowMysql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export async function submitNpsResponse(
  submissionId: number,
  userId: number,
  questionId: number,
  response: unknown,
): Promise<void> {
  // Guard: submission must belong to this user and not be locked
  const [submission] = await db
    .select({ id: npsSubmissions.id, npsFormId: npsSubmissions.npsFormId, isLocked: npsSubmissions.isLocked })
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
  if (submission.isLocked) throw new Error('NPS_SUBMISSION_LOCKED')

  // Guard: question must belong to the same form
  const [question] = await db
    .select({ id: npsQuestions.id })
    .from(npsQuestions)
    .where(
      and(
        eq(npsQuestions.id, questionId),
        eq(npsQuestions.npsFormId, submission.npsFormId),
        isNull(npsQuestions.deletedAt),
      ),
    )
    .limit(1)

  if (!question) throw new Error('NPS_QUESTION_NOT_FOUND')

  const now = nowMysql()

  // UPSERT — unique on (nps_submission_id, nps_question_id)
  await db
    .insert(npsQuestionResponses)
    .values({
      npsSubmissionId: submissionId,
      npsQuestionId: questionId,
      response,
      answeredAt: now,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        response: sql`VALUES(response)`,
        answeredAt: now,
        updatedAt: now,
      },
    })
}
