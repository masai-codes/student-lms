import { eq, or } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { AuthenticatedUser } from '@/server/auth/v2/loginWithPassword'
import { HARDCODED_OTPS } from '@/server/auth/v2/sendOtp'

export type VerifyOtpInput = {
  identifier: string
  otp: string
}

export class VerifyOtpError extends Error {
  constructor(
    public code: 'USER_NOT_FOUND' | 'INVALID_OTP',
    message: string,
  ) {
    super(message)
  }
}

const VALID_OTPS = new Set(Object.values(HARDCODED_OTPS))

export async function verifyOtp({ identifier, otp }: VerifyOtpInput): Promise<AuthenticatedUser> {
  if (!VALID_OTPS.has(otp.trim())) {
    throw new VerifyOtpError('INVALID_OTP', 'Invalid OTP')
  }

  const normalized = identifier.trim().toLowerCase()

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
    })
    .from(users)
    .where(or(eq(users.email, normalized), eq(users.mobile, normalized)))
    .limit(1)

  const user = rows[0]
  if (!user) {
    throw new VerifyOtpError('USER_NOT_FOUND', 'User not found')
  }

  return user
}
