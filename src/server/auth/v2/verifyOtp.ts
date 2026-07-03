import { compare } from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { otpCodes, users } from '@/db/schema'
import type { AuthenticatedUser } from '@/server/auth/v2/loginWithPassword'

const MAX_ATTEMPTS = 5

export type VerifyOtpInput = {
  otpSessionId: string
  otp: string
}

export class VerifyOtpError extends Error {
  constructor(
    public code:
      | 'OTP_NOT_FOUND'
      | 'OTP_ALREADY_USED'
      | 'OTP_EXPIRED'
      | 'TOO_MANY_ATTEMPTS'
      | 'INVALID_OTP'
      | 'USER_NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt.replace(' ', 'T') + 'Z').getTime() < Date.now()
}

export async function verifyOtp({
  otpSessionId,
  otp,
}: VerifyOtpInput): Promise<AuthenticatedUser[]> {
  const bypassVerification = process.env.NODE_ENV === 'development'
  const otpRows = await db
    .select({
      id: otpCodes.id,
      identifier: otpCodes.identifier,
      channel: otpCodes.channel,
      otpHash: otpCodes.otpHash,
      expiresAt: otpCodes.expiresAt,
      attempts: otpCodes.attempts,
      usedAt: otpCodes.usedAt,
    })
    .from(otpCodes)
    .where(eq(otpCodes.sessionId, otpSessionId))
    .limit(1)

  const record = otpRows[0]
  if (!record) {
    throw new VerifyOtpError(
      'OTP_NOT_FOUND',
      'This sign-in code is no longer valid. Please request a new one.',
    )
  }

  if (record.usedAt && !bypassVerification) {
    throw new VerifyOtpError(
      'OTP_ALREADY_USED',
      'This code has already been used. Please request a new one.',
    )
  }

  if (isExpired(record.expiresAt) && !bypassVerification) {
    throw new VerifyOtpError(
      'OTP_EXPIRED',
      'This code has expired. Please request a new one.',
    )
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new VerifyOtpError(
      'TOO_MANY_ATTEMPTS',
      'Too many incorrect attempts. Please request a new code.',
    )
  }

  const match = bypassVerification
    ? true
    : await compare(otp.trim(), record.otpHash)
  if (!match) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id))
    throw new VerifyOtpError(
      'INVALID_OTP',
      'The code you entered is incorrect. Please check it and try again.',
    )
  }

  await db
    .update(otpCodes)
    .set({ usedAt: toMysqlDatetime(new Date()) })
    .where(and(eq(otpCodes.id, record.id), isNull(otpCodes.usedAt)))

  const isEmailChannel = record.channel === 'email'

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
      client: users.client,
    })
    .from(users)
    .where(eq(isEmailChannel ? users.email : users.mobile, record.identifier))

  if (userRows.length === 0) {
    throw new VerifyOtpError(
      'USER_NOT_FOUND',
      "We couldn't find an account for this code. Please check your details, or sign up.",
    )
  }

  return userRows
}
