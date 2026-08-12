import { sql } from 'drizzle-orm'
import { db } from '@/db'

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown[] }).rows)
  ) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

/**
 * The mobile app is considered "installed" for a user when they have at
 * least one active device-token registration (a token is written on
 * successful app login/push registration, and flipped inactive on logout).
 */
export async function isAppInstalledForUser(userId: number): Promise<boolean> {
  const rows = normalizeRows<{ id: number }>(
    await db.execute(
      sql`SELECT id FROM user_device_tokens WHERE user_id = ${userId} AND active = 1 LIMIT 1`,
    ),
  )
  return rows.length > 0
}
