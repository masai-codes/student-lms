import { sql } from 'drizzle-orm'
import { db } from '@/db'

export interface UserProfile {
  id: number
  name: string
  email: string
  mobile: string | null
  profileImageUrl: string | null
}

type RawRow = {
  id: number | string | bigint
  name: string
  email: string
  mobile: string | null
  profileImage: string | null
}

function normalizeRows(result: unknown): Array<RawRow> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<RawRow>
    return result as Array<RawRow>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<RawRow> }).rows
  }
  return []
}

export async function getProfile(userId: number): Promise<UserProfile | null> {
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.mobile,
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
  `)

  const row = normalizeRows(result)[0]
  if (!row) return null

  const img = row.profileImage ? String(row.profileImage).trim() : null

  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    mobile: row.mobile ? String(row.mobile) : null,
    profileImageUrl: img && img.length > 0 ? img : null,
  }
}
