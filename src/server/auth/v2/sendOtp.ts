import { randomInt, randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { otpCodes, users } from '@/db/schema'
import { getEmailPortal, type EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { sendOtpEmail } from '@/server/auth/v2/otpEmail'
import { sendOtpSms } from '@/server/auth/v2/otpSms'
import { sendOtpWhatsapp } from '@/server/auth/v2/otpWhatsapp'

export type OtpChannel = 'email' | 'sms' | 'whatsapp'

const OTP_TTL_MINUTES = 10
const BCRYPT_COST = 10

const PER_MINUTE_CAP = 4
const MINUTE_WINDOW_SECONDS = 60
const HOURLY_CAP = 10
const HOURLY_WINDOW_SECONDS = 3600

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
    public code: 'USER_NOT_FOUND' | 'RATE_LIMITED',
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

// Window checks key off expires_at, not created_at: we write expires_at in UTC
// via toMysqlDatetime, whereas created_at is set by the DB clock (unknown server
// timezone) and would skew the comparison. expires_at == sendTime + OTP TTL, so
// "sent within X seconds" == "expires_at >= now + TTL - X".
async function assertSendAllowed(identifier: string): Promise<void> {
  const ttlMs = OTP_TTL_MINUTES * 60 * 1000
  const now = Date.now()
  const hourWindowCutoff = toMysqlDatetime(
    new Date(now + ttlMs - HOURLY_WINDOW_SECONDS * 1000),
  )
  const minuteWindowCutoff = toMysqlDatetime(
    new Date(now + ttlMs - MINUTE_WINDOW_SECONDS * 1000),
  )

  const recent = await db
    .select({ expiresAt: otpCodes.expiresAt })
    .from(otpCodes)
    .where(and(eq(otpCodes.identifier, identifier), gte(otpCodes.expiresAt, hourWindowCutoff)))

  if (recent.length >= HOURLY_CAP) {
    throw new SendOtpError(
      'RATE_LIMITED',
      'Too many OTP requests. Please try again in an hour.',
    )
  }

  const lastMinuteCount = recent.filter((r) => r.expiresAt >= minuteWindowCutoff).length
  if (lastMinuteCount >= PER_MINUTE_CAP) {
    throw new SendOtpError(
      'RATE_LIMITED',
      'Too many OTP requests. Please wait a minute and try again.',
    )
  }
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

  await assertSendAllowed(normalized)

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
  const preferredChannel = pickPhoneChannel(portal, isResend === true)
  const fallbackChannel: 'sms' | 'whatsapp' = preferredChannel === 'sms' ? 'whatsapp' : 'sms'
  const targetMobile = user.mobile ?? normalized

  const otp = generateOtp()
  const deliveredChannel = await deliverPhoneOtp({
    mobile: targetMobile,
    otp,
    preferredChannel,
    fallbackChannel,
  })

  const otpSessionId = await persistOtp({
    identifier: normalized,
    channel: deliveredChannel,
    otp,
  })

  return { channel: deliveredChannel, otpSessionId }
}

async function deliverPhoneOtp({
  mobile,
  otp,
  preferredChannel,
  fallbackChannel,
}: {
  mobile: string
  otp: string
  preferredChannel: 'sms' | 'whatsapp'
  fallbackChannel: 'sms' | 'whatsapp'
}): Promise<'sms' | 'whatsapp'> {
  const dispatch = (channel: 'sms' | 'whatsapp') =>
    channel === 'sms'
      ? sendOtpSms({ mobile, otp })
      : sendOtpWhatsapp({ mobile, otp })

  try {
    await dispatch(preferredChannel)
    return preferredChannel
  } catch (primaryErr) {
    console.warn(
      `[sendOtp] primary channel "${preferredChannel}" failed; falling back to "${fallbackChannel}":`,
      primaryErr instanceof Error ? primaryErr.message : primaryErr,
    )
    try {
      await dispatch(fallbackChannel)
      return fallbackChannel
    } catch (fallbackErr) {
      console.error(
        `[sendOtp] both channels failed. primary "${preferredChannel}":`,
        primaryErr instanceof Error ? primaryErr.message : primaryErr,
        `; fallback "${fallbackChannel}":`,
        fallbackErr instanceof Error ? fallbackErr.message : fallbackErr,
      )
      throw fallbackErr
    }
  }
}
