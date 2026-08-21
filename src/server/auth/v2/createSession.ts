import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { getCookieDomain } from '@/server/auth/v2/cookieDomain'
import { getCookieName, getJwtSecret } from '@/server/auth/v2/sessionConfig'

const JWT_ALGORITHM = 'HS256'
const DEFAULT_TTL_HOURS = 72
const REMEMBER_ME_TTL_HOURS = 720

type CreateSessionsInput = {
  userIds: number[]
  request: Request
  rememberMe?: boolean
  source: string
}

type CreatedSessionRecord = {
  userId: number
  sessionId: string
}

export type CreateSessionsResult = {
  sessions: CreatedSessionRecord[]
  activeUserId: number
  activeSessionId: string
  activeToken: string
  setCookieHeader: string
}

export function extractClientIp(request: Request): string {
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

export function signSessionToken(sessionId: string): string {
  return jwt.sign({ sessionId }, getJwtSecret(), { algorithm: JWT_ALGORITHM })
}

export function buildActiveCookieHeader({
  token,
  request,
  rememberMe,
}: {
  token: string
  request: Request
  rememberMe?: boolean
}): string {
  const ttlHours = rememberMe ? REMEMBER_ME_TTL_HOURS : DEFAULT_TTL_HOURS
  const expires = new Date(Date.now() + ttlHours * 60 * 60 * 1000)
  return buildSetCookieHeader(getCookieName(), token, {
    domain: getCookieDomain(request),
    expires,
  })
}

export async function createSessions({
  userIds,
  request,
  rememberMe,
  source,
}: CreateSessionsInput): Promise<CreateSessionsResult> {
  if (userIds.length === 0) {
    throw new Error('createSessions: userIds must be non-empty')
  }

  const sessionRecords: CreatedSessionRecord[] = userIds.map((userId) => ({
    userId,
    sessionId: randomUUID(),
  }))

  const linkedSessionIds =
    sessionRecords.length > 1
      ? sessionRecords.map((s) => s.sessionId)
      : undefined

  const now = new Date().toISOString()
  const ipAddress = extractClientIp(request)
  const userAgent = request.headers.get('user-agent') ?? ''
  const lastActivity = Math.floor(Date.now() / 1000)

  const rows = sessionRecords.map(({ userId, sessionId }) => {
    const payload: Record<string, unknown> = {
      source,
      rememberMe: rememberMe ?? false,
      timestamp: now,
      created_at: now,
    }
    if (linkedSessionIds) {
      payload.linkedSessionIds = linkedSessionIds
    }
    return {
      id: sessionId,
      userId,
      ipAddress,
      userAgent,
      lastActivity,
      payload: Buffer.from(JSON.stringify(payload)).toString('base64'),
    }
  })

  await db.insert(sessions).values(rows)

  const active = sessionRecords[0]
  const activeToken = signSessionToken(active.sessionId)
  const setCookieHeader = buildActiveCookieHeader({
    token: activeToken,
    request,
    rememberMe,
  })

  return {
    sessions: sessionRecords,
    activeUserId: active.userId,
    activeSessionId: active.sessionId,
    activeToken,
    setCookieHeader,
  }
}
