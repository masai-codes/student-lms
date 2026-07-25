import { and, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db'
import { assignments, batches, submissions, users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { getExperienceApiBaseUrl } from '@/server/api/http/experienceApiFetch'
import { acquireLock, releaseLock } from '@/server/redis/lock'
import { getIstNowSqlDatetime, parseIstToMs } from '@/server/time/istClock'
import { ORIGIN_URLS } from '@/utils/originUrls'

/**
 * Assess Platform URL generation — native port of experience-api's
 * `createAssessPlatformUrl` / `createAssessPlatformAIInterviewUrl`.
 *
 * This calls the external Assess Platform directly (same pattern as the
 * existing getAssessPlatformSubmissionViewUrl). Callbacks are deliberately
 * pointed back at experience-api (GQL_BASE_URL/*-callback), whose webhook
 * handlers still own inbound assessment events.
 *
 * Concurrent generation for the same submission is serialized by a Redis
 * distributed lock (`assess:url:generation:{submissionId}`, EX 120 NX) — the
 * same primitive experience-api used. When Redis is disabled/unreachable the
 * lock is a no-op and the DB idempotency guards still hold correctness: an
 * early-return when a link is already stored, a re-check under the lock, plus a
 * conditional UPDATE that only writes when none exists (and reads the winner
 * back on a race).
 *
 * Required env: ASSESS_PLATFORM_URL, ASSESS_PLATFORM_AUTH_TOKEN,
 * ASSESS_PLATFORM_SECRET_KEY, ASSESS_PLATFORM_CALLBACK_TOKEN,
 * ASSESS_LMS_CLIENT_ID, EXPERIENCE_API_BASE_URL. The callback base is
 * EXPERIENCE_API_BASE_URL + "/graphql" (i.e. experience-api's GQL_BASE_URL).
 * The post-assessment redirect base reuses VITE_NEW_STUDENT_UI_URL /
 * VITE_NEW_STUDENT_UI_URL_IHUB via ORIGIN_URLS.
 */

const CASE2 = 'case2'
const CASE3 = 'case3'
const IHUB_CUSTOM_LOGO_URL =
  'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/4b97bfbc-df3c-437e-86a8-f3c9dda76169/e1ZQMubybGjIiWeh.png'

type JsonObject = Record<string, unknown>

function asJsonObject(value: unknown): JsonObject | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value))
    return null
  return value as JsonObject
}

function requireAssessEnv(): {
  base: string
  adminAuthToken: string
  secretKey: string
} {
  const base = process.env.ASSESS_PLATFORM_URL?.trim().replace(/\/$/, '')
  const adminAuthToken = process.env.ASSESS_PLATFORM_AUTH_TOKEN?.trim()
  const secretKey = process.env.ASSESS_PLATFORM_SECRET_KEY?.trim()

  if (!process.env.ASSESS_PLATFORM_CALLBACK_TOKEN?.trim()) {
    throw new ApiError(500, 'ASSESS_PLATFORM_CALLBACK_TOKEN_MISSING')
  }
  if (!base || !adminAuthToken || !secretKey) {
    throw new ApiError(500, 'ASSESS_PLATFORM_NOT_CONFIGURED')
  }
  return { base, adminAuthToken, secretKey }
}

// experience-api's GQL_BASE_URL == EXPERIENCE_API_BASE_URL + "/graphql", and the
// assessment callbacks (/lms-callback, /live-progress-callback, ...) hang off it.
function callbackBaseUrl(): string {
  const base = getExperienceApiBaseUrl()
  if (!base) throw new ApiError(500, 'EXPERIENCE_API_NOT_CONFIGURED')
  return `${base}/graphql`
}

// Student app "return home" base for the post-assessment redirect. Reuses the
// per-origin new-student-UI URLs (VITE_NEW_STUDENT_UI_URL / _IHUB) via
// ORIGIN_URLS, which carry safe fallbacks — so no assess-specific frontend env
// is needed. iHub batches (`duration === 'ihub'`) return to the iHub portal.
function frontendUrlFor(batchDuration: string | null | undefined): string {
  const origin = batchDuration === 'ihub' ? 'ihub' : 'masai'
  return ORIGIN_URLS[origin].newStudentUi.replace(/\/$/, '')
}

