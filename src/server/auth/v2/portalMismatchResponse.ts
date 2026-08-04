import { errorResponse } from '@/server/auth/v2/httpHelpers'
import { toEmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { resolvePortalRedirect } from '@/server/auth/v2/portalRedirect'

/**
 * The single `403 PORTAL_MISMATCH` response shape for a student signing in on a
 * portal their account doesn't belong to. When the account's own portal has a
 * distinct URL configured, the body carries `portal` + `redirectUrl` so the
 * sign-in UI can send them there instead of dead-ending on an error; otherwise
 * it falls back to the plain "cannot sign in from this portal" message.
 *
 * Credentials are already verified by the time this is reached, so naming the
 * account's portal in the message leaks nothing the user doesn't own.
 */
export function portalMismatchResponse({
  client,
  request,
}: {
  /**
   * Raw `users.client` of the (authenticated) account. Pass empty/null when the
   * caller can't name a single account (e.g. one OTP matching accounts on
   * several portals) — the generic message is returned instead of guessing a
   * destination, since `toEmailPortal` would silently default to Masai.
   */
  client: string | null | undefined
  request: Request
}): Response {
  const redirect = client?.trim()
    ? resolvePortalRedirect({
        userPortal: toEmailPortal(client.trim()),
        request,
        path: '/signin',
      })
    : null

  if (!redirect) {
    return errorResponse(
      403,
      'PORTAL_MISMATCH',
      'This account cannot sign in from this portal.',
    )
  }

  return errorResponse(
    403,
    'PORTAL_MISMATCH',
    `This account belongs to ${redirect.portalLabel}. Taking you to the right place…`,
    {
      portal: redirect.portal,
      portalLabel: redirect.portalLabel,
      redirectUrl: redirect.redirectUrl,
    },
  )
}
