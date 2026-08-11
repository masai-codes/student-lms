import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import {
  lectures,
  users,
  zefLmsMetaData,
  zefLmsQuiz,
  zefLmsQuizSubmission,
} from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { buildInLectureQuizUniqueId } from '@/server/learn/utils/inLectureQuizUniqueId'
import { requireAssessEnv } from '@/server/learn/utils/assessEnv'

/**
 * Pull the Assess report token out of a stored `html_report`. The report holds
 * the admin report URL (`…/assessment-report?token=<TOKEN>`); we accept any
 * `token=` param as a fallback. Returns `null` when none is present.
 */
function extractReportToken(htmlReport: string): string | null {
  const match =
    htmlReport.match(/assessment-report\?token=([A-Za-z0-9._-]+)/) ??
    htmlReport.match(/[?&]token=([A-Za-z0-9._-]+)/)
  return match ? match[1] : null
}

/**
 * Exchange a report token for a ready-to-embed submission-view URL via the
 * Assess Platform. Returns `null` on any failure so the caller can degrade
 * gracefully (fall back to a fresh test) rather than hard-erroring.
 */
async function fetchSubmissionViewUrl(opts: {
  base: string
  adminAuthToken: string
  clientId: string
  reportToken: string
}): Promise<string | null> {
  const url = new URL(
    `${opts.base}/student/submissions/get-submission-view-url`,
  )
  url.searchParams.set('reportToken', opts.reportToken)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      adminauthtoken: opts.adminAuthToken,
      clientid: opts.clientId,
    },
  }).catch((err) => {
    console.error(
      '[in-lecture-quiz] get-submission-view-url request error',
      err,
    )
    return null
  })

  if (!response || !response.ok) {
    console.error(
      '[in-lecture-quiz] get-submission-view-url failed',
      response?.status,
    )
    return null
  }

  const body = (await response.json().catch(() => ({}))) as { url?: string }
  return body.url ?? null
}

/**
 * Resolves the ready-to-embed Assess Platform URL for an in-lecture popup quiz.
 *
 * If the user already has a `zef_lms_quiz_submission` for this quiz, returns the
 * read-only submission-view URL (`alreadySubmitted: true`) built from the report
 * token stored in that row's `html_report`. Otherwise mints a fresh test via
 * `generate-test` (`alreadySubmitted: false`).
 *
 * The `assessmentTemplateId` (the ZEF quiz's `assessment_id`) is validated
 * against the lecture's active `zef_lms_quiz` rows so a student can't mint a test
 * for an arbitrary assessment id.
 *
 * Required env: ASSESS_PLATFORM_URL, ASSESS_ADMIN_AUTH_TOKEN, ASSESS_CLIENT_ID,
 * ASSESS_CALLBACK_BASE_URL (public base the Assess Platform posts callbacks to).
 */
export async function generateInLectureQuizUrl(input: {
  userId: number
  lectureId: number
  assessmentTemplateId: string
}): Promise<{ url: string; alreadySubmitted: boolean; token?: string }> {
  const { userId, lectureId, assessmentTemplateId } = input
  const { base, adminAuthToken, clientId, callbackBase } = requireAssessEnv()

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

  // The requested assessment must be an active in-lecture quiz configured for
  // this lecture in the ZEF ⇆ LMS tables (`zef_lms_meta_data` → `zef_lms_quiz`),
  // so a student can't mint a test for an arbitrary assessment id.
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
  const zefLmsQuizId = quizRows[0].id

  // If the user already has a submission for this quiz, show their submitted
  // response (read-only view) instead of minting a fresh test.
  const submissionRows = await db
    .select({ htmlReport: zefLmsQuizSubmission.htmlReport })
    .from(zefLmsQuizSubmission)
    .where(
      and(
        eq(zefLmsQuizSubmission.zefLmsQuizId, zefLmsQuizId),
        eq(zefLmsQuizSubmission.userId, userId),
      ),
    )
    .limit(1)

  const submission = submissionRows[0]
  if (submission) {
    const reportToken = submission.htmlReport
      ? extractReportToken(submission.htmlReport)
      : null
    if (reportToken) {
      const viewUrl = await fetchSubmissionViewUrl({
        base,
        adminAuthToken,
        clientId,
        reportToken,
      })
      if (viewUrl) return { url: viewUrl, alreadySubmitted: true }
      console.error(
        '[in-lecture-quiz] submission exists but view url unavailable — falling back to a fresh test',
        { zefLmsQuizId, userId },
      )
    } else {
      console.error(
        '[in-lecture-quiz] submission exists but no report token in html_report — falling back to a fresh test',
        { zefLmsQuizId, userId },
      )
    }
  }

  const userRows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const email = userRows[0]?.email
  if (!email) throw new ApiError(404, 'USER_NOT_FOUND')

  const callbackUrl = `${callbackBase}/api/assessment-callback`
  const liveProgressCallbackUrl = `${callbackBase}/api/assessment-callback/live-progress`
  console.log('[in-lecture-quiz] generate-test callback_url:', callbackUrl)
  console.log(
    '[in-lecture-quiz] generate-test liveProgressCallbackUrl:',
    liveProgressCallbackUrl,
  )

  const response = await fetch(`${base}/student/assessments/generate-test`, {
    method: 'POST',
    headers: {
      adminauthtoken: adminAuthToken,
      clientid: clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Stable per user + lecture + template so repeat opens don't spawn a new
      // assessment every time. Also how the `gradeAssessment` callback is
      // matched back to (user, lecture, template) — see inLectureQuizUniqueId.ts.
      uniqueID: buildInLectureQuizUniqueId(
        userId,
        lectureId,
        assessmentTemplateId,
      ),
      assessmentTemplateId,
      redirectClientUrl: 'https://dont-redirect.com',
      email,
      client_id: clientId,
      callback_url: callbackUrl,
      groupId: String(lectureId),
      liveProgressCallbackUrl,
      noTimeBound: true,
      skipSubjectiveGrading: true,
      showInstantAnswer: true,
    }),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
    }
    throw new ApiError(
      502,
      'ASSESS_QUIZ_REQUEST_FAILED',
      body.message ?? 'Failed to generate quiz',
    )
  }

  const body = (await response.json().catch(() => ({}))) as {
    url?: string
    token?: string
  }
  if (!body.url) throw new ApiError(502, 'ASSESS_QUIZ_URL_MISSING')

  // `token` powers the manual "Submit" (endassessment) — see
  // endInLectureQuizAssessment.service.
  return { url: body.url, alreadySubmitted: false, token: body.token }
}