function istNowIso(): string {
  // "YYYY-MM-DD HH:MM:SS" IST — matches experience-api's assess_platform_link_clicked.
  return getIstNowSqlDatetime()
}

function extractToken(url: string): string | null {
  const match = url.match(/token=([^&]*)/)
  return match?.[1] ?? null
}

/** Best-effort push of tokens to Assess Platform (used for showProblemSolution). */
async function sendTokensToAssess(input: {
  tokens: Array<string>
  showProblemSolution: boolean
}): Promise<void> {
  const base = process.env.ASSESS_PLATFORM_URL?.trim().replace(/\/$/, '')
  const adminAuthToken = process.env.ASSESS_PLATFORM_AUTH_TOKEN?.trim()
  if (!base || !adminAuthToken) return

  try {
    await fetch(`${base}/student/assessments/update-assessment-info`, {
      method: 'POST',
      headers: {
        adminauthtoken: adminAuthToken,
        clientId: process.env.ASSESS_LMS_CLIENT_ID ?? '',
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        tokens: input.tokens,
        showProblemSolution: input.showProblemSolution,
      }),
    })
  } catch (error) {
    console.warn('sendTokensToAssess failed', error)
  }
}

async function loadOwnedSubmission(
  submissionId: number,
  userId: number,
): Promise<{ id: number; data: JsonObject | null }> {
  const rows = await db
    .select({ id: submissions.id, data: submissions.data })
    .from(submissions)
    .where(
      and(eq(submissions.id, submissionId), eq(submissions.userId, userId)),
    )
    .limit(1)

  if (rows.length === 0) throw new ApiError(404, 'SUBMISSION_NOT_FOUND')
  return { id: rows[0].id, data: asJsonObject(rows[0].data) }
}

async function parseAssessError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => ({}))) as { message?: string }
  const message = body.message ?? ''
  if (/No questions found/.test(message)) {
    throw new ApiError(
      400,
      'ASSESS_NO_QUESTIONS_FOUND',
      'No questions found - You have attempted all the questions of this particular series.',
    )
  }
  throw new ApiError(500, 'ASSESS_PLATFORM_REQUEST_FAILED', message)
}

/**
 * POST /assignments/:assignmentId/assess-platform-url
 * Generate (or return the existing) Assess Platform test URL for a submission.
 */
