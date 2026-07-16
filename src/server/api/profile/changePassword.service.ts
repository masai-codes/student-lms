import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * Validates and changes the user's password.
 *
 * Rules:
 *  - currentPassword must match the stored hash
 *  - newPassword must be at least 8 characters and contain no spaces
 *  - newPassword and confirmPassword must match
 */
export async function changePassword(
  userId: number,
  payload: ChangePasswordPayload,
): Promise<void> {
  const { currentPassword, newPassword, confirmPassword } = payload

  if (!newPassword || newPassword.length < 8) {
    throw new Error('PASSWORD_TOO_SHORT')
  }
  if (/\s/.test(newPassword)) {
    throw new Error('PASSWORD_HAS_SPACE')
  }
  if (newPassword !== confirmPassword) {
    throw new Error('PASSWORD_MISMATCH')
  }

  // Fetch current hash
  const rows = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const hash = rows[0]?.password
  if (!hash) throw new Error('USER_NOT_FOUND')

  const valid = await bcrypt.compare(currentPassword, hash)
  if (!valid) throw new Error('WRONG_CURRENT_PASSWORD')

  const newHash = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ password: newHash }).where(eq(users.id, userId))
}
