import { sql } from 'drizzle-orm'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '@/db'
import { getPortalRedirectUrl } from '@/server/auth/v2/portalRedirect'

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0] as Array<T>
    }
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/** Ambient request, or `null` when there is none (background jobs, tests). */
function currentRequest(): Request | null {
  try {
    return getRequest()
  } catch {
    return null
  }
}

function pickProfileImageUrl(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

/** `JSON_EXTRACT` of a boolean surfaces as true/1/"true" depending on the driver. */
function isJsonTrue(value: number | boolean | string | null): boolean {
  return value === true || value === 1 || value === 'true'
}

type UserRow = {
  id: number
  name: string
  email: string
  mobile: string | null
  role: string | null
  client: string | null
  status: string | null
  profileImage: string | null
  newLmsPagesEnabled: number | boolean | string | null
  tryNewTourSeen: number | boolean | string | null
  hideSwitchOption: number | boolean | string | null
}

/**
 * Loads the LMS user profile for a known user id, plus `users.status` for
 * callers that gate on deactivation.
 *
 * Profile image: latest `profiles.meta.profile_pic`, then
 * `users.meta.profile_pic`, then `users.profile_photo_path`. The latest profile
 * is resolved with a correlated `MAX(id)` subquery on `profiles.user_id` so it
 * uses that column's index — a derived `GROUP BY user_id` table cannot have the
 * outer `u.id` filter pushed into it, which made MySQL aggregate the whole
 * `profiles` table on every call (see issue #354).
 *
 * Server-only: touches `@/db` (mysql2). Import it exclusively from inside
 * server-fn handlers / API services so it never reaches the client bundle.
 */
export async function loadUserWithStatusById(userId: number) {
  const userResult = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.role,
        u.client,
        u.status,
        JSON_EXTRACT(u.meta, '$.new_lms_pages_enabled') AS newLmsPagesEnabled,
        JSON_EXTRACT(u.meta, '$.new_lms_try_new_tour_seen') AS tryNewTourSeen,
        JSON_EXTRACT(u.meta, '$.hide_switch_option') AS hideSwitchOption,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
          JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')),
          u.profile_photo_path
        ) AS profileImage
      FROM users u
      LEFT JOIN profiles pr ON pr.id = (
        SELECT MAX(p.id)
        FROM profiles p
        WHERE p.user_id = u.id AND p.deleted_at IS NULL
      )
      WHERE u.id = ${userId}
      LIMIT 1
    `)

  const row = normalizeRows<UserRow>(userResult).at(0)
  if (row === undefined) return null

  // A student holding a session for one portal can still land on another
  // portal's domain (bookmark, shared link, legacy/app `?token=` handoff).
  // Resolve where they belong here — the app shell redirects on it (see the
  // protected layout's `beforeLoad`). `null` = they're on the right domain, are
  // an admin, or no distinct target URL is configured.
  const request = currentRequest()
  const portalRedirectUrl = request
    ? await getPortalRedirectUrl({
        user: { id: row.id, role: row.role, client: row.client },
        request,
      })
    : null

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    status: row.status,
    portalRedirectUrl,
    profileImageUrl: pickProfileImageUrl(row.profileImage),
    newLmsPagesEnabled: isJsonTrue(row.newLmsPagesEnabled),
    hasSeenTryNewTour: isJsonTrue(row.tryNewTourSeen),
    hideSwitchOption: isJsonTrue(row.hideSwitchOption),
  }
}

/**
 * Same as {@link loadUserWithStatusById} without `users.status`, which is an
 * internal gating detail and must not travel to the client.
 */
export async function loadUserById(userId: number) {
  const user = await loadUserWithStatusById(userId)
  if (!user) return null
  const { status: _status, ...publicUser } = user
  return publicUser
}