export async function createAssessPlatformUrl(input: {
  assignmentId: number
  submissionId: number
  userId: number
}): Promise<{ url: string }> {
  const { assignmentId, submissionId, userId } = input
  const { base, adminAuthToken, secretKey } = requireAssessEnv()

  const submission = await loadOwnedSubmission(submissionId, userId)

  // Early return if a link was already generated.
  const existingLink = submission.data?.assess_platform_link
  if (typeof existingLink === 'string' && existingLink) {
    return { url: existingLink }
  }

  const assignmentRows = await db
    .select({
      id: assignments.id,
      concludes: assignments.concludes,
      settings: assignments.settings,
      batchId: assignments.batchId,
    })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1)

  const assignment = assignmentRows[0]
  if (!assignment) throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND')
  if (!assignment.concludes)
    throw new ApiError(400, 'ASSIGNMENT_CONCLUDES_MISSING')

  const settings = asJsonObject(assignment.settings) ?? {}
  const templateId = settings.assess_platform_id
  const clientId = settings.assess_platform_client_id
  const showProblemSolution = settings.showProblemSolution === true
  const questionSeriesId = settings.question_series_id
  const assignmentCase = settings.case
  const sectionDetailTime = settings.sectionDetailTime

  if (!templateId) throw new ApiError(400, 'ASSESS_TEMPLATE_ID_MISSING')

  let batchDuration: string | null = null
  if (assignment.batchId != null) {
    const batchRows = await db
      .select({ duration: batches.duration })
      .from(batches)
      .where(eq(batches.id, assignment.batchId))
      .limit(1)
    batchDuration = batchRows[0]?.duration ?? null
  }
  const isIhub = batchDuration === 'ihub'
  const frontendUrl = frontendUrlFor(batchDuration)
  const gqlBase = callbackBaseUrl()

  // Tokens from the user's prior submissions in the same question series, so
  // the platform excludes already-attempted questions.
  let sauTokensToExcludeQuestions: Array<string> = []
  if (questionSeriesId != null) {
    const seriesRows = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(
        sql`JSON_EXTRACT(${assignments.settings}, '$.question_series_id') = ${String(questionSeriesId)}`,
      )
    const seriesAssignmentIds = seriesRows
      .map((r) => Number(r.id))
      .filter(Boolean)

    if (seriesAssignmentIds.length > 0) {
      const priorSubs = await db
        .select({ data: submissions.data })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, userId),
            inArray(submissions.assignmentId, seriesAssignmentIds),
          ),
        )

      sauTokensToExcludeQuestions = priorSubs
        .map((s) => {
          const link = asJsonObject(s.data)?.assess_platform_link
          return typeof link === 'string' ? extractToken(link) : null
        })
        .filter((t): t is string => t !== null)
    }
  }

  // Section-time override for case2 / case3 assignments.
  let overrideSectionTime: number | undefined
  if (
    (assignmentCase === CASE2 || assignmentCase === CASE3) &&
    sectionDetailTime != null
  ) {
    // `concludes` is an IST wall-clock DATETIME string with no zone
    // (`YYYY-MM-DD HH:MM:SS`). Compare it against "now" in absolute epoch-ms so
    // the result is correct regardless of the process timezone. The old
    // `Date.now() + 5.5h` vs `new Date(concludes)` pair was only correct on a
    // UTC process: on an IST process it double-counts the +5:30 offset, pushing
    // "now" 5h30m into the future and shrinking remainingSeconds by 19800s.
    const nowMs = Date.now()
    const concludesMs = parseIstToMs(assignment.concludes) ?? Number.NaN
    const remainingSeconds = (concludesMs - nowMs) / 1000
    const configured = Number(sectionDetailTime)

    if (remainingSeconds > 0 && assignmentCase === CASE2) {
      overrideSectionTime = Math.min(configured, Math.floor(remainingSeconds))
      const extended = Number(settings.extended_deadline)
      if (
        configured < Math.floor(remainingSeconds) &&
        Number.isFinite(extended) &&
        extended > 0
      ) {
        overrideSectionTime += extended
      }
    }
    if (remainingSeconds > 0 && assignmentCase === CASE3) {
      overrideSectionTime = remainingSeconds
    }
  }

  const userRows = await db
    .select({ email: users.email, username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const user = userRows[0]
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND')

  const payload: JsonObject = {
    uniqueID: submissionId,
    username: user.username,
    groupId: assignment.id,
    assessmentTemplateId: templateId,
    redirectClientUrl: `${frontendUrl}/assignments/${assignmentId}`,
    isEligibleForMassRecruit: false,
    email: user.email,
    callback_url: `${gqlBase}/lms-callback`,
    liveProgressCallbackUrl: `${gqlBase}/live-progress-callback`,
    client_id: clientId,
    client_secret_key: secretKey,
    sauTokensToExcludeQuestions,
    ...(assignmentCase === CASE2 || assignmentCase === CASE3
      ? {
          overrideSectionTime:
            overrideSectionTime && overrideSectionTime > 0
              ? overrideSectionTime
              : 1,
          isAllowAfterDeadline: settings.allow_practice ?? false,
        }
      : {}),
    ...(isIhub
      ? { useCustomLogo: true, customLogoUrl: IHUB_CUSTOM_LOGO_URL }
      : {}),
  }

  // Serialize concurrent generation for this submission across PM2 workers.
  // The 120s TTL auto-frees the lock if we crash; when Redis is off acquireLock
  // returns true and the conditional UPDATE below remains the correctness guard.
  const lockKey = `assess:url:generation:${submissionId}`
  const gotLock = await acquireLock(lockKey, 120)
  if (!gotLock) {
    throw new ApiError(429, 'ASSESS_URL_GENERATION_IN_PROGRESS')
  }

  try {
    // Re-check under the lock: a racing request may have stored the link
    // between our first read and acquiring the lock — reuse it, don't regen.
    const locked = await loadOwnedSubmission(submissionId, userId)
    const lockedLink = locked.data?.assess_platform_link
    if (typeof lockedLink === 'string' && lockedLink) {
      return { url: lockedLink }
    }

    const response = await fetch(`${base}/student/assessments/generate-test`, {
      method: 'POST',
      headers: {
        adminauthtoken: adminAuthToken,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) await parseAssessError(response)
    const responseBody = (await response.json().catch(() => ({}))) as {
      url?: string
    }
    let url = responseBody.url
    if (!url) throw new ApiError(500, 'ASSESS_PLATFORM_URL_MISSING')

    // Persist only if no link exists yet (guards against a concurrent generate).
    const nowIst = istNowIso()
    const updatedData: JsonObject = {
      ...(locked.data ?? {}),
      assess_platform_link: url,
      assess_platform_link_clicked: nowIst,
    }
    const [header] = await db
      .update(submissions)
      .set({ data: updatedData, updatedAt: nowIst })
      .where(
        and(
          eq(submissions.id, submissionId),
          sql`(${submissions.data} IS NULL OR JSON_EXTRACT(${submissions.data}, '$.assess_platform_link') IS NULL)`,
        ),
      )

    if (header.affectedRows === 0) {
      // A concurrent request won; use the stored link.
      const stored = await loadOwnedSubmission(submissionId, userId)
      const storedLink = stored.data?.assess_platform_link
      if (typeof storedLink !== 'string' || !storedLink) {
        throw new ApiError(500, 'ASSESS_PLATFORM_URL_MISSING')
      }
      url = storedLink
    }

    if (showProblemSolution) {
      const token = extractToken(url)
      if (token) {
        await sendTokensToAssess({ tokens: [token], showProblemSolution: true })
      }
    }

    return { url }
  } finally {
    await releaseLock(lockKey)
  }
}

/**
 * POST /assignments/:assignmentId/ai-interview-url
 * Generate an Assess Platform AI-interview session URL for a submission.
 */
export async function createAssessPlatformAiInterviewUrl(input: {
  assignmentId: number
  submissionId: number
  userId: number
}): Promise<{ url: string }> {
  const { assignmentId, submissionId, userId } = input
  const { base, adminAuthToken } = requireAssessEnv()

  const assignmentRows = await db
    .select({
      id: assignments.id,
      settings: assignments.settings,
      batchId: assignments.batchId,
    })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1)
  const assignment = assignmentRows[0]
  if (!assignment) throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND')

  const submission = await loadOwnedSubmission(submissionId, userId)

  const settings = asJsonObject(assignment.settings)
  if (!settings) throw new ApiError(400, 'ASSIGNMENT_SETTINGS_MISSING')
  const templateId = settings.assess_platform_id
  if (!templateId) throw new ApiError(400, 'ASSESS_TEMPLATE_ID_MISSING')

  let batchDuration: string | null = null
  if (assignment.batchId != null) {
    const batchRows = await db
      .select({ duration: batches.duration })
      .from(batches)
      .where(eq(batches.id, assignment.batchId))
      .limit(1)
    batchDuration = batchRows[0]?.duration ?? null
  }
  const frontendUrl = frontendUrlFor(batchDuration)
  const gqlBase = callbackBaseUrl()

  const userRows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const user = userRows[0]
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND')

  const payload: JsonObject = {
    interviewTemplateId: templateId,
    email: user.email,
    redirectClientUrl: `${frontendUrl}/assignments/${assignmentId}`,
    uniqueID: String(submissionId),
    meta: {
      webhookDetailsToSendReport: {
        url: `${gqlBase}/lms-ai-interview-callback`,
        method: 'POST',
        headers: {},
      },
    },
  }

  const response = await fetch(`${base}/student/interview-session`, {
    method: 'POST',
    headers: {
      adminauthtoken: adminAuthToken,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) await parseAssessError(response)
  const responseBody = (await response.json().catch(() => ({}))) as {
    url?: string
    token?: string
  }
  const url = responseBody.url
  if (!url) throw new ApiError(500, 'ASSESS_PLATFORM_URL_MISSING')

  const nowIst = istNowIso()
  await db
    .update(submissions)
    .set({
      data: {
        ...(submission.data ?? {}),
        assess_platform_link: url,
        sessionToken: responseBody.token,
        assess_platform_link_clicked: nowIst,
      },
      updatedAt: nowIst,
    })
    .where(eq(submissions.id, submissionId))

  return { url }
}
