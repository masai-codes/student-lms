import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getEmailPortal } from '@/server/auth/v2/isRequestFromIHub'

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
 *   - the user is an IIT Jodhpur student signing in from the Masai mobile app
 *     (no separate IITJ app build), OR
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

  // IIT Jodhpur students sign in through the Masai mobile app — there is no
  // separate IITJ app build, so the Masai portal accepts them unconditionally
  // when the request comes from the app (`isApp=true` → `X-App-Mobile`).
  if (
    user.client === 'iitj' &&
    requestPortal === 'masai' &&
    isMobileRequest(request)
  ) {
    return true
  }

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
