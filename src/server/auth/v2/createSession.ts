import { randomUUID } from 'node:crypto'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import {
  buildSessionCookieHeader,
  buildSessionTokenEntry,
  signSessionToken,
  type SessionTokenPayload,
} from '@/server/auth/v2/sessionToken'

type CreateSessionsInput = {
  userIds: number[]
  request: Request
  rememberMe?: boolean
  source: string
  /**
   * When set, the newly created session(s) are appended to this
   * already-authenticated token's `sessions` list (added to the linked
   * family) instead of starting a fresh, isolated one — used by the "add
   * another account" flow. The new session becomes the active one, same as
   * a normal sign-in.
   */
  linkTo?: SessionTokenPayload
}

export type CreatedSessionRecord = {
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

export async function createSessions({
  userIds,
  request,
  rememberMe,
  source,
  linkTo,
}: CreateSessionsInput): Promise<CreateSessionsResult> {
  if (userIds.length === 0) {
    throw new Error('createSessions: userIds must be non-empty')
  }

  const sessionRecords: CreatedSessionRecord[] = userIds.map((userId) => ({
    userId,
    sessionId: randomUUID(),
  }))

  const now = new Date().toISOString()
  const ipAddress = extractClientIp(request)
  const userAgent = request.headers.get('user-agent') ?? ''
  const lastActivity = Math.floor(Date.now() / 1000)

  const rows = sessionRecords.map(({ userId, sessionId }) => ({
    id: sessionId,
    userId,
    ipAddress,
    userAgent,
    lastActivity,
    payload: Buffer.from(
      JSON.stringify({
        source,
        rememberMe: rememberMe ?? false,
        timestamp: now,
        created_at: now,
      }),
    ).toString('base64'),
  }))

  await db.insert(sessions).values(rows)

  const active = sessionRecords[0]
  const nowSecs = Math.floor(Date.now() / 1000)
  const newEntries = sessionRecords.map((s) =>
    buildSessionTokenEntry(s.sessionId, { rememberMe, now: nowSecs }),
  )
  const tokenPayload: SessionTokenPayload = {
    sessionId: active.sessionId,
    sessions: linkTo ? [...linkTo.sessions, ...newEntries] : newEntries,
  }
  const activeToken = signSessionToken(tokenPayload)
  const activeEntry = tokenPayload.sessions.find(
    (s) => s.sessionId === active.sessionId,
  )!
  const setCookieHeader = buildSessionCookieHeader({
    token: activeToken,
    request,
    expiresAt: new Date(activeEntry.exp * 1000),
  })

  return {
    sessions: sessionRecords,
    activeUserId: active.userId,
    activeSessionId: active.sessionId,
    activeToken,
    setCookieHeader,
  }
}
