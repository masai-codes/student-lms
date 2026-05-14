import { randomInt, randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { otpCodes, users } from '@/db/schema'
import { getEmailPortal, type EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { sendOtpEmail } from '@/server/auth/v2/otpEmail'
import { sendOtpSms } from '@/server/auth/v2/otpSms'

export type OtpChannel = 'email' | 'sms' | 'whatsapp'

/** WhatsApp doesn't have a real provider yet — value is the hardcoded OTP. */
const HARDCODED_WHATSAPP_OTP = '0000'

const OTP_TTL_MINUTES = 10
const BCRYPT_COST = 10

export type SendOtpInput = {
  identifier: string
  isResend?: boolean
  request: Request
}

export type SendOtpResult = {
  channel: OtpChannel
  otpSessionId: string
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

function pickPhoneChannel(portal: EmailPortal, isResend: boolean): 'sms' | 'whatsapp' {
  if (portal === 'ihub') {
    return isResend ? 'sms' : 'whatsapp'
  }
  return isResend ? 'whatsapp' : 'sms'
}

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

async function persistOtp({
  identifier,
  channel,
  otp,
}: {
  identifier: string
  channel: OtpChannel
  otp: string
}): Promise<string> {
  const sessionId = randomUUID()
  const otpHash = await hash(otp, BCRYPT_COST)
  const expiresAt = toMysqlDatetime(new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000))

  await db.insert(otpCodes).values({
    sessionId,
    identifier,
    channel,
    otpHash,
    expiresAt,
    attempts: 0,
  })

  return sessionId
}

export async function sendOtp({
  identifier,
  isResend,
  request,
}: SendOtpInput): Promise<SendOtpResult> {
  const normalized = identifier.trim().toLowerCase()
  const isEmail = isEmailIdentifier(normalized)

  const userRows = await db
    .select({ id: users.id, email: users.email, mobile: users.mobile })
    .from(users)
    .where(eq(isEmail ? users.email : users.mobile, normalized))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    throw new SendOtpError('USER_NOT_FOUND', 'User not found')
  }

  if (isEmail) {
    const otp = generateOtp()
    const otpSessionId = await persistOtp({
      identifier: normalized,
      channel: 'email',
      otp,
    })

    const portal = getEmailPortal(request)
    await sendOtpEmail({ toEmail: user.email, otp, portal })

    return { channel: 'email', otpSessionId }
  }

  const portal = getEmailPortal(request)
  const channel = pickPhoneChannel(portal, isResend === true)

  if (channel === 'sms') {
    const otp = generateOtp()
    const otpSessionId = await persistOtp({
      identifier: normalized,
      channel: 'sms',
      otp,
    })
    await sendOtpSms({ mobile: user.mobile ?? normalized, otp })
    return { channel: 'sms', otpSessionId }
  }

  const otp = HARDCODED_WHATSAPP_OTP
  const otpSessionId = await persistOtp({
    identifier: normalized,
    channel: 'whatsapp',
    otp,
  })
  return { channel: 'whatsapp', otpSessionId }
}
