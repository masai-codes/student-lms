import { createFileRoute } from '@tanstack/react-router'
import { getCurrentSessionPayload } from '@/server/auth/getCurrentSessionUserId'
import {
  errorResponse,
  jsonResponse,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import {
  buildSessionCookieHeader,
  renewActiveEntryIfNeeded,
  signSessionToken,
} from '@/server/auth/v2/sessionToken'

/**
 * Sliding-window keep-alive: extends the active session's expiry (capped at
 * its absolute ceiling) when there's meaningful room left, and reissues the
 * cookie. Called explicitly by the client rather than on every request, so a
 * bare stolen token replayed outside the real app doesn't renew itself.
 */
// No async work here (everything is a pure JWT/cookie operation), but the
// signature must stay a `Promise<Response>` to match `withAuthErrorHandling`.
export function handleRenew(request: Request): Promise<Response> {
  const payload = getCurrentSessionPayload()
  if (!payload) {
    return Promise.resolve(
      errorResponse(401, 'UNAUTHENTICATED', 'Not signed in'),
    )
  }

  const { payload: renewedPayload, renewed, activeEntry } =
    renewActiveEntryIfNeeded(payload)

  if (!renewed) {
    return Promise.resolve(
      jsonResponse({ renewed: false, exp: activeEntry.exp }),
    )
  }

  const token = signSessionToken(renewedPayload)
  const setCookieHeader = buildSessionCookieHeader({
    token,
    request,
    expiresAt: new Date(activeEntry.exp * 1000),
  })

  return Promise.resolve(
    jsonResponse(
      { renewed: true, exp: activeEntry.exp },
      { status: 200, headers: { 'Set-Cookie': setCookieHeader } },
    ),
  )
}

export const Route = createFileRoute('/(auth)/v2/auth/renew')({
  server: {
    handlers: {
      POST: withAuthErrorHandling('renew', handleRenew),
    },
  },
})
