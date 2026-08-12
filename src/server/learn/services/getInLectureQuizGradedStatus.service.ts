import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { zefLmsMetaData, zefLmsQuiz, zefLmsQuizSubmission } from '@/db/schema'

/**
 * Polled by an open in-lecture quiz modal to learn whether the user has a saved
 * submission for this quiz yet — i.e. whether the Assess `gradeAssessment`
 * callback has persisted a `zef_lms_quiz_submission` row.
 *
 * This is deliberately the DB row (not a transient/persistent cache flag): a
 * fresh test only ever renders when no row exists yet, so the modal can treat a
 * false→true transition here as "submitted during THIS session" and reveal the
 * skip overlay — without a stale earlier-submission signal firing on reopen.
 */
export async function getInLectureQuizGradedStatus(input: {
  userId: number
  lectureId: number
  assessmentTemplateId: string
}): Promise<{ graded: boolean }> {
  const quizRows = await db
    .select({ id: zefLmsQuiz.id })
    .from(zefLmsQuiz)
    .innerJoin(
      zefLmsMetaData,
      eq(zefLmsQuiz.zefLmsMetaDataId, zefLmsMetaData.id),
    )
    .where(
      and(
        eq(zefLmsMetaData.lectureId, input.lectureId),
        eq(zefLmsQuiz.assessmentId, input.assessmentTemplateId),
      ),
    )
    .limit(1)

  const quizId = quizRows[0]?.id
  if (!quizId) return { graded: false }

  const subRows = await db
    .select({ id: zefLmsQuizSubmission.id })
    .from(zefLmsQuizSubmission)
    .where(
      and(
        eq(zefLmsQuizSubmission.zefLmsQuizId, quizId),
        eq(zefLmsQuizSubmission.userId, input.userId),
      ),
    )
    .limit(1)

  return { graded: subRows.length > 0 }
}
