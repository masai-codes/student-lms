import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { lectures, zefLmsMetaData, zefLmsQuiz } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { requireAssessEnv } from '@/server/learn/utils/assessEnv'

/**
 * Ends (submits) the user's in-lecture quiz attempt on the Assess Platform.
 *
 * Called when the student clicks "Submit". `token` is the test token returned by
 * `generate-test` (the same token embedded in the running iframe's URL), so this
 * ends exactly the assessment the user is taking. Access + the active
 * `zef_lms_quiz` for this lecture are re-validated so the endpoint can't be used
 * to poke arbitrary lectures.
 *
 * The graded result is delivered asynchronously by the Assess Platform's
 * `gradeAssessment` callback (persisted separately) — this call only triggers
 * the submission.
 */
export async function endInLectureQuizAssessment(input: {
  userId: number
  lectureId: number
  assessmentTemplateId: string
  token: string
}): Promise<{ ok: true }> {
  const { userId, lectureId, assessmentTemplateId, token } = input
  const { base, adminAuthToken, clientId } = requireAssessEnv()

  const rows = await db
    .select({ sectionId: lectures.sectionId })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), isNull(lectures.deletedAt)))
    .limit(1)

  const lecture = rows[0]
  if (!lecture) throw new ApiError(404, 'LECTURE_NOT_FOUND')

  const allowed = await ensureUserCanAccessLearnHubEntity(
    userId,
    lecture.sectionId,
  )
  if (!allowed) throw new ApiError(404, 'LECTURE_NOT_FOUND')

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
        eq(zefLmsQuiz.status, 'active'),
      ),
    )
    .limit(1)
  if (quizRows.length === 0) throw new ApiError(404, 'QUIZ_TEMPLATE_NOT_FOUND')

  const response = await fetch(`${base}/assessments/endassessment`, {
    method: 'POST',
    headers: {
      adminauthtoken: adminAuthToken,
      clientid: clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  }).catch((err) => {
    console.error('[in-lecture-quiz] endassessment request error', err)
    return null
  })

  if (!response || !response.ok) {
    const message = response
      ? await response
          .json()
          .then((b: { message?: string }) => b.message)
          .catch(() => undefined)
      : undefined
    console.error('[in-lecture-quiz] endassessment failed', response?.status)
    throw new ApiError(
      502,
      'ASSESS_END_ASSESSMENT_FAILED',
      message ?? 'Failed to submit quiz',
    )
  }

  return { ok: true }
}
