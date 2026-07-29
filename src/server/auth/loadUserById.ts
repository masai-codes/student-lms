import { sql } from 'drizzle-orm'
import { db } from '@/db'

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
  status: string | null
  profileImage: string | null
  newLmsPagesEnabled: number | boolean | string | null
  tryNewTourSeen: number | boolean | string | null
}

/**
<<<<<<< HEAD
 * JSON_EXTRACT of a boolean can surface as true/1/"true" depending on the
 * driver; treat any of those truthy encodings as set. Anything else (including
 * an absent key → null) is false.
 */
function isMetaFlagTrue(value: number | boolean | string | null): boolean {
  return value === true || value === 1 || value === 'true'
}

/**
 * Loads the LMS user profile for a known user id (session already resolved).
 * Profile image: latest `profiles.meta.profile_pic`, then `users.meta.profile_pic`, then `users.profile_photo_path`.
=======
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
 * The club membership probe runs concurrently, so this is one round-trip of
 * latency rather than two.
>>>>>>> 0486f66a (optimize me api)
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

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    status: row.status,
    profileImageUrl: pickProfileImageUrl(row.profileImage),
    newLmsPagesEnabled: isJsonTrue(row.newLmsPagesEnabled),
    hasSeenTryNewTour: isJsonTrue(row.tryNewTourSeen),
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

export type MeUser = NonNullable<Awaited<ReturnType<typeof loadUserById>>>
