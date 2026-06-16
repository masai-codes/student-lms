import { sql } from 'drizzle-orm'
import { db } from '@/db'

export async function saveProfilePicUrl(userId: number, s3Url: string): Promise<void> {
  const result = await db.execute(sql`
    SELECT id FROM profiles WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
  `)

  const rows = Array.isArray(result)
    ? (Array.isArray(result[0]) ? result[0] : result) as Array<Record<string, unknown>>
    : ((result as { rows?: Array<Record<string, unknown>> }).rows ?? [])

  if (rows.length > 0) {
    await db.execute(sql`
      UPDATE profiles
      SET meta = JSON_SET(COALESCE(meta, '{}'), '$.profile_pic', ${s3Url}),
          updated_at = NOW()
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
    `)
  } else {
    await db.execute(sql`
      INSERT INTO profiles (user_id, meta, created_at, updated_at)
      VALUES (${userId}, ${JSON.stringify({ profile_pic: s3Url })}, NOW(), NOW())
    `)
  }
}
