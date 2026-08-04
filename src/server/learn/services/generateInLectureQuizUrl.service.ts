import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { lectures, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { ensureUserCanAccessLearnHubEntity } from '@/server/learn/utils/ensureLearnEntityAccess'
import { buildInLectureQuizUniqueId } from '@/server/learn/utils/inLectureQuizUniqueId'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'

/**
 * Generates (via the Assess Platform) a ready-to-embed test URL for an
 * in-lecture popup quiz. The `assessmentTemplateId` is validated against the
 * lecture's own `settings.inLecturePopupQuiz` so a student can't mint a test
 * for an arbitrary template id.
 *
 * Required env: ASSESS_PLATFORM_URL, ASSESS_ADMIN_AUTH_TOKEN, ASSESS_CLIENT_ID,
 * ASSESS_CALLBACK_BASE_URL (public base the Assess Platform posts callbacks to).
 */
function requireAssessEnv(): {
  base: string
  adminAuthToken: string
  clientId: string
  callbackBase: string
} {
  const base = process.env.ASSESS_PLATFORM_URL?.trim().replace(/\/$/, '')
  const adminAuthToken = process.env.ASSESS_ADMIN_AUTH_TOKEN?.trim()
  const clientId = process.env.ASSESS_CLIENT_ID?.trim()
  const callbackBase = process.env.ASSESS_CALLBACK_BASE_URL?.trim().replace(
    /\/$/,
    '',
  )

  if (!base || !adminAuthToken || !clientId || !callbackBase) {
    // Log presence (never the actual secret values) for each required var, so
    // a prod failure names exactly which one is missing instead of a single
    // generic error. Check with: pm2 logs student-lms (or
    // /home/ubuntu/logs/app-error.log — this throws, so it lands there).
    console.error('[in-lecture-quiz] ASSESS_QUIZ_NOT_CONFIGURED — env presence:', {
      ASSESS_PLATFORM_URL: Boolean(base),
      ASSESS_ADMIN_AUTH_TOKEN: Boolean(adminAuthToken),
      ASSESS_CLIENT_ID: Boolean(clientId),
      ASSESS_CALLBACK_BASE_URL: Boolean(callbackBase),
    })
    throw new ApiError(500, 'ASSESS_QUIZ_NOT_CONFIGURED')
  }
  return { base, adminAuthToken, clientId, callbackBase }
}

export async function generateInLectureQuizUrl(input: {
  userId: number
  lectureId: number
  assessmentTemplateId: string
}): Promise<{ url: string }> {
  const { userId, lectureId, assessmentTemplateId } = input
  const { base, adminAuthToken, clientId, callbackBase } = requireAssessEnv()

  const rows = await db
    .select({ sectionId: lectures.sectionId, settings: lectures.settings })
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

  // The requested template must be one this lecture actually configured.
  const { inLecturePopupQuiz } = parseLectureSettings(lecture.settings)
  const isConfigured = inLecturePopupQuiz.some(
    (quiz) => quiz.assessmentTemplate === assessmentTemplateId,
  )
  if (!isConfigured) throw new ApiError(404, 'QUIZ_TEMPLATE_NOT_FOUND')

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
      uniqueID: buildInLectureQuizUniqueId(userId, lectureId, assessmentTemplateId),
      assessmentTemplateId,
      redirectClientUrl: 'https://dont-redirect.com',
      email,
      client_id: clientId,
      callback_url: callbackUrl,
      groupId: String(lectureId),
      liveProgressCallbackUrl,
      noTimeBound: true,
      skipSubjectiveGrading: false,
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

  const body = (await response.json().catch(() => ({}))) as { url?: string }
  if (!body.url) throw new ApiError(502, 'ASSESS_QUIZ_URL_MISSING')

  return { url: body.url }
}
