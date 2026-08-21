import { compare, hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { passwordRuleError } from '@/lib/profile/validatePassword'

/** Matches the cost used by the reset-password and signup flows. */
const BCRYPT_COST = 10

export interface UpdatePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * Changes the signed-in user's password after verifying the current one.
 *
 * Identity comes from the session only — the legacy `updatePassword` mutation
 * took an `id` from the client, which meant a crafted request could rewrite
 * another user's password given their current one.
 */
export async function updatePassword(
  userId: number,
  input: UpdatePasswordInput,
): Promise<void> {
  const { currentPassword, newPassword } = input

  if (currentPassword === '')
    throw new ApiError(400, 'CURRENT_PASSWORD_REQUIRED')

  const ruleError = passwordRuleError(newPassword)
  if (ruleError) throw new ApiError(400, 'WEAK_PASSWORD', ruleError)

  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) throw new ApiError(404, 'USER_NOT_FOUND')

  const isCurrentValid = await compare(currentPassword, user.password)
  if (!isCurrentValid) throw new ApiError(400, 'INCORRECT_CURRENT_PASSWORD')

  if (await compare(newPassword, user.password)) {
    throw new ApiError(400, 'PASSWORD_UNCHANGED')
  }

  const hashed = await hash(newPassword, BCRYPT_COST)
  await db.update(users).set({ password: hashed }).where(eq(users.id, userId))
}
