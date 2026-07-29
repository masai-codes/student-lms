import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import {
  zefLmsMetaData,
  zefLmsQuiz,
  zefLmsQuizSubmission,
} from '@/db/schema'
import { parseInLectureQuizUniqueId } from '@/server/learn/utils/inLectureQuizUniqueId'

const gradeSchema = z.object({
  isCorrect: z.boolean().optional(),
  lastSubmitTime: z.string().optional(),
})

/**
 * The subset of the Assess `gradeAssessment` callback we persist. `userGrades`
 * is `{ [sectionId]: { [questionId]: grade } }`.
 */
const payloadSchema = z.object({
  uniqueID: z.string(),
  assessmentTemplateId: z.string().optional(),
  questionLevelDetails: z
    .object({
      userGrades: z.record(z.string(), z.record(z.string(), gradeSchema)),
    })
    .optional(),
  testStatus: z.object({ htmlReport: z.string().optional() }).optional(),
})

/** First (question) grade found in the nested `userGrades` map, or `null`. */
function firstGrade(
  userGrades: Record<
    string,
    Record<string, { isCorrect?: boolean; lastSubmitTime?: string }>
  >,
): { isCorrect?: boolean; lastSubmitTime?: string } | null {
  for (const section of Object.values(userGrades)) {
    for (const grade of Object.values(section)) return grade
  }
  return null
}

/**
 * Persist an in-lecture quiz submission from the Assess `gradeAssessment`
 * callback into `zef_lms_quiz_submission` (one row per quiz+user; re-submits
 * update in place):
 * - `is_correct` ← the (single) question grade's `isCorrect`
 * - `html_report` ← `testStatus.htmlReport`
 * - `score` ← left NULL
 * - `evaluated_at` ← the grade's `lastSubmitTime`
 * - `created_at` ← now (UTC)
 *
 * Best-effort: unmappable payloads are logged and skipped (never throws for a
 * bad payload) so the callback still returns 200.
 */
export async function saveInLectureQuizSubmission(
  payload: unknown,
): Promise<void> {
  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) {
    console.error(
      '[assessment-callback] gradeAssessment payload not persistable',
      parsed.error.flatten(),
    )
    return
  }
  const data = parsed.data

  const ids = parseInLectureQuizUniqueId(data.uniqueID)
  if (!ids) {
    console.error('[assessment-callback] could not parse uniqueID', data.uniqueID)
    return
  }
  const { userId, lectureId } = ids
  const assessmentTemplateId =
    data.assessmentTemplateId ?? ids.assessmentTemplateId

  // Map (lecture, assessmentId) → zef_lms_quiz.id (the submission FK).
  const quizRows = await db
    .select({ id: zefLmsQuiz.id })
    .from(zefLmsQuiz)
    .innerJoin(
      zefLmsMetaData,
      eq(zefLmsQuiz.zefLmsMetaDataId, zefLmsMetaData.id),
    )
    .where(
      and(
        eq(zefLmsMetaData.lectureId, lectureId),
        eq(zefLmsQuiz.assessmentId, assessmentTemplateId),
      ),
    )
    .limit(1)

  const zefLmsQuizId = quizRows[0]?.id
  if (!zefLmsQuizId) {
    console.error('[assessment-callback] no zef_lms_quiz found for submission', {
      lectureId,
      assessmentTemplateId,
    })
    return
  }

  const grade = data.questionLevelDetails
    ? firstGrade(data.questionLevelDetails.userGrades)
    : null
  const isCorrect =
    grade?.isCorrect === undefined ? null : grade.isCorrect ? 1 : 0
  const evaluatedAt = grade?.lastSubmitTime ?? null
  const htmlReport = data.testStatus?.htmlReport ?? null
  const nowUtc = new Date().toISOString()

  await db
    .insert(zefLmsQuizSubmission)
    .values({
      zefLmsQuizId,
      userId,
      isCorrect,
      // score intentionally left NULL.
      htmlReport,
      evaluatedAt,
      createdAt: nowUtc,
    })
    .onDuplicateKeyUpdate({
      set: {
        isCorrect,
        htmlReport,
        evaluatedAt,
        updatedAt: nowUtc,
      },
    })

  console.log('[assessment-callback] saved zef_lms_quiz_submission', {
    zefLmsQuizId,
    userId,
    isCorrect,
  })
}
