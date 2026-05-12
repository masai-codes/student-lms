import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export type OtpChannel = 'email' | 'sms' | 'whatsapp'

export const HARDCODED_OTPS: Record<OtpChannel, string> = {
  email: '9999',
  sms: '1234',
  whatsapp: '0000',
}

export type SendOtpInput = {
  identifier: string
}

export type SendOtpResult = {
  channel: OtpChannel
}

export class SendOtpError extends Error {
  constructor(
    public code: 'USER_NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

function isEmailIdentifier(value: string): boolean {
  return value.includes('@')
}

function pickPhoneChannel(): 'sms' | 'whatsapp' {
  return Math.random() < 0.5 ? 'sms' : 'whatsapp'
}

export async function sendOtp({ identifier }: SendOtpInput): Promise<SendOtpResult> {
  const normalized = identifier.trim().toLowerCase()
  const isEmail = isEmailIdentifier(normalized)

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(isEmail ? users.email : users.mobile, normalized))
    .limit(1)

  if (!rows[0]) {
    throw new SendOtpError('USER_NOT_FOUND', 'User not found')
  }

  return { channel: isEmail ? 'email' : pickPhoneChannel() }
}
