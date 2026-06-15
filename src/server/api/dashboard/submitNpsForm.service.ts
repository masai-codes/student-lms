import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { npsForms, npsQuestionResponses, npsQuestions, npsSubmissions } from '@/db/schema'

export interface NpsQuestionAnswer {
  questionId: number
  response: unknown
}

export async function submitNpsForm(
  formId: number,
  userId: number,
  answers: Array<NpsQuestionAnswer>,
): Promise<{ submissionId: number }> {
  const [form] = await db
    .select({ id: npsForms.id })
    .from(npsForms)
    .where(and(eq(npsForms.id, formId), isNull(npsForms.deletedAt), eq(npsForms.isActive, 1)))
    .limit(1)

  if (!form) throw new Error('NPS_FORM_NOT_FOUND')

  // Find next attempt number
  const existingRows = await db
    .select({ attemptNumber: npsSubmissions.attemptNumber })
    .from(npsSubmissions)
    .where(and(eq(npsSubmissions.npsFormId, formId), eq(npsSubmissions.userId, userId)))
    .orderBy(sql`attempt_number DESC`)
    .limit(1)

  const nextAttempt = existingRows.length > 0 ? existingRows[0].attemptNumber + 1 : 1

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  const insertResult = await db
    .insert(npsSubmissions)
    .values({
      npsFormId: formId,
      userId,
      attemptNumber: nextAttempt,
      status: 'SUBMITTED',
      startedAt: now,
      completedAt: now,
      updatedAt: now,
    })
    .$returningId() as Array<{ id: number }>

  const submission = insertResult[0]
  if (!submission) throw new Error('NPS_SUBMISSION_CREATE_FAILED')

  if (answers.length > 0) {
    const questionIds = answers.map((a) => a.questionId)
    const validQuestions = await db
      .select({ id: npsQuestions.id })
      .from(npsQuestions)
      .where(
        and(
          eq(npsQuestions.npsFormId, formId),
          sql`${npsQuestions.id} IN (${sql.raw(questionIds.join(', '))})`,
          isNull(npsQuestions.deletedAt),
        ),
      )

    const validIds = new Set(validQuestions.map((q) => q.id))
    const rows = answers
      .filter((a) => validIds.has(a.questionId))
      .map((a) => ({
        npsSubmissionId: submission.id,
        npsQuestionId: a.questionId,
        response: a.response,
        updatedAt: now,
      }))

    if (rows.length > 0) {
      await db.insert(npsQuestionResponses).values(rows)
    }
  }

  return { submissionId: submission.id }
}
