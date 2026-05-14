import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { users } from '@/db/schema'
import { hashPassword } from '@/server/auth/v2/passwordHash'

const JWT_ALGORITHM = 'HS256'

export type ResetPasswordInput = {
  token: string
  password: string
}

export class ResetPasswordError extends Error {
  constructor(
    public code: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'USER_NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

type TokenPayload = { email?: unknown; exp?: number }

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY env var is not set')
  return secret
}

export async function resetPassword({ token, password }: ResetPasswordInput): Promise<void> {
  let payload: TokenPayload
  try {
    payload = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALGORITHM] }) as TokenPayload
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ResetPasswordError('TOKEN_EXPIRED', 'Reset link has expired')
    }
    throw new ResetPasswordError('INVALID_TOKEN', 'Invalid reset token')
  }

  if (typeof payload !== 'object' || typeof payload.email !== 'string') {
    throw new ResetPasswordError('INVALID_TOKEN', 'Invalid reset token')
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1)

  if (!existing[0]) {
    throw new ResetPasswordError('USER_NOT_FOUND', 'User not found')
  }

  const hashedPassword = await hashPassword(password)

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, payload.email))
}
