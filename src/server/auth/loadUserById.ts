import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { clubMembers } from '@/db/schema'

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

/**
 * Loads the LMS user profile for a known user id (session already resolved).
 * Profile image: latest `profiles.meta.profile_pic`, then `users.meta.profile_pic`, then `users.profile_photo_path`.
 *
 * Server-only: touches `@/db` (mysql2). Import it exclusively from inside
 * server-fn handlers so it never reaches the client bundle.
 */
export async function loadUserById(userId: number) {
  const rows = normalizeRows<{
    id: number
    name: string
    email: string
    mobile: string | null
    role: string | null
    profileImage: string | null
    newLmsPagesEnabled: number | boolean | string | null
    tryNewTourSeen: number | boolean | string | null
  }>(
    await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.role,
        JSON_EXTRACT(u.meta, '$.new_lms_pages_enabled') AS newLmsPagesEnabled,
        JSON_EXTRACT(u.meta, '$.new_lms_try_new_tour_seen') AS tryNewTourSeen,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(pr.meta, '$.profile_pic')),
          JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.profile_pic')),
          u.profile_photo_path
        ) AS profileImage
      FROM users u
      LEFT JOIN (
        SELECT p.user_id AS userId, p.meta
        FROM profiles p
        INNER JOIN (
          SELECT user_id, MAX(id) AS latestProfileId
          FROM profiles
          WHERE deleted_at IS NULL
          GROUP BY user_id
        ) latestProfile ON latestProfile.latestProfileId = p.id
      ) pr ON pr.userId = u.id
      WHERE u.id = ${userId}
      LIMIT 1
    `),
  )

  const row = rows.at(0)
  if (row === undefined) return null

  const membershipRows = await db
    .select({ clubId: clubMembers.clubId })
    .from(clubMembers)
    .where(eq(clubMembers.userId, userId))
    .limit(1)

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    profileImageUrl: pickProfileImageUrl(row.profileImage),
    newLmsPagesEnabled:
      row.newLmsPagesEnabled === true ||
      row.newLmsPagesEnabled === 1 ||
      row.newLmsPagesEnabled === 'true',
    hasSeenTryNewTour:
      row.tryNewTourSeen === true ||
      row.tryNewTourSeen === 1 ||
      row.tryNewTourSeen === 'true',
    joinedClubId:
      membershipRows[0]?.clubId != null
        ? String(membershipRows[0].clubId)
        : null,
  }
}

export type MeUser = NonNullable<Awaited<ReturnType<typeof loadUserById>>>
