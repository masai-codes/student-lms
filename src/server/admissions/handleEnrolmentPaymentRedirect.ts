import { and, eq, isNotNull, isNull } from 'drizzle-orm'

import { signAdmissionsSsoToken } from './createAdmissionsSsoToken'
import { getAdmissionsSsoPayloadForUser } from './getAdmissionsSsoPayloadForUser'
import { db } from '@/db'
import { batchUser } from '@/db/schema'
import { logger } from '@/lib/logger'
import { bootstrapLoginWithToken } from '@/server/auth/bootstrapLogin'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { BATCH_TRANSFER_STATUS } from '@/server/api/webhooks/admissions/types'

const FN = 'handleEnrolmentPaymentRedirect'

/** Any failure bounces back to the dashboard (the CTA opens in a new tab). */
function redirectHome(): Response {
  return new Response(null, { status: 302, headers: { Location: '/' } })
}

/** A live (non-deleted) batch_user for this user + enrolment with a considered transfer. */
async function isPayableTransferEnrolment(
  userId: number,
  enrolmentId: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: batchUser.id })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.userId, userId),
        eq(batchUser.enrolmentId, enrolmentId),
        isNull(batchUser.deletedAt),
        eq(batchUser.batchTransferStatus, BATCH_TRANSFER_STATUS.CONSIDERED),
        isNotNull(batchUser.batchTransferId),
      ),
    )
    .limit(1)
  return rows.length > 0
}

/**
 * Resolve the caller. The app bootstrap `?token=` (`{ userId }` JWT) is checked
 * FIRST so the token's user always wins — on a shared `.masaischool.com` WebView
 * a stale session cookie may belong to a different user, and the incoming token
 * is the source of truth. `bootstrapLoginWithToken` mints a session and sets the
 * cookie via the request event; TanStack merges that `Set-Cookie` onto our 302
 * (non-2xx) response, so follow-up LMS requests stay authed.
 *
 * When there is no token (web CTA) or the token is invalid/expired, fall back to
 * the existing session cookie / `Authorization: Bearer`.
 */
async function resolvePaymentRedirectUserId(
  request: Request,
): Promise<number | null> {
  const bootstrapToken = new URL(request.url).searchParams.get('token')
  if (bootstrapToken) {
    const user = await bootstrapLoginWithToken({ data: bootstrapToken })
    if (user) return user.id
    // Bad/expired token: fall back to any existing session below.
    logger.warn({
      msg: 'Payment redirect with invalid bootstrap token',
      fn: FN,
    })
  }

  const sessionUserId = await getCurrentUserId()
  if (sessionUserId) return sessionUserId

  return null
}

/**
 * GET /api/admissions/enrolment-payment-redirect?enrolmentId=<id>
 *   [&token=<bootstrapJWT>]  — optional; for app WebViews with no session yet
 *
 * Click-time handler for the batch-transfer payment CTA. It verifies the
 * enrolment belongs to the signed-in user and is a "considered" transfer, mints
 * a FRESH admissions SSO token (with the `enrolment_id` claim) — so the token
 * can't expire before the click and is never embedded in the dashboard page —
 * then 302s to the admissions `/lms-login` enrolment-payment flow.
 *
 * Auth: session cookie / `Authorization: Bearer` (web), or the same app
 * bootstrap `?token=` used on protected pages (payload `{ userId }`). Bootstrap
 * sets the session cookie via the request event; the framework merges it onto
 * this 302 so follow-up LMS requests stay authed. Any failure (no auth,
 * bad/ineligible enrolment, SSO unconfigured) bounces back to the dashboard
 * rather than surfacing an error page in the new tab.
 */
export async function handleEnrolmentPaymentRedirect(
  request: Request,
): Promise<Response> {
  try {
    const userId = await resolvePaymentRedirectUserId(request)
    if (!userId) {
      logger.warn({ msg: 'Payment redirect without a session', fn: FN })
      return redirectHome()
    }

    const enrolmentId = Number(
      new URL(request.url).searchParams.get('enrolmentId') ?? '',
    )
    if (!Number.isInteger(enrolmentId) || enrolmentId <= 0) {
      logger.warn({
        msg: 'Payment redirect with invalid enrolmentId',
        fn: FN,
        userId,
      })
      return redirectHome()
    }

    if (!(await isPayableTransferEnrolment(userId, enrolmentId))) {
      logger.warn({
        msg: 'Payment redirect for a non-eligible enrolment',
        fn: FN,
        userId,
        enrolmentId,
      })
      return redirectHome()
    }

    const base = process.env.ADMISSIONS_SSO_BASE_URL?.trim().replace(/\/$/, '')
    const payload = base ? await getAdmissionsSsoPayloadForUser(userId) : null
    if (!base || !payload) {
      logger.warn({
        msg: 'Admissions SSO not configured for payment redirect',
        fn: FN,
        userId,
        enrolmentId,
      })
      return redirectHome()
    }

    const token = signAdmissionsSsoToken(payload, { enrolment_id: enrolmentId })
    logger.info({
      msg: 'Redirecting to admissions enrolment payment',
      fn: FN,
      userId,
      enrolmentId,
    })
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${base}/lms-login?token=${token}&enrolment_id=${enrolmentId}`,
      },
    })
  } catch (error) {
    logger.error({
      msg: 'Unhandled enrolment payment redirect failure',
      fn: FN,
      err: error,
    })
    return redirectHome()
  }
}
