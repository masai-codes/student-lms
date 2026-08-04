import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import {
  getEmailPortal,
  toEmailPortal,
} from '@/server/auth/v2/isRequestFromIHub'
import type { PortalRedirect } from '@/server/auth/v2/portalRedirect'
import { resolvePortalRedirect } from '@/server/auth/v2/portalRedirect'

export type GateUser = {
  id: number
  role: string | null
  client: string
}

export function isAdminRole(role: string | null): boolean {
  return role === 'admin' || role === 'super_admin'
}

/** Whether the request originates from a mobile app (sends X-App-Mobile: true). */
export function isMobileRequest(request: Request): boolean {
  const v = request.headers.get('x-app-mobile')?.trim().toLowerCase()
  return v === 'true' || v === '1'
}

/**
 * Grandfather flag for legacy iHub users who relied on the Masai mobile app
 * before iHub had its own app. Stored on `users.meta.legacy_masai_app_access`.
 * Anything other than literal `true` is treated as false (missing key, false,
 * "true" string, etc.).
 */
function hasLegacyMasaiAppAccess(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false
  return (meta as Record<string, unknown>).legacy_masai_app_access === true
}

async function fetchUserMeta(userId: number): Promise<unknown> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0]?.meta ?? null
}

/**
 * Decides whether `user` is allowed to sign in via the portal implied by
 * `request`. Returns true when:
 *   - the user is an admin (admins bypass portal gating entirely), OR
 *   - the user's `client` matches the request portal, OR
 *   - the grandfather exception applies: legacy iHub user accessing the
 *     Masai mobile app (no iHub mobile app exists yet).
 *
 * Only the grandfather branch hits the DB for `meta`; the happy path and
 * the cross-portal rejection paths are zero-query.
 */
export async function canAccessPortal({
  user,
  request,
}: {
  user: GateUser
  request: Request
}): Promise<boolean> {
  if (isAdminRole(user.role)) return true

  const requestPortal = getEmailPortal(request)
  if (user.client === requestPortal) return true

  if (
    user.client === 'ihub' &&
    requestPortal === 'masai' &&
    isMobileRequest(request)
  ) {
    const meta = await fetchUserMeta(user.id)
    return hasLegacyMasaiAppAccess(meta)
  }

  return false
}

/**
 * Portal-mismatch redirect target for `user` on this request, or `null` when
 * the user belongs here (or when no distinct target domain is configured — see
 * `resolvePortalRedirect`).
 *
 * This is the "send them to their own portal" counterpart to
 * {@link canAccessPortal}: same gate, but it answers *where to* instead of
 * *whether*. Admins and grandfathered mobile users are allowed through and so
 * get `null`.
 */
export async function getPortalRedirectForUser({
  user,
  request,
  path,
}: {
  user: GateUser
  request: Request
  /** Path on the target portal — `/signin` from login, `/` from the app shell. */
  path?: string
}): Promise<PortalRedirect | null> {
  if (await canAccessPortal({ user, request })) return null
  return resolvePortalRedirect({
    userPortal: toEmailPortal(user.client),
    request,
    path,
  })
}
