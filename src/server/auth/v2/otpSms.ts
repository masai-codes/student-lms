// @ts-expect-error -- '2factor' is CJS and ships without types
import TwoFactor from '2factor'

const SEND_TIMEOUT_MS = 10_000
const TEMPLATE = 'Nolan%20Admissions'

function getApiKey(): string {
  const key = process.env.OTP_2FACTOR_API_KEY?.trim()
  if (!key) {
    throw new Error('OTP_2FACTOR_API_KEY env var is not set')
  }
  return key
}

function normalizeIndianMobile(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('+91')) return trimmed.slice(3)
  if (trimmed.startsWith('91') && trimmed.length === 12) return trimmed.slice(2)
  return trimmed
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

export type SendOtpSmsArgs = {
  mobile: string
  otp: string
}

export async function sendOtpSms({ mobile, otp }: SendOtpSmsArgs): Promise<void> {
  const phoneNumber = normalizeIndianMobile(mobile)
  if (!/^\d{10}$/.test(phoneNumber)) {
    throw new Error(`Invalid Indian mobile number: ${mobile}`)
  }

  const client = new TwoFactor(getApiKey())
  await withTimeout(
    client.sendOTP(phoneNumber, { otp, template: TEMPLATE }) as Promise<unknown>,
    SEND_TIMEOUT_MS,
    '2Factor OTP request timed out',
  )
}
