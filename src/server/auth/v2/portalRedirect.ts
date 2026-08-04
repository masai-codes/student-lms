import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import {
  getEmailPortal,
  toEmailPortal,
} from '@/server/auth/v2/isRequestFromIHub'
import { canAccessPortal } from '@/server/auth/v2/portalGate'
import { ORIGIN_URLS } from '@/utils/originUrls'

function originOf(url: string): string | null {
  try {
    return new URL(url).origin.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Base URL of the portal a student belongs to, when they've landed on a
 * *different* portal's domain — masai / ihub / iitj, keyed off `users.client`
 * (see `ORIGIN_URLS` for the per-portal env vars). The app shell redirects on
 * this; it's the only portal-routing decision in the app.
 *
 * `null` means stay put:
 *   - the user is already on their own portal, or
 *   - the gate lets them through anyway (admins, grandfathered mobile users —
 *     see {@link canAccessPortal}), or
 *   - their portal resolves to the domain we're already on, so redirecting
 *     would loop. This is also what keeps local dev working, where every
 *     portal's URL points at the same localhost origin.
 */
export async function getPortalRedirectUrl({
  user,
  request,
}: {
  user: { id: number; role: string | null; client: string | null }
  request: Request
}): Promise<string | null> {
  const userPortal: EmailPortal = toEmailPortal(user.client)
  if (userPortal === getEmailPortal(request)) return null

  const allowedAnyway = await canAccessPortal({
    user: { id: user.id, role: user.role, client: userPortal },
    request,
  })
  if (allowedAnyway) return null

  const target = ORIGIN_URLS[userPortal].newStudentUi.trim().replace(/\/$/, '')
  const targetOrigin = originOf(target)
  if (!targetOrigin || targetOrigin === originOf(request.url)) return null

  return target
}
