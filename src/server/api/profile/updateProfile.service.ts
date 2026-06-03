import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export interface UpdateProfilePayload {
  name?: string
  mobile?: string
}

export async function updateProfile(
  userId: number,
  payload: UpdateProfilePayload,
): Promise<void> {
  const updates: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    const trimmed = payload.name.trim()
    if (trimmed.length === 0) throw new Error('INVALID_NAME')
    updates.name = trimmed
  }

  if (payload.mobile !== undefined) {
    updates.mobile = payload.mobile.trim() || null
  }

  if (Object.keys(updates).length === 0) return

  await db.update(users).set(updates).where(eq(users.id, userId))
}
