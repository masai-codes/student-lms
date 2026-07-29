import { ApiError } from '@/server/api/http/apiError'

/**
 * Shared Assess Platform configuration for the in-lecture quiz flows
 * (generate-test, get-submission-view-url, endassessment). Throws a 500 naming
 * exactly which env var is missing (never the secret values).
 *
 * Required env: ASSESS_PLATFORM_URL, ASSESS_ADMIN_AUTH_TOKEN, ASSESS_CLIENT_ID,
 * ASSESS_CALLBACK_BASE_URL (public base the Assess Platform posts callbacks to).
 */
export function requireAssessEnv(): {
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
