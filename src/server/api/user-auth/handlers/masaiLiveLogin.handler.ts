import {
  MASAI_LIVE_DEFAULT_REDIRECT,
  buildMasaiLiveConnectSidCookie,
  frontendHomeForRedirect,
} from '@/server/api/user-auth/services/masaiLiveLoginCookies'
import {
  loadMasaiLiveUser,
  resolveMasaiLiveConnectSid,
} from '@/server/api/user-auth/services/resolveMasaiLiveConnectSid.service'
import { syncLmsPremiumForMasaiLiveLogin } from '@/server/api/user-auth/services/syncLmsPremium.service'
import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { logger } from '@/lib/logger'

const FN = 'masaiLiveLogin'

function redirectResponse(
  location: string,
  extraHeaders?: HeadersInit,
): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, ...extraHeaders },
  })
}

function parseRedirectFromBody(body: unknown): string {
  if (!body || typeof body !== 'object' || !('redirect' in body)) {
    return MASAI_LIVE_DEFAULT_REDIRECT
  }
  const redirect = (body as { redirect?: unknown }).redirect
  if (typeof redirect === 'string' && redirect.trim()) {
    return redirect.trim()
  }
  return MASAI_LIVE_DEFAULT_REDIRECT
}

/**
 * POST /api/user-auth/masai-live-login
 * App / API clients: returns connectSid in JSON for the client to store.
 */
export async function handlePostMasaiLiveLogin(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const user = await loadMasaiLiveUser(userId)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED')

    const rawBody = await request.json().catch(() => ({}))
    const redirect = parseRedirectFromBody(rawBody)
    const result = await resolveMasaiLiveConnectSid(user, redirect)

    if (!result.ok) {
      return Response.json(
        { success: false, message: result.message },
        { status: result.status },
      )
    }

    await syncLmsPremiumForMasaiLiveLogin({
      user,
      connectSid: result.connectSid,
    })

    return jsonOk({
      success: true,
      data: { connectSid: result.connectSid },
    })
  } catch (error) {
    logger.error({ msg: 'Error in masai-live-login POST', fn: FN, err: error })
    return mapThrownErrorToResponse(error)
  }
}

/**
 * GET /api/user-auth/masai-live-login
 * Browser / LMS banner click: fetches admissions connect.sid, sets it on the
 * shared Masai cookie domain, then redirects to Masai Live.
 */
export async function handleGetMasaiLiveLogin(
  request: Request,
): Promise<Response> {
  const home = frontendHomeForRedirect()
  const redirectParam = new URL(request.url).searchParams.get('redirect')
  const redirect =
    (redirectParam && redirectParam.trim()) || MASAI_LIVE_DEFAULT_REDIRECT

  try {
    const userId = await requireSessionUserId()
    const user = await loadMasaiLiveUser(userId)
    if (!user) return redirectResponse(home)

    const result = await resolveMasaiLiveConnectSid(user, redirect)

    if (!result.ok) {
      // No enrolment: still open Masai Live (guest / coming-soon experience).
      if (result.kind === 'not_found') {
        logger.info({
          msg: 'Masai Live GET login: no enrolment, redirecting to destination',
          fn: FN,
          userId,
          redirect,
        })
        return redirectResponse(redirect)
      }

      logger.warn({
        msg: `Masai Live GET login failed (${result.kind}): ${result.message}`,
        fn: FN,
        userId,
      })
      return redirectResponse(home)
    }

    await syncLmsPremiumForMasaiLiveLogin({
      user,
      connectSid: result.connectSid,
    })

    logger.info({
      msg: 'Masai Live GET login: redirecting with connect.sid cookie',
      fn: FN,
      userId,
      redirect,
    })
    return redirectResponse(redirect, {
      'Set-Cookie': buildMasaiLiveConnectSidCookie(result.connectSid),
    })
  } catch (error) {
    logger.error({ msg: 'Error in masai-live-login GET', fn: FN, err: error })
    return redirectResponse(home)
  }
}
