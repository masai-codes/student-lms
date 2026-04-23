import crypto from 'node:crypto'


type BuildReferralLmsLoginRedirectUrlInput = {
  email: string
  username: string
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function hmacSha256Base64Url(message: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function createAdmissionsSsoToken(email: string, username: string, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    email,
    username,
    iat: Math.floor(Date.now() / 1000),
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const message = `${headerB64}.${payloadB64}`
  const signature = hmacSha256Base64Url(message, secret)

  return `${message}.${signature}`
}

export async function buildReferralLmsLoginRedirectUrl({
  email,
  username,
}: BuildReferralLmsLoginRedirectUrlInput): Promise<{ url: string }> {
  
  const secret = process.env.ADMISSIONS_SSO_SECRET
  if (!secret) {
    throw new Error('ADMISSIONS_SSO_SECRET is not configured')
  }

  const admissionsUrl = process.env.ADMISSIONS_SSO_BASE_URL
  if (!admissionsUrl) {
    throw new Error('ADMISSIONS_SSO_BASE_URL is not configured')
  }

  const token = createAdmissionsSsoToken(email, username, secret)
  const redirect = encodeURIComponent(`${admissionsUrl}/refer-and-earn`)
  const url = `${admissionsUrl}/lms-login?token=${encodeURIComponent(token)}&redirect=${redirect}`

  return { url }
}
