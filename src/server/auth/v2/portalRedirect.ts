import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { getEmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { ORIGIN_URLS } from '@/utils/originUrls'

/** Human-readable portal names, used in the "you belong to X" copy. */
const PORTAL_LABEL: Record<EmailPortal, string> = {
  masai: 'Masai School',
  ihub: 'iHub DivyaSampark',
  iitj: 'IIT Jodhpur',
}

export type PortalRedirect = {
  /** Portal the user's `users.client` maps to. */
  portal: EmailPortal
  portalLabel: string
  /** Absolute URL on that portal's domain. */
  redirectUrl: string
}

export function getPortalLabel(portal: EmailPortal): string {
  return PORTAL_LABEL[portal]
}

function baseUrlFor(portal: EmailPortal): string {
  return ORIGIN_URLS[portal].newStudentUi.trim().replace(/\/$/, '')
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Where a student whose account lives on a *different* portal should be sent.
 * Returns `null` when no redirect is possible or sensible:
 *   - the target portal has no distinct URL configured, or
 *   - the target URL is the domain the request already arrived on (a redirect
 *     there would bounce the user in a loop — this is also what keeps local dev
 *     working, where every portal points at the same localhost origin).
 *
 * Callers decide *whether* the user is misplaced (see `canAccessPortal`); this
 * only answers *where to*.
 */
export function resolvePortalRedirect({
  userPortal,
  request,
  path = '/',
}: {
  userPortal: EmailPortal
  request: Request
  /** Path on the target portal, e.g. `/signin`. */
  path?: string
}): PortalRedirect | null {
  const requestPortal = getEmailPortal(request)
  if (userPortal === requestPortal) return null

  const base = baseUrlFor(userPortal)
  const targetOrigin = originOf(base)
  if (!targetOrigin) return null

  const currentOrigin = originOf(request.url)
  if (currentOrigin && currentOrigin === targetOrigin) return null

  const suffix = path.startsWith('/') ? path : `/${path}`
  return {
    portal: userPortal,
    portalLabel: PORTAL_LABEL[userPortal],
    redirectUrl: `${base}${suffix === '/' ? '' : suffix}`,
  }
}
