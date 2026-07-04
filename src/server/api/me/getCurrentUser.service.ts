import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

/** Minimal current-user payload — only what the client needs today. */
export interface CurrentUser {
  name: string | null
}

/** The signed-in user's lightweight profile (name for now). Null if missing. */
export async function getCurrentUser(userId: number): Promise<CurrentUser | null> {
  const rows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (rows.length === 0) return null
  return { name: rows[0].name }
}
