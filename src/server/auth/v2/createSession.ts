import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { getCookieDomain } from '@/server/auth/v2/cookieDomain'

const JWT_ALGORITHM = 'HS256'
const DEFAULT_TTL_HOURS = 72
const REMEMBER_ME_TTL_HOURS = 720

type CreateSessionInput = {
  userId: number
  request: Request
  rememberMe?: boolean
  source: string
}

function getCookieName(): string {
  const name = process.env.COOKIE_NAME ?? process.env.NEW_COOKIE_NAME
  if (!name) throw new Error('COOKIE_NAME (or NEW_COOKIE_NAME) env var is not set')
  return name
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY env var is not set')
  return secret
}

function extractClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? ''
}

function buildSetCookieHeader(
  name: string,
  value: string,
  opts: {
    domain?: string
    expires: Date
  },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Expires=${opts.expires.toUTCString()}`,
    `Path=/`,
    'HttpOnly',
    'Secure',
    'SameSite=None',
  ]
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  return parts.join('; ')
}

export type CreateSessionResult = {
  token: string
  setCookieHeader: string
}

export async function createSession({
  userId,
  request,
  rememberMe,
  source,
}: CreateSessionInput): Promise<CreateSessionResult> {
  const sessionId = randomUUID()

  const sanitizedPayload = {
    source,
    rememberMe: rememberMe ?? false,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    ipAddress: extractClientIp(request),
    userAgent: request.headers.get('user-agent') ?? '',
    lastActivity: Math.floor(Date.now() / 1000),
    payload: Buffer.from(JSON.stringify(sanitizedPayload)).toString('base64'),
  })

  const token = jwt.sign({ sessionId }, getJwtSecret(), { algorithm: JWT_ALGORITHM })

  const ttlHours = rememberMe ? REMEMBER_ME_TTL_HOURS : DEFAULT_TTL_HOURS
  const expires = new Date(Date.now() + ttlHours * 60 * 60 * 1000)

  const setCookieHeader = buildSetCookieHeader(getCookieName(), token, {
    domain: getCookieDomain(request),
    expires,
  })

  return { token, setCookieHeader }
}
